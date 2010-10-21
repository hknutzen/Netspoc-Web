#!/usr/local/bin/perl

use strict;
use warnings;
use AnyEvent;
use AnyEvent::FCGI;
use AnyEvent::Strict;
use JSON;
use CGI::Minimal;
use POSIX ();
use POSIX 'setsid';
use Fcntl;
use Readonly;
use File::Spec ();
use File::Basename ();
use Netspoc;

# Constants.
Readonly::Scalar my $NETSPOC_DATA => '/home/heinz/netspoc';

# Global variables.
my $program = "Netspoc JSON service";
my $VERSION = ( split ' ',
 '$Id$' )[2];
my $policy_info;

sub say ( @ ) { print @_, "\n"; }

####################################################################
# Fill policy_info hash containing policies, IPs and owners.
####################################################################
my %email2admin;
my %admin2owners;
my %name2object = 
    (
     host      => \%hosts,
     network   => \%networks,
     interface => \%interfaces,
     any       => \%anys,
     group     => \%groups,
     area      => \%areas,
     );

sub fill_hashes {
    for my $name ( keys %owners ) {
	my $owner = $owners{$name};
	for my $admin ( @{$owner->{admins}} ) {
	    my $admin_email = $admin->{email};
	    $admin2owners{$admin_email}->{$name} = 1;
	}
    }
    for my $admin ( values %admins ) {
	$email2admin{$admin->{email}} = $admin;
    }
    for my $key (sort keys %policies) {
	my $policy = $policies{$key};
	my $pname = $policy->{name};
	# 'user' objects.
	my $users = Netspoc::expand_group($policy->{user}, "user of $pname");
	# Non 'user' objects.
	my @objects;
	# 'user' is src, dst or both.
	my %user_is;
	for my $rule (@{ $policy->{rules} }) {
	    for my $what (qw(src dst)) {
		for my $parts (@{ $rule->{$what} }) {
		    my $context = "$what of $pname";
		    my ($type, $name, $ext) = @$parts;
		    my $is_user; 
		    # user
		    if ( $type eq 'user') {
			$is_user = 1;
		    }
		    # any:[user], network:[user]
		    elsif (ref $name and @$name == 1 and 
			   $name->[0]->[0] eq 'user') 
		    {
			$is_user = 1;
		    }
		    # any:[..]
		    elsif ($type eq 'any' and ref $name) {
			my $sub_objects = 
			    Netspoc::expand_group1([ $parts ], 
						   "$type:[..] of $context");
			push @objects, @$sub_objects
			}
		    # interface:...
		    elsif ($type eq 'interface') {
			# interface:[..].[all|auto]
			if (ref $ext) {
			    my ($selector, $managed) = @$ext;
			    if (my $router = $routers{$name}) {
				if ($selector eq 'all') {
				    push @objects, @{ $router->{interfaces} };
				}
				else {
				    push @objects, 
				    Netspoc::get_auto_intf $router;
				}
			    }
			    else {
				Netspoc::warn_msg
				    "Can't resolve '$type:$name.[$selector]'",
				    " in $context";
			    }
			}
			elsif (my $interface = $interfaces{"$name.$ext"}) {
			    push @objects, $interface;
			}
			else {
			    Netspoc::warn_msg 
				"Can't resolve '$type:$name.$ext' in $context";
			}
		    }
		    # type:name
		    elsif (my $object = $name2object{$type}->{$name}) {
			if (is_network $object or is_host $object) {
			    push @objects, $object;
			}
			elsif (is_group $object) {
			    my $elements;
			    if ($object->{is_used}) {
				$elements = $object->{expanded_clean};
			    }
			    else {
				$object->{is_used} = 1;
				$elements = 
				    Netspoc::expand_group1 $object->{elements}, 
				    "$type:$name", 'clean_autogrp';
				$object->{expanded_clean} = $elements;
			    }
			    push @objects, @$elements if $elements;
			}
			else {
			    Netspoc::warn_msg 
				"Unexpected $object->{name} in $context";
			}
		    }
		    else {
			Netspoc::warn_msg 
			    "Can't resolve '$type:$name' in $context";
		    }
		    # Remember, if user is src and/or dst.
		    # But ignore user if service is echo or echo reply.
		    if ($is_user) {
			my $services = 
			    Netspoc::expand_services($rule->{srv}, $context);
			my $only_ping = 1;
			for my $service (@$services) {
			    if(not ($service->{proto} eq 'icmp' and
				    defined $service->{type} and
				    ($service->{type} == 0 or 
				     $service->{type} == 8)))
			    {
				$only_ping = 0;
			    }
			}
			$only_ping or $user_is{$what} = 1;
		    }
		}
	    }
	}

	# Remove duplicate objects;
	my %objects = map { $_ => $_ } @objects;
	@objects = values %objects;

	# We have non-user objects for this policy.
	# Now find IPs and owner for those objects.
	$pname =~ s/policy://;
	my $all_ips;
	my $owner;
	my %seen_owners;
	for my $object ( @objects ) {
	    my $ip = ip_for_object( $object );
	    push @$all_ips, $ip if $ip;
	    if ( my $obj = $object->{owner} ) {
		(my $name = $obj->{name}) =~ s/^owner://;
		if ( $seen_owners{$name} ) {
		    $owner = 'multiple owners';
		}
		else {
		    $owner = $name;
		    $seen_owners{$owner} = $owner;
		}
	    }
	}
	$owner ||= 'unknown';
	$policy_info->{$pname} = {
	    name => $pname,
	    ips => $all_ips,
	    owner => $owner
	    };
    }
}

