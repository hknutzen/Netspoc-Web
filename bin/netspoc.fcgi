#!/usr/local/bin/perl

use strict;
use warnings;
use FCGI;
use FCGI::ProcManager;
use JSON;
use CGI::Simple;
use CGI::Session;
use CGI::Session::Driver::file;
use Digest::MD5 qw/md5_hex/;
use String::MkPasswd qw(mkpasswd);
use Encode;
use open qw(:std :utf8);

sub usage {
    die "Usage: $0 CONFIG [:PORT | 0 [#PROC]]\n";
}

# Configuration data.
my $conf_file = shift @ARGV or usage();
my $listen = shift @ARGV;
my $nproc  = shift @ARGV;

$listen and ($listen =~ /^(?:[:]\d+|0)$/ or usage());
$nproc and ($nproc =~/^\d+$/ or usage());

$CGI::Session::Driver::file::FileName = "%s";

# Global variables.
my $program = "Netspoc JSON service";
my $VERSION = ( split ' ',
 '$Id$' )[2];

# Valid config options.
my %conf_keys = map { ($_ => 1) } 
qw(
   error_page
   netspoc_data
   password_dir
   sendmail_command
   session_dir
   show_passwd_template
   verify_fail_template
   verify_mail_template
   verify_ok_template
   );

sub abort {
    my ($msg) = @_;
    die "$msg\n";
}

sub internal_err {
    my ($msg) = @_;
    abort "internal: $msg";
}

my $config;
sub load_config {
    open( my $fh, $conf_file ) or internal_err "Can't open $conf_file: $!";
    local $/;
    $config = from_json(  <$fh>, { relaxed  => 1 } );
    
    my %required;
    for my $key (keys %conf_keys) {
        next if $conf_keys{$key} eq 'optional';
        defined $config->{$key} or abort "Missing key '$key' in $conf_file";
    }
    for my $key (keys %$config) {
        $conf_keys{$key} or abort("Invalid key '$key' in $conf_file");
    }
}

my %cache;

# ToDo: Prevent race condition, when 
# loading new objects file with old rules or assets file.
sub load_cached_json {
    my ($path) = @_;
    my $data;
    my $mtime = (stat($path))[9] 
	or die "Can't get modification time of $path\n";
    if ((($cache{$path}->{mtime}) || 0) < $mtime) {
	open (my $fh, '<', $path) or die "Can't open $path\n";
	local $/;
	$data = from_json( <$fh> );
	if ($path =~ /objects$/) {

	    # Add attribute 'name' to each object.
	    for my $name (keys %$data) {
		$data->{$name}->{name} = $name;
	    }
	}
	elsif ($path =~ m/no_nat_set$/) {

	    # Input: Array with no_nat_tags.
	    # Change array to hash.
	    $data = { map { $_ => 1 } @$data };
	}
	elsif ($path =~ m/service_lists$/) {

	    # Input: Hash with owner|users|visible => [ service_name, ..]
	    # Add hash with all service names as keys.
	    my @snames = map @$_, values %$data;
	    @{$data->{hash}}{@snames} = (1) x @snames;
	}
	elsif ($path =~/services$/) {

	    # Input: Hash mapping service names to details and rules.
	    # { s1 => { 
	    #      details => {
	    #           description => "Text",
	    #           owner => [owner1, .. ] | [":unknown"],
	    #           sub_owners => [ owner2, ..] },
	    #      rules => [
	    #        { src => [ object_names, ..],
	    #          dst => [ object_names, ..],
	    #          action => "permit|deny",
	    #          has_user => "src|dst|both",
	    #          srv => [ "ip|tcp|tcp 80|...", ..] },
	    #        ..]},
	    #   ..}
	    # Substitute object names in src and dst by objects.
	    my $objects = get_objects();
	    for my $service (values %$data) {
		for my $rule (@{ $service->{rules} }) {
		    for my $what (qw(src dst)) {
			for my $obj (@{ $rule->{$what} }) {
			    $obj = $objects->{$obj};
			}
		    }
		}
	    }
	}
	elsif ($path =~ m/users$/) {
	    
	    # Input: Hash mapping service names to user objects.
	    # { s1 => [ o1, ..], ..}
	    # Substitute object names by objects.
	    my $objects = get_objects();
	    for my $aref (values %$data) {
		for my $name (@$aref) {
		    $name = $objects->{$name};
		}
	    }
	}
	elsif ($path =~ /assets$/) {

	    # Input: Hash with
	    # { anys => {a1 => { networks => {n1 => { hosts => [h1, ..],
	    #                                         interfaces => [i1, ..]},
	    #                                 ..}
	    ######                    interfaces => [i1, ..]},
	    #            ..},
	    ######   routers => {r1 => [i1, ..],
	    #               ..}}
	    # Add attribute 'net2childs' with flattened networks hashes 
	    # of all any objects.
	    my $objects = get_objects();
	    my $anys = $data->{anys};
	    $data->{net2childs} = { map(%{ $_->{networks} }, values %$anys) };

	    # Add attribute 'any_list' with list of 'any' objects.
	    $data->{any_list} = [ map($objects->{$_}, keys %$anys) ];

	    # Add attribute 'network_list' with list of network objects.
	    $data->{network_list} = 
		[ map($objects->{$_}, keys %{ $data->{net2childs} }) ];
	    
	    # Substitute network hashes of 'any' objects by list of 
	    # network objects.
	    for my $hash (values %$anys) {
		$hash->{networks} = 
		    [ map($objects->{$_}, keys %{ $hash->{networks} }) ];
	    }

	    # Substitute child names of net2childs by objects.
	    for my $hash (values %{ $data->{net2childs} }) {
		for my $aref (values %$hash) {
		    for my $name (@$aref) {
			$name = $objects->{$name};
		    }
		}
	    }
	}
	$cache{$path}->{data} = $data;
	$cache{$path}->{mtime} = $mtime;
    }
    else {
	$data = $cache{$path}->{data};
    }
    return $data;
}

