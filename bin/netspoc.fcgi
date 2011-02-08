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
use Netspoc;

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
    open( my $fh, $conf_file ) or die "Can't open $conf_file: $!\n";
    my $content = do { local $/; <$fh> };
    close $fh;
    my $json = new JSON;
    $json->relaxed(1);
    $config = $json->decode($content);
    
    my %required;
    for my $key (keys %conf_keys) {
        next if $conf_keys{$key} eq 'optional';
        defined $config->{$key} or abort "Missing key '$key' in $conf_file";
    }
    for my $key (keys %$config) {
        $conf_keys{$key} or abort("Invalid key '$key' in $conf_file");
    }
}

sub is_numeric { 
    my ($value) = @_;
    $value =~ /^\d+$/; 
}

sub ip_for_object {
    my ($obj) = @_;
    if ( Netspoc::is_network( $obj ) ) {
	if ( is_numeric($obj->{ip}) ) {
	    join(' ', print_ip($obj->{ip}), print_ip($obj->{mask}));
	}
    }
    elsif ( Netspoc::is_host( $obj ) ) {
	if ( my $range = $obj->{range} ) {
	    join('-', map { print_ip($_) } @$range);
	}
	else {
	    print_ip($obj->{ip});
	}
    }
    elsif ( Netspoc::is_interface( $obj ) ) {
	if ( is_numeric( $obj->{ip} ) ) {
	    print_ip( $obj->{ip} );
	}

	# 'negotiated'
	else {
	    "$obj->{ip}: $obj->{name}";
	}
    }
    elsif ( Netspoc::is_any( $obj ) ) {
	print_ip( 0 );
    }
    else {
	"$obj->{name}";
    }
}

sub ip_for_objects {
    my ($objects) = @_;
    [ map { ip_for_object($_) } @$objects ];
}