sub is_numeric { 
    my ($value) = @_;
    $value =~ /^\d+$/; 
}

sub ip_for_object {
    my ($object) = @_;
    if ( Netspoc::is_network( $object ) ) {
	if ( is_numeric($object->{ip}) ) {
	    return print_ip($object->{ip});
	}
    }
    elsif ( Netspoc::is_host( $object ) ) {
	if ( my $range = $object->{range} ) {
	    return join '-', map { print_ip( $_ ) } @$range;
	}
	else {
	    return print_ip($object->{ip});
	}
    }
    elsif ( Netspoc::is_interface( $object ) ) {
	if ( is_numeric( $object->{ip} ) ) {
	    return print_ip( $object->{ip} );
	}
    }
    elsif ( Netspoc::is_any( $object ) ) {
	return print_ip( 0 );
    }
    else {
	warn "NO IP FOR $object";
    }
    return;
}

####################################################################
# Handle FCGI requests, serving back json for URL requests.
####################################################################
sub search {
    my ($type, $crit) = @_;
    my $result = [];
    for my $key ( sort keys %{$policy_info} ) {
	my $value = $policy_info->{$key};
	if ( $value->{$type} =~ /$crit/ ) {
	    push @$result, $value;
	}
    }
    return $result;
}

sub create_search_sub {
    my ($type) = @_;
    return sub {
	my ($cgi) = @_;
	my $crit = $cgi->param( 'criteria' ) || '.*';
	my $result = search($type, $crit);
	return {
	    success => 'true',
	    totalCount => scalar( @$result ),
	    records => $result
	    };
    }
}

sub find_admin {
    my ($cgi) = @_;
    my $user = $cgi->param( 'user' );
    my $admin = $email2admin{$user};
    return unless $admin;
#    my $pass = $cgi->param( 'pass' );
#    return unless $admin->{pass} eq $pass;
    my $owner_hash = $admin2owners{$user};
    return { owner => [ keys %$owner_hash ] };
}

my %path2sub = 
    ( '/owner'   => create_search_sub( 'owner' ),
      '/service' => create_search_sub( 'name' ),
      '/ips'     => create_search_sub( 'ips' ),
      '/user'    => \&find_admin,

      # For testing purposes.
      '/test'   => sub { my ($cgi) = @_; return { params => $cgi->raw()  } },
      ); 