sub load_json {
    my ($path) = @_;
    $path = Encode::encode('UTF-8', "$config->{netspoc_data}/$path");
    return load_cached_json($path);
}

sub check_file {
    my ($path) = @_;
    $path = "$config->{netspoc_data}/$path";
    return -e $path;
}

sub get_objects {
    return load_json('objects');
}

sub get_no_nat_set {
    my ($owner) = @_;
    return load_json("owner/$owner/no_nat_set");
}

sub get_nat_obj {
    my ($obj, $no_nat_set) = @_;
    if (my $href = $obj->{nat}) {
	for my $tag (keys %$href) {
	    next if $no_nat_set->{$tag};
	    my $nat_ip = $href->{$tag};
	    return { %$obj, ip => $nat_ip };
	}
    }
    return undef;
}
    
sub subst_nat {
    my ($objects, $owner) = @_;
    my $no_nat_set = get_no_nat_set($owner);
    for my $obj (@$objects) {
	if (my $nat_obj = get_nat_obj($obj, $no_nat_set)) {
	    $obj = $nat_obj;
	}
    }
}

sub get_any {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $assets = load_json("owner/$owner/assets");
    return $assets->{any_list};
}

sub get_networks {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $assets = load_json("owner/$owner/assets");
    my $networks = $assets->{network_list};
    subst_nat($networks, $owner);
    return $networks;
}

sub get_hosts {
    my ($cgi, $session) = @_;
    my $net_name = $cgi->param('network') or die "Missing param 'network'\n";
    my $owner = $session->param('owner');
    my $assets = load_json("owner/$owner/assets");
    my $hosts = $assets->{net2childs}->{$net_name}->{hosts};
    subst_nat($hosts, $owner);
    return $hosts;
}

####################################################################
# Services, rules, users
####################################################################

sub service_list {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $relation = $cgi->param('relation');
    my $lists = load_json("owner/$owner/service_lists");
    my $plist;
    if (not $relation) {
	$plist = [ sort map(@$_, @{$lists}{qw(owner user visible)}) ]
    }
    else {
	$plist = $lists->{$relation};
    }
    my $services = load_json('services');
    return [ map {
	my $hash = { name => $_, %{ $services->{$_}->{details}} };

	# Convert [ owner, .. ] to "owner, .."
	$hash->{owner} = join(',', @{ $hash->{owner} });
	$hash;
    } @$plist ];
}