my %unknown;
# Check if all arguments are 'eq'.
sub equal {
    return 1 if not @_;
    my $first = $_[0];
    return not grep { $_ ne $first } @_[ 1 .. $#_ ];
}

sub owner_for_object {	
    my ($object) = @_;
    if (my $owner_obj = $object->{owner}) {
	(my $name = $owner_obj->{name}) =~ s/^owner://;
	return $name;
    }
    return;
}

sub owners_for_objects {	
    my ($objects) = @_;
    my %owners;
    for my $object ( @$objects ) {
	if (my $owner_obj = $object->{owner}) {
	    (my $name = $owner_obj->{name}) =~ s/^owner://;
	    $owners{$name} = $name;
	}
    }
    return [ values %owners ];
}

sub expand_auto_intf {
    my ($src_aref, $dst_aref) = @_;
    for (my $i = 0; $i < @$src_aref; $i++) {
	my $src = $src_aref->[$i];
	next if not is_autointerface($src);
	my @new;
	for my $dst (@$dst_aref) {
	    push @new, Netspoc::path_auto_interfaces($src, $dst);
	}

	# Substitute auto interface by real interface.
	splice(@$src_aref, $i, 1, @new)
    }
}


sub find_visibility {
    my ($owners, $uowners) = @_;
    my $visibility;
    my %hash = map { $_ => 1} @$owners;
    my @extra_uowners = grep { not $hash{$_} } @$uowners;
    my @DA_extra = grep({ $_ =~ /^DA_/ } @extra_uowners);
    my @other_extra = grep({ $_ !~ /^DA_/ } @extra_uowners);
			   
    # No known owner or owner of users.
    if (not @$owners and not @$uowners) {
	# Default: private
    }
    # Set of uowners is subset of owners.
    elsif (not @extra_uowners) {
	# Default: private
    }
    # Restricted visibility
    elsif (@other_extra <= 2) {
	if (@DA_extra >= 3) {
	    $visibility = 'DA_*';
	}
    }
    else {
	$visibility = '*';
    }
    $visibility;
}

my $policy_info;

sub setup_policy_info {
    Netspoc::info("Setup policy info");
    for my $policy (values %policies) {
	my $pname = $policy->{name};

	my $users = $policy->{expanded_user} =
	    Netspoc::expand_group($policy->{user}, "user of $pname");

	# Non 'user' objects.
	my @objects;

	# Check, if policy contains a coupling rule with only "user" elements.
	my $is_coupling = 0;

	for my $rule (@{ $policy->{rules} }) {
	    my $has_user = $rule->{has_user};
	    if ($has_user eq 'both') {
		$is_coupling = 1;
		next;
	    }
	    for my $what (qw(src dst)) {

		next if $what eq $has_user;
		my $all = 
		    $rule->{"expanded_$what"} =
		    Netspoc::expand_group($rule->{$what}, "$what of $pname");
		push(@objects, @$all);
	    }
	}

	# Expand auto interface to set of real interfaces.
	expand_auto_intf(\@objects, $users);
	expand_auto_intf($users, \@objects);

	# Take elements of 'user' object, if policy has coupling rule.
	if ($is_coupling) {
	    push @objects, @$users;
	}

	# Remove duplicate objects;
	my %objects = map { $_ => $_ } @objects;
	@objects = values %objects;

	$policy->{all_ip} = ip_for_objects(\@objects);
	map { ($_ = $_->{name}) =~ s/^owner://; } @{ $policy->{owners} };
	my $owners = $policy->{owners};
	my $uowners = $is_coupling ? [] : owners_for_objects($users);
	$policy->{uowners} = $uowners;

	# Für Übergangszeit aus aktueller Benutzung bestimmen.
	$policy->{visible} ||= find_visibility($owners, $uowners);
	$policy->{visible} and $policy->{visible} =~ s/\*$/.*/;
    }
}

####################################################################
# Networks of current owner
####################################################################

sub get_networks {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my @result;
    for my $obj (values %networks, values %hosts) {
	$obj->{disabled} and next;
	my $obj_owner = owner_for_object($obj) or next;
	if($obj_owner eq $owner) {

	    # Nur die Hosts anzeigen, die einen eigenen Owner haben.
	    if (my $network = $obj->{network}) {
		my $net_owner = owner_for_object($network);
		next if $net_owner and $net_owner eq $owner;
	    }
	    push @result, { name => $obj->{name},
			    ip => ip_for_object($obj), };
	}
    }
    return \@result;
}

sub get_hosts {
    my ($cgi, $session) = @_;
    my $net_name = $cgi->param('network') or die "Missing param 'network'\n";
    my $owner = $session->param('owner');

    # Ignore request with host.
    $net_name =~ s/^network:// or return [];
    my $network = $networks{$net_name} or die "Unknown network";
    my $net_owner = owner_for_object($network);
    $net_owner and $net_owner eq $owner or die "Not your network";
    return [ map { { name => $_->{name},
		     ip =>  ip_for_object($_) } } 
	     @{ $network->{hosts} } ];
}

####################################################################
# Services, rules, users
####################################################################

sub is_visible {
    my ($owner, $policy) = @_;
    grep({ $_ eq $owner } @{ $policy->{owners} }) and 'owner' or
	grep({ $_ eq $owner } @{ $policy->{uowners} }) and 'user' or
	$policy->{visible} and $owner =~ /^$policy->{visible}/ and 'visible';
}

sub service_list {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my @result;
    my $relation = $cgi->param('relation');
    for my $policy (values %policies) {
	my $visible = is_visible($owner, $policy) || '';
	if ($relation ? $relation eq $visible : $visible) {
	    (my $pname = $policy->{name}) =~ s/policy://;
	    my $owner = join (',', @{ $policy->{owners} });
	    push(@result, 
		 {
		     name => $pname,
		     description => $policy->{description},
		     ips => $policy->{all_ip},
		     owner => $owner,
		 });
	}
    }
    return \@result;
}

sub check_owner {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $pname = $cgi->param('service') or abort "Missing parameter 'service'";
    my $policy = $policies{$pname} or abort "Unknown policy";
    is_visible($owner, $policy) or abort "Policy not visible for owner";
    return $policy;
}

sub proto_descr {
    my ($protocols) = @_;
    my @result;
    for my $proto0 (@$protocols) {
	my $protocol = $proto0;
	$protocol = $protocol->{main} if $protocol->{main};
	my $desc = my $ptype = $protocol->{proto};
	if ($ptype eq 'tcp' or $ptype eq 'udp') {
	    my $port_code = sub ( $$ ) {
		my ($v1, $v2) = @_;
		if ($v1 == $v2) {
		    return $v1;
		}
		elsif ($v1 == 1 and $v2 == 65535) {
		    return '';
		}
		else {
		    return "$v1-$v2";
		}
	    };
	    my $sport  = $port_code->(@{ $protocol->{src_range}->{range} });
	    my $dport  = $port_code->(@{ $protocol->{dst_range}->{range} });
	    if ($sport) {
		$desc .= " $sport:$dport";
	    }
	    elsif ($dport) {
		$desc .= " $dport";
	    }
	}
	elsif ($ptype eq 'icmp') {
	    if (defined(my $type = $protocol->{type})) {
		if (defined(my $code = $protocol->{code})) {
		    $desc .= " $type/$code";
		}
		else {
		    $desc .= " $type";
		}
	    }
	}
	if (my $flags = $protocol->{flags}) {
	    for my $key (sort keys %$flags) {
		if ($key eq 'src' or $key eq 'dst') {
		    for my $part (sort keys %{$flags->{$key}}) {
			$desc .= ", ${key}_$part";
		    }
		}
		else {
		    $desc .= ", $key";
		}
	    }
	}
	push @result, $desc;
    }
    \@result;
}

sub get_rules {
    my ($cgi, $session) = @_;
    my $policy = check_owner($cgi, $session);
    return [ 
	     map {
		 { 
		     action => $_->{action},
		     has_user => $_->{has_user},
		     
		     # ToDo: Expand auto_interfaces.
		     src => ip_for_objects($_->{expanded_src}),
		     dst => ip_for_objects($_->{expanded_dst}),
		     srv => proto_descr(Netspoc::expand_services($_->{srv}, 
								 "rule in $_")),
		 }
	     } @{ $policy->{rules} }
	     ];
}

sub get_user {
    my ($cgi, $session) = @_;
    my $policy = check_owner($cgi, $session);
    my @users = @{ $policy->{expanded_user} };

    my $active_owner = $session->param('owner');

    # User isn't owner but only uses policy.
    # Only show owner's users.
    if (not grep({ $_ eq $active_owner } @{ $policy->{owners} })) {
	@users =  grep { my $owner = owner_for_object($_); 
			 $owner && $owner eq $active_owner }
	@users;
    }
    return [ map { { name => $_->{name},
		     ip =>  ip_for_object($_) } } 
	     @users ];
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
# find Email -> Admin -> Owner
####################################################################
my %email2admin;
my %email2owners;

sub setup_email2owners {
    for my $name ( keys %owners ) {
	my $owner = $owners{$name};
	for my $admin ( @{ $owner->{admins} } ) {
	    push @{ $email2owners{$admin->{email}} },$name;
	}
    }
}

# Netspoc.pm already checks, that one email addresses isn't used 
# at multiple admins.
sub setup_email2admin {
    for my $admin ( values %admins ) {
	$email2admin{$admin->{email}} = $admin;
    }
}

# Get currently selected owner.
sub get_owner {
    my ($cgi, $session) = @_;
    my $user = $session->param('user');
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
    my $user = $session->param('user');
    my $owners = $email2owners{$user};
    return [ map({ { name => $_ } } sort @$owners) ];
}

sub get_emails {
    my ($cgi, $session) = @_;
    my $active_owner = $session->param('owner');
    my $owner = $owners{$active_owner} || [];
    return [ map { $_->{email } } @{ $owner->{admins} } ];
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
    my ($user, $url) = @_;
    my $text = read_template($config->{verify_mail_template});
    $text = process_template($text, { user => $user, url => $url });
    my $sendmail = $config->{sendmail_command};
    open(my $mail, "|$sendmail") or 
	internal_err "Can't open $sendmail: $!";
    print $mail $text;
    close $mail or warn "Can't close $sendmail: $!\n";
}

# Password is stored with CGI::Session using email as ID.
sub get_user_store {
    my ($user) = @_;
    new CGI::Session ('driver:file;id:static', $user, 
		      { Directory=> $config->{password_dir} } 
		      );
}

# Get / set password for user.
# New password is already encrypted in sub register below.
sub store_password {
    my ($user, $pass) = @_;
    my $pass_store = get_user_store($user);
    $pass_store->param('pass', $pass);
}

sub check_password  {
    my ($user, $pass) = @_;
    my $pass_store = get_user_store($user);
    $pass_store->param('pass') eq md5_hex($pass);
}

sub register {
    my ($cgi, $session) = @_;
    my $user = $cgi->param( 'user' ) or abort "Missing param 'user'";
    my $admin = $email2admin{$user} or abort "Unknown user '$user'";
    my $base_url = $cgi->param( 'base_url' ) 
	or abort "Missing param 'base_url' (Activate JavaScript)";
    my $token = md5_hex(localtime, $user);
    my $pass = mkpasswd() or die "Can't generate password";

    # Store encrypted password in session until verification.
    my $reg_data = { user => $user, pass => md5_hex($pass), token => $token };
    $session->expire('register', '1d');
    $session->param('register', $reg_data);
    my $url = "$base_url/verify?user=$user&token=$token";
    send_verification_mail ($user, $url);
    return get_substituted_html($config->{show_passwd_template},
				{ pass => $cgi->escapeHTML($pass) });
}

sub verify {
    my ($cgi, $session) = @_;
    my $user = $cgi->param('user') or abort "Missing param 'user'";
    my $token = $cgi->param('token') or abort "Missing param 'token'";
    my $reg_data =  $session->param('register');
    if ($reg_data and
	$reg_data->{user} eq $user and
	$reg_data->{token} eq $token) {
	store_password($user, $reg_data->{pass});
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
sub login {
    my ($cgi, $session) = @_;
    logout($cgi, $session);
    my $user = $cgi->param( 'user' ) or abort "Missing param 'user'";
    my $admin = $email2admin{$user} or abort "Unknown user '$user'";
    my $pass = $cgi->param( 'pass' ) or abort "Missing param 'pass'";
    my $app_url = $cgi->param( 'app' ) or abort "Missing param 'app'";
    check_password($user, $pass) or abort "Login failed";
    $session->param('user', $user);
    $session->expire('logged_in', '30m');
    $session->param('logged_in', 1);
    return $app_url;
}

sub logged_in {
    my ($session) = @_;
    return $session->param('logged_in');
}

# Validate active owner. 
# User could be removed from any owner role at any time.
sub known_owner {
    my ($session) = @_;
    my $user = $session->param('user');
    my $active_owner = $session->param('owner') || '';
    return grep { $active_owner eq $_ } @{ $email2owners{$user} };
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
     get_user      => [ \&get_user,      { owner => 1, } ],
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
	$cookie = $cgi->cookie( -name   => $session->name,
				-value  => $session->id );
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

####################################################################
# Initialize Netspoc data
####################################################################
sub init_data {

    load_config();

    # Set global config variable of Netspoc to store attribute 'description'.
    store_description(1);
    read_file_or_dir( $config->{netspoc_data} );
    order_services();
    link_topology();
    mark_disabled();
    distribute_nat_info();
    find_subnets();
    setany();
    setpath();
    set_policy_owner();
    setup_email2owners();
    setup_email2admin();
    setup_policy_info();
    Netspoc::info("Ready");
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

init_data();

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
     