sub handle_request {
    my $request = shift;
    local *STDIN; open STDIN, '<', \$request->read_stdin;
    local %ENV = %{$request->params};

    # Reset cached values of previous call.
    CGI::Minimal->reset_globals;
    my $cgi = CGI::Minimal->new;
    my $path = $ENV{PATH_INFO};
    my $sub = $path2sub{$path} or die "Unknown path $path\n";
    my $data = $sub->($cgi) or return;
    $request->respond(encode_json($data), 'Content-Type' => 'application/x-json');
}

my $reload_fifo = '/home/heinz/policy-shop/reload.socket';

####################################################################
# Initialize Netspoc.
####################################################################
sub init_data {
    read_file_or_dir( $NETSPOC_DATA );
    order_services();
    link_topology();
    mark_disabled();
    distribute_nat_info();
    find_subnets();
    setany();
    setpath();
    fill_hashes();
}

sub daemonize {
    chdir '/' or die "Can't chdir to /: $!";
    open STDIN, '/dev/null' or die "Can't read /dev/null: $!";
    open STDOUT, '>/dev/null' or die "Can't write to /dev/null: $!";
    defined(my $pid = fork) or die "Can't fork: $!";
    exit if $pid;
    die "Can't start a new session: $!" if setsid == -1;
    open STDERR, '>&STDOUT' or die "Can't dup stdout: $!";
}

my $child_ok;

# Start a child process.
# STDOUT of child process is connected to $child_fh of parent process.
# The parent waits for input from the child.
# If child sends the string "OK", the parent knows that the child has
# initialized successfully.

my $child_fh;
my $forking;
sub do_fork {
    defined(my $pid = open($child_fh, "-|")) or die "Can't fork child: $!\n";
    if ($pid) {			

	# Parent process.
	# Register a third event handler, which waits for input from the child.
	# If input is "OK", terminate the event loop and exit.
	# On any other input, the child is assumed to have failed.
        my $child_watcher;
	$child_watcher = AnyEvent->io ( fh => $child_fh, poll => 'r', 
					   cb => sub {
					       my $text = <$child_fh>;
					       if ($text && $text eq 'OK') {
						   $child_ok->send;
					       }
					       else {
						   $forking = 0;
						   $child_watcher = undef;
					       }
					   });
    }
    else {
			
	# Child process.
	# Start a fresh copy of this program which reads the changed data.
        exec($0) or die "Can't exec myself ($0): $!\n";
    }
}

# Read data into memory.
# Data is used to answer FCGI requests.
init_data();

# print should work unbuffered.
$| = 1;

# Send message to parent process on STDOUT,
# telling that this process was initialized successfully.
print 'OK';

#daemonize();

# Start event handling after parent has got the "OK" message.
# The parent is now terminating and doesn't process events any more.
$child_ok = AnyEvent->condvar;

# Create the reload fifo special file.
if (not -p $reload_fifo) {    
    if (-e $reload_fifo) {	# but a something else
        die "Won't overwrite $reload_fifo\n";
    } 
    else {
        POSIX::mkfifo($reload_fifo, 0666) 
            or die "can't mknod $reload_fifo: $!";
      }
}

# Open a unix filehandle to the reload fifo file for AnyEvent
my $reload_fh;
sysopen($reload_fh, $reload_fifo, O_NONBLOCK | O_RDONLY) 
    or die "Can't read $reload_fifo: $!";

# Register two event handlers.

# Handle reload request.
my $reload_watcher = AnyEvent->io ( 
    fh => $reload_fh, poll => 'r', 
    cb => sub {
    <$reload_fh>;
    if(not $forking) {
        $forking = 1;
        warn "do_fork\n";
        do_fork();
    }
});

# Handle FCGI request.
my $fcgi = new AnyEvent::FCGI
    (
     socket => '/var/lib/apache2/fastcgi/test.sock',
     on_request => \&handle_request,
     );

# Start the event loop.
# This program terminates if the do_fork() sends to $child_ok.
$child_ok->recv;
warn "Terminating\n";