sub get_rules {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $sname = $cgi->param('service') or abort "Missing parameter 'service'";
    my $lists = load_json("owner/$owner/service_lists");

    # Check if owner is allowed to access this service.
    $lists->{hash}->{$sname} or abort "Unknown service '$sname'";
    my $services = load_json('services');

    # Rules reference objects. 
    # Build copy which holds IP addresses with NAT applied.
    my $no_nat_set = get_no_nat_set($owner);
    my $rules = $services->{$sname}->{rules};
    my $crules;
    for my $rule (@$rules) {
	my $crule = { %$rule };
	for my $what (qw(src dst)) {
	    $crule->{$what} = 
		[ map((get_nat_obj($_, $no_nat_set) || $_)->{ip},
		      @{ $rule->{$what} }) ];
	}
	push @$crules, $crule;
    }
    return $crules;
}

sub get_users {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $sname = $cgi->param('service') or abort "Missing parameter 'service'";
    my $path = "owner/$owner/users";
    my $sname2users = load_json($path);
    my $users = $sname2users->{$sname} or abort "Unknown service '$sname'";
    subst_nat($users, $owner);
    return $users;
}

####################################################################
# Save session data
####################################################################

my %saveparam = ( owner => 1 );

sub set_session_data {
    my ($cgi, $session) = @_;
    for my $param ($cgi->param()) {
	$saveparam{$param} or abort "Invalid param '$param'";
	my $val = $cgi->param($param);
	$session->param($param, $val);
    }
    return [];
}

####################################################################
# Email -> Admin -> Owner
####################################################################

# Get currently selected owner.
sub get_owner {
    my ($cgi, $session) = @_;
    if (my $active_owner = $session->param('owner')) {
	return [ { name => $active_owner } ];
    }
    else {
	return [];
    }
}

# Get list of all owners available for current user.
sub get_owners {
    my ($cgi, $session) = @_;
    my $email = $session->param('email');
    return load_json("email/$email/owners");
}

# Get list of all emails for given owner.
sub get_emails {
    my ($cgi, $session) = @_;
    my $owner_name = $cgi->param('owner') or abort "Missing param 'owner'";
    if ($owner_name eq ':unknown') {
	return [];
    }
    return load_json("owner/$owner_name/emails");
}


####################################################################
# Send HTML as answer
####################################################################

sub read_template {
    my ($file) = @_;
    open(my $fh, $file) or internal_err "Can't open $file: $!";
    local $/ = undef;
    my $text = <$fh>;
    close $fh;
    $text;
}

# Do simple variable substitution.
# Use syntax of template toolkit.
sub process_template {
    my ($text, $vars) = @_;
    while (my ($key, $value) = each %$vars) {
	$text =~ s/\[% $key %\]/$value/g;
    }
    $text;
}

sub get_substituted_html {
    my ($file, $vars ) = @_;
    my $text = read_template($file);
    $text = process_template($text, $vars);
    $text;
}					 
   

####################################################################
# Register / reset password
####################################################################

sub send_verification_mail {
    my ($email, $url, $ip) = @_;
    my $text = read_template($config->{verify_mail_template});
    $text = process_template($text, 
			     { email => $email, url => $url, ip => $ip });
    my $sendmail = $config->{sendmail_command};
    open(my $mail, "|$sendmail") or 
	internal_err "Can't open $sendmail: $!";
    print $mail $text;
    close $mail or warn "Can't close $sendmail: $!\n";
}

# Password is stored with CGI::Session using email as ID.
sub get_user_store {
    my ($email) = @_;
    new CGI::Session ('driver:file;id:static', $email, 
		      { Directory=> $config->{password_dir} } 
		      );
}

# Get / set password for user.
# New password is already encrypted in sub register below.
sub store_password {
    my ($email, $pass) = @_;
    my $pass_store = get_user_store($email);
    $pass_store->param('pass', $pass);
}

sub check_password  {
    my ($email, $pass) = @_;
    my $pass_store = get_user_store($email);
    $pass_store->param('pass') eq md5_hex($pass);
}

sub register {
    my ($cgi, $session) = @_;
    my $email = $cgi->param('email') or abort "Missing param 'email'";
    $email = lc $email;
    check_file("email/$email") or abort "Unknown email '$email'";
    my $base_url = $cgi->param( 'base_url' ) 
	or abort "Missing param 'base_url' (Activate JavaScript)";
    check_attack($email);
    my $token = md5_hex(localtime, $email);
    my $pass = mkpasswd() or internal_err "Can't generate password";

    # Store encrypted password in session until verification.
    my $reg_data = { user => $email, pass => md5_hex($pass), token => $token };
    $session->expire('register', '1d');
    $session->param('register', $reg_data);
    my $url = "$base_url/verify?email=$email&token=$token";

    # Send remote address to the recipient to allow tracking of abuse.
    my $ip = $cgi->remote_addr();
    set_attack($email);
    send_verification_mail ($email, $url, $ip);
    return get_substituted_html($config->{show_passwd_template},
				{ pass => $cgi->escapeHTML($pass) });
}

