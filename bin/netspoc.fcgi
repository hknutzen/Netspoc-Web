#!/usr/local/bin/perl -I /home/heinz/Netspoc/misc -I /home/heinz/Netspoc/lib

# Usage: $0 [:PORT | 0 [#PROC]]\n";

use strict;
use warnings;
use FCGI;
use FCGI::ProcManager;
use JSON;
use CGI::Simple;
use CGI::Session;
use Encode;
use Readonly;
use Netspoc;

# Constants.
Readonly::Scalar my $NETSPOC_DATA => '/home/heinz/netspoc';
#Readonly::Scalar my $NETSPOC_DATA => '/home/heinz/cut';

# Global variables.
my $program = "Netspoc JSON service";
my $VERSION = ( split ' ',
 '$Id$' )[2];

sub is_numeric { 
    my ($value) = @_;
    $value =~ /^\d+$/; 
}

sub ip_for_objects {
    my ($objects) = @_;
    [ map {
	if ( Netspoc::is_network( $_ ) ) {
	    if ( is_numeric($_->{ip}) ) {
		print_ip($_->{ip});
	    }
	}
	elsif ( Netspoc::is_host( $_ ) ) {
	    if ( my $range = $_->{range} ) {
		join('-', map { print_ip( $_ ) } @$range);
	    }
	    else {
		print_ip($_->{ip});
	    }
	}
	elsif ( Netspoc::is_interface( $_ ) ) {
	    if ( is_numeric( $_->{ip} ) ) {
		print_ip( $_->{ip} );
	    }

	    # 'negotiated'
	    else {
		"$_->{ip}: $_->{name}";
	    }
	}
	elsif ( Netspoc::is_any( $_ ) ) {
	    print_ip( 0 );
	}
	else {
	    "$_->{name}";
	}
    } @$objects ];
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
# Services, rules, users
####################################################################

sub is_visible {
    my ($owner, $policy) = @_;
    grep({ $_ eq $owner } @{ $policy->{owners} }, @{ $policy->{uowners} })
	or $policy->{visible} and $owner =~ /^$policy->{visible}/;
}

sub service_list {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my @result;
    my $relation = $cgi->param('relation');
    for my $policy (values %policies) {
	my $is_owner = grep({ $_ eq $owner } @{ $policy->{owners} });
	my $is_user = grep({ $_ eq $owner } @{ $policy->{uowners} });
	my $is_visible = $policy->{visible} and $owner =~ /^$policy->{visible}/;
	my $add;
	if (not $relation) {
	    $add = $is_owner || $is_user || $is_visible;
	}
	elsif ($is_owner) {
	    $add = $relation eq 'owner';
	}
	elsif ($is_user) {
	    $add = $relation eq 'user';
	}
	elsif ($is_visible) {
	    $add = $relation eq 'visible';
	}
	if ($add) {
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
    \@result;
}

sub check_owner {
    my ($cgi, $session) = @_;
    my $owner = $session->param('owner');
    my $pname = $cgi->param('service') 
	or return (undef, error_data("Missing parameter 'service'"));
    $pname = Encode::decode('UTF-8', $pname);
    my $policy = $policies{$pname}
    or return (undef, error_data ("Unknown policy"));
    if (not is_visible($owner, $policy)) {
	return (undef, error_data("Policy not visible for owner"));
    }
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
    my ($policy, $err) = check_owner($cgi, $session);
    return $err if (not $policy);
    [ 
      map {
	  { 
	      action => $_->{action},
	      has_user => $_->{has_user},
	      
	      # ToDo: Expand auto_interfaces.
	      src => ip_for_objects($_->{expanded_src}),
	      dst => ip_for_objects($_->{expanded_dst}),
	      srv => proto_descr(Netspoc::expand_services($_->{srv}, 						      "rule in $_")),
	  }
      } @{ $policy->{rules} }
      ];
}

sub get_user {
    my ($cgi, $session) = @_;
    my ($policy, $err) = check_owner($cgi, $session);
    return $err if (not $policy);

    # User is owner of policy.
    my $active_owner = $session->param('owner');
    if (grep({ $_ eq $active_owner } @{ $policy->{owners} })) {
	return [ map { { ip =>  $_ } } 
		 @{ ip_for_objects($policy->{expanded_user}) } ];
    }

    # User isn't owner but only uses policy.
    else {
	[ map { { ip =>  $_ } } 
	  @{ ip_for_objects
		 [
		  grep { my $owner = owner_for_object($_); 
			 $owner && $owner eq $active_owner }
		  @{ $policy->{expanded_user} } ] } ];
    }
	
}

####################################################################
# Save session data
####################################################################

my %saveparam = ( owner => 1 );

sub set_session_data {
    my ($cgi, $session) = @_;
    for my $param ($cgi->param()) {
	if ($saveparam{$param}) {
	    my $val =  Encode::decode('UTF-8', $cgi->param($param));
	    $session->param($param, $val);
	}
	else {
	    return error_data("Invalid param $param");
	}
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

sub get_owner {
    my ($cgi, $session) = @_;
    my $user = $session->param('user');
    my $active_owner = $session->param('owner');
    my $owners = $email2owners{$user};
    [ map({ { name => $_, active => $_ eq $active_owner ? JSON::true : JSON::false } }
	  @$owners) ];
}

sub get_emails {
    my ($cgi, $session) = @_;
    my $active_owner = $session->param('owner');
    my $owner = $owners{$active_owner} || [];
    [ map { $_->{email } } @{ $owner->{admins} } ];
}

####################################################################
# Login
####################################################################
sub login {
    my ($cgi, $session) = @_;
    my $user = $cgi->param( 'user' ) or
	return error_data("Missing param 'user'");
    my $admin = $email2admin{$user} or
	return error_data("Unknown user '$user'");
#    my $pass = $cgi->param( 'pass' );
#    return error_data("Login failed") unless $admin->{pass} eq $pass;
    my $s_user = $session->param('user') || '';
    if ($s_user ne $user) {
	$session->param('owner', '');
	$session->param('user', $user);
    }
    elsif (not defined $session->param('owner')) {
	$session->param('owner', '');
    }
    $session->param('logged_in', 1);
    $session->expire('logged_in', '30m');
    return [];
}

sub logged_in {
    my ($session) = @_;

    # Validate active owner. 
    # User could be removed from any owner role at any time.
    my $user = $session->param('user') || '';
    my $active_owner = $session->param('owner') || '';
    if (not grep { $active_owner eq $_ } @{ $email2owners{$user} }) {
	$session->param('owner', '');
    }
    return $session->param('logged_in');
}

sub logout {
    my ($cgi, $session) = @_;
    $session->clear('logged_in');
    return [];
}

####################################################################
# Request handling
####################################################################
my %path2sub = 
    ( 
     #'/login'        => \&login,		# Handled separately.
      '/logout'       => \&logout,
      '/get_owner'    => \&get_owner,
      '/set'          => \&set_session_data,
      '/service_list' => \&service_list,
      '/get_emails'   => \&get_emails,
      '/get_rules'    => \&get_rules,
      '/get_user'     => \&get_user,

      # For testing purposes.
      '/test'   => sub { my ($cgi) = @_; return { params => $cgi->raw()  } },
      ); 

sub handle_request {
#    my $request = shift;
#    local *STDIN; open STDIN, '<', \$request->read_stdin;
#    local %ENV = %{$request->params};

    my $cgi = CGI::Simple->new();    
    my $session = new CGI::Session ($cgi);
    my $path = $cgi->path_info();
    my $data;
    if ($path eq '/login') {
	$data = login($cgi, $session);
    }
    elsif (logged_in($session)) {
	my $sub = $path2sub{$path};
	$data = $sub 
	     ? $sub->($cgi, $session)
	     : error_data("Unknown path '$path'");
    }
    else {
	$data = error_data("Login required");
    }
    if (ref $data eq 'ARRAY') {
	$data = {
	    success => JSON::true,
	    totalCount => scalar @$data,
	    records => $data
	    };
    }
    my $cookie = $cgi->cookie( -name   => $session->name,
			       -value  => $session->id );
#    $request->respond(
##		      encode_json($data),
# 		      to_json($data, {utf8 => 1, pretty => 1}), 
# 		      'Content-Type' => 'application/x-json',
# 		      'Set-Cookie' => $cookie,
# 		      );
    print $cgi->header( -type   => 'application/x-json',
			-cookie => $cookie, 
			);
#		      encode_json($data),
    print to_json($data, {utf8 => 1, pretty => 1});    
}

sub error_data {
    my ($msg) = @_;
    return { success => JSON::false,
	     msg => $msg,
	 };
}

####################################################################
# Initialize Netspoc data
####################################################################
sub init_data {

    # Set global config variable of Netspoc to store attribute 'description'.
    $store_description = 1;
    read_file_or_dir( $NETSPOC_DATA );
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

    # send STDERR to stdout or the web server
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

my $listen = shift @ARGV;
my $nproc  = shift @ARGV;

run (
     # - listen on Port or 
     # - read from STDIN when started by external proc manager
     listen => $listen,

     # Start FCGI::ProcManager with n processes.
     nproc => $nproc,

     request_handler => \&handle_request,
     );
     