sub verify {
    my ($cgi, $session) = @_;
    my $email = $cgi->param('email') or abort "Missing param 'email'";
    my $token = $cgi->param('token') or abort "Missing param 'token'";
    my $reg_data =  $session->param('register');
    if ($reg_data and
	$reg_data->{user} eq $email and
	$reg_data->{token} eq $token) 
    {
	store_password($email, $reg_data->{pass});
	$session->clear('register');
	return get_substituted_html($config->{verify_ok_template}, {})
    }
    else {
	return get_substituted_html($config->{verify_fail_template}, {});
    }
}					 
    
####################################################################
# Login
####################################################################

# Wait for 10, 20, .., 300 seconds after submitting wrong password.
sub set_attack {
    my ($email) = @_;
    my $store = get_user_store($email);
    my $wait = $store->param('login_wait') || 5;
    $wait *= 2;
    $wait = 300 if $wait > 300;
    $store->param('login_wait', $wait);
    $store->param('failed_time', time());
    $wait;
}

sub check_attack {
    my ($email) = @_;
    my $store = get_user_store($email);
    my $wait = $store->param('login_wait');
    return if not $wait;
    sleep(5);
    my $remain = $store->param('failed_time') + $wait - time();
    if ($remain > 0) {
	abort("Wait for $remain seconds after wrong password" );
    }
}

sub clear_attack {
    my ($email) = @_;
    my $store = get_user_store($email);
    $store->clear('login_wait');
}

sub login {
    my ($cgi, $session) = @_;
    logout($cgi, $session);
    my $email = $cgi->param('email') or abort "Missing param 'email'";
    $email = lc $email;
    check_file("email/$email") or abort "Unknown email '$email'";
    my $pass = $cgi->param('pass') or abort "Missing param 'pass'";
    my $app_url = $cgi->param('app') or abort "Missing param 'app'";
    check_attack($email);
    if (not check_password($email, $pass)) {
	my $wait = set_attack($email);
	sleep(5);
	abort "Login failed, wait $wait seconds";
    }
    clear_attack($email);
    $session->param('email', $email);
    $session->clear('user');		# Remove old, now unused param.
    $session->expire('logged_in', '30m');
    $session->param('logged_in', 1);
    return $app_url;
}

sub logged_in {
    my ($session) = @_;
    return $session->param('logged_in');
}

# Validate active owner. 
# Email could be removed from any owner role at any time in netspoc data.
sub known_owner {
    my ($session) = @_;
    my $email = $session->param('email') || $session->param('user');
    my $active_owner = $session->param('owner') || '';
    return grep { $active_owner eq $_->{name} } 
    @{ load_json("email/$email/owners") };
}

sub logout {
    my ($cgi, $session) = @_;
    $session->clear('logged_in');
    return [];
}

####################################################################
# Request handling
####################################################################

sub decode_params {
    my ($cgi) = @_;
    for my $param ($cgi->param()) {
	my $val =  Encode::decode('UTF-8', $cgi->param($param));
	$cgi->param($param, $val);
    }
}

my %path2sub =
    (

     # Default: user must be logged in, send JSON data.
     # - anon: anonymous user is allowed
     # - html: send html 
     # - redir: send redirect
     # - owner: logged in user must have selected a valid owner
     login         => [ \&login,         { anon => 1, redir => 1, 
					   create_cookie => 1, } ],
     register      => [ \&register,      { anon => 1, html  => 1, 
					   create_cookie => 1, } ],
     verify        => [ \&verify,        { anon => 1, html  => 1, } ],
     logout        => [ \&logout,        {} ],
     get_owner     => [ \&get_owner,     {} ],
     get_owners    => [ \&get_owners,    {} ],
     set           => [ \&set_session_data, {} ],
     service_list  => [ \&service_list,  { owner => 1, } ],
     get_emails    => [ \&get_emails,    { owner => 1, } ],
     get_rules     => [ \&get_rules,     { owner => 1, } ],
     get_users     => [ \&get_users,     { owner => 1, } ],
     get_networks  => [ \&get_networks,  { owner => 1, } ],
     get_hosts     => [ \&get_hosts,     { owner => 1, } ],
      ); 

sub handle_request {
    my $cgi = CGI::Simple->new();
    my $flags = { html => 1};
    my $cookie;

    # Catch errors.
    eval {
	my $session = CGI::Session->load("driver:file", $cgi,
					 { Directory => 
					       $config->{session_dir} }
					 );
	my $path = $cgi->path_info();
	$path =~ s:^/::;
	my $info = $path2sub{$path} or abort "Unknown path '$path'";
	(my $sub, $flags) = @$info;
	if (not $flags->{anon}) {
	    if (logged_in($session)) {
		if ($flags->{owner}) {
		    if (not known_owner($session)) {
			abort "Owner must be selected";
		    }
		}
	    }
	    else {
		abort "Login required";
	    }
	}
	if ($session->is_empty()) {
	    if ($flags->{create_cookie}) {
		$session->new();
	    }
	    else {
		die "Cookies must be activated\n";
	    }
	}
	$cookie = $cgi->cookie( -name    => $session->name,
				-value   => $session->id,
				-expires => '+1y' );
	decode_params($cgi);
	my $data = $sub->($cgi, $session);
	if ($flags->{html}) {
	    print $cgi->header( -type => 'text/html',
				-charset => 'utf-8', 
				-cookie => $cookie);
	    print $data;	    
	}
	elsif ($flags->{redir}) {
	    print $cgi->redirect( -uri => $data, 
				  -cookie => $cookie);
	}
	else
	{
	    if (ref $data eq 'ARRAY') {
		$data = {
		    totalCount => scalar @$data,
		    records => $data
		    };
	    }
	    elsif ($data) {
		$data = { data => $data, };
	    }
	    else {
		$data = {};
	    }
	    $data->{success} = JSON::true;
		
	    print $cgi->header( -type    => 'text/x-json',
				-charset => 'utf-8',
				-cookie  => $cookie);
#	    print encode_json($data),
	    print to_json($data, {utf8 => 1, pretty => 1});    
	}
    };
    if ($@) {
	my $msg = $@;
	$msg =~ s/\n$//;
	if ($flags->{html} or $flags->{redir}) {
	    print $cgi->header( -status  => 200,
				-type    => 'text/html',
				-charset => 'utf-8',
				-cookie => $cookie);
	    print get_substituted_html($config->{error_page}, {msg => $msg});
	}
	else
	{
	    my $result = { success => JSON::false, msg => $msg };
	    print $cgi->header( -status  => 500,
				-type    => 'text/x-json',
				-charset => 'utf-8', );
	    print encode_json($result), "\n";
	}
    }
}

sub run {
    my ( %params ) = @_;

    # Read from STDIN by default.
    my $sock = 0;

    if ($params{listen}) {
	my $old_umask = umask;
	umask(0);
	$sock = FCGI::OpenSocket( $params{listen}, 100 )
	    or die "failed to open FastCGI socket; $!";
	umask($old_umask);
    }

    # Send STDERR to stdout or to the web server
    my $error = $params{keep_stderr} ? \*STDOUT : \*STDERR;

    my $request =
      FCGI::Request( \*STDIN, \*STDOUT, $error, \%ENV, $sock,
		     FCGI::FAIL_ACCEPT_ON_INTR ,
      );

    my $nproc = $params{nproc};
    my $proc_manager;
    if ($nproc) {
	$proc_manager = FCGI::ProcManager->new
	    (
	     {
		 n_processes => $params{nproc},
		 pid_fname   => $params{pidfile},
	     }
	     );
    }

    $nproc && $proc_manager->pm_manage();
    
    # Give each child its own RNG state.
    srand;

    while ( $request->Accept >= 0 ) {
        $nproc && $proc_manager->pm_pre_dispatch();
        $params{request_handler}->();
        $nproc && $proc_manager->pm_post_dispatch();
    }
}

####################################################################
# Start server
####################################################################

load_config();

# Tell parent that we have initialized successfully.
if (my $ppid = $ENV{PPID}) {
    print STDERR "Sending USR2 signal to $ppid\n";
    kill 'USR2', $ppid;
}

run (
     # - listen on Port or 
     # - read from STDIN when started by external proc manager
     listen => $listen,

     # Start FCGI::ProcManager with n processes.
     nproc => $nproc,

     request_handler => \&handle_request,
     );
     
