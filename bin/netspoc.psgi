#!/usr/local/bin/perl

use strict;
use warnings;
use JSON;
use Plack::Util;
use Plack::Request;
use Plack::Response;
use Plack::Builder;
use Plack::Middleware::XForwardedFor;
use CGI::Session;
use CGI::Session::Driver::file;
use Digest::MD5 qw/md5_hex/;
use Digest::SHA qw/sha256_hex/;
use String::MkPasswd qw(mkpasswd);
use Crypt::SaltedHash;
use Encode;

use FindBin;
use lib $FindBin::Bin;
use Load_Config;
use User_Store;
use Template;
use JSON_Cache;
use Policy_Diff;


sub abort {
    my ($msg) = @_;
    die "$msg\n";
}

sub internal_err {
    my ($msg) = @_;
    abort "internal: $msg";
}

sub intersect {
    my @non_compl = @_;
    my $result;
    for my $element (@{pop @non_compl}) {
	$result->{$element} = $element;
    }
    for my $set (@non_compl) {
	my $intersection;
	for my $element (@$set) {
	    if($result->{$element}) {
		$intersection->{$element} = $element;
	    }
	}
	$result = $intersection;
    }
    return [ keys %$result ];
}
  
# Delete an element from an array reference.
# Return 1 if found, 0 otherwise.
sub aref_delete {
    my ($aref, $elt) = @_;
    for (my $i = 0 ; $i < @$aref ; $i++) {
        if ($aref->[$i] eq $elt) {
            splice @$aref, $i, 1;
            return 1;
        }
    }
    return 0;
}
  
my $config;

sub get_policy {

    # Read modification date of and policy number from file current/POLICY 
    # Content is: # pnnnnn #...
    my $policy_path = "$config->{netspoc_data}/current/POLICY";
    my ($date, $time) = split(' ', qx(date -r $policy_path '+%F %R'));
    my $policy = qx(cat $policy_path);
    $policy =~ m/^# (\S+)/ or abort "Can't find policy name in $policy_path";
    $policy = $1;
    return [ { current => 1,
	       policy => $policy,
	       date => $date,
	       time => $time,
	   }];
}

sub get_history {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner');
    my $current = get_policy()->[0];
    my $current_policy = $current->{policy};
    my @result = ($current);
    

    # Add data from RCS rlog output.
    # Parse lines of this format:
    # ...
    # ----------------------------
    # revision 1.4  ...
    # date: 2011-04-18 11:23:01+02; ...
    # <one or more lines of log message>
    # ----------------------------
    # ...
    # We take date, time and  first line of the log message.
    my $RCS_path = "$config->{netspoc_data}/RCS/owner/$owner/POLICY,v";
    if (-e $RCS_path) {
	my @rlog = qx(rlog -zLT $RCS_path);

	while (my $line = shift @rlog) {
	    my($date, $time) = ($line =~ /^date: (\S+) (\d+:\d+)/) or next;
	    my $policy = shift @rlog;
	    chomp $policy;

	    # If there wasn't added a new policy today, current policy
	    # is available duplicate in RCS.
	    next if $policy eq $current_policy;
	    push(@result, { policy => $policy,
			    date => $date,
			    time => $time,
			});
	}
    }
    return \@result;
}

sub current_policy {
    return get_policy()->[0]->{policy};
}

my $selected_history;
sub select_history {
    my ($req, $history_needed) = @_;

    # Read requested version date from cgi paramter.
    if ($selected_history = $req->param('history')) {
	$history_needed or abort "Must not send parameter 'history'";
    }

    # Read current version tag from current/POLICY.
    else {
	$history_needed and abort "Missing parameter 'history'";
	$selected_history = current_policy();
    }
    return;
}

my $cache;

sub load_json {
    my ($path) = @_;
    return $cache->load_json_version($selected_history, $path);
}

sub get_objects {
    return load_json('objects');
}

sub get_no_nat_set {
    my ($owner) = @_;
    return load_json("owner/$owner/no_nat_set");
}

sub get_nat_obj {
    my ($obj_name, $no_nat_set) = @_;
    my $objects = get_objects();
    my $owner2alias = load_json('owner2alias');
    my $obj = $objects->{$obj_name};
    if (my $href = $obj->{nat} and $no_nat_set) {
	for my $tag (keys %$href) {
	    next if $no_nat_set->{$tag};
	    my $nat_ip = $href->{$tag};
	    $obj = { %$obj, ip => $nat_ip };
            last;
	}
    }
    if ( $obj->{owner} ) {
        if (my $alias = $owner2alias->{$obj->{owner}}) {
            $obj = { %$obj, owner_alias => $alias };
        }
    }
    return $obj;
}
    
sub get_nat_obj_list {
    my ($obj_names, $owner) = @_;
    my $no_nat_set = get_no_nat_set($owner);
    return [ map { get_nat_obj($_, $no_nat_set) } @$obj_names ];
}

sub get_any {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner');
    my $assets = load_json("owner/$owner/assets");
    my $any_names = $assets->{any_list};
    return get_nat_obj_list($any_names, $owner);
}

sub get_networks {
    my ($req, $session) = @_;
    my $owner  = $req->param('active_owner');
    my $chosen = $req->param('chosen_networks');
    my $assets = load_json("owner/$owner/assets");
    my $network_names = $assets->{network_list};
    if ( $chosen ) {
	$network_names = untaint_networks( $chosen, $assets );
    }
    return get_nat_obj_list( $network_names, $owner );
}

sub get_hosts {
    my ($req, $session) = @_;
    my $net_name = $req->param('network') or abort "Missing param 'network'";
    my $owner = $req->param('active_owner');
    my $assets = load_json("owner/$owner/assets");
    my $child_names = $assets->{net2childs}->{$net_name};
    return get_nat_obj_list($child_names, $owner);
}

sub get_services_and_rules {
    my ($req, $session) = @_;
    my $owner        = $req->param('active_owner');
    my $srv_list     = $req->param('services');
    my $disp_prop    = $req->param('display_property');
    my $expand_users = $req->param('expand_users');
    my $lists    = load_json("owner/$owner/service_lists");
    my $assets   = load_json("owner/$owner/assets");
    my $data = [];
    my $param_services = [ split ",", $srv_list ];
    $disp_prop ||= 'ip';
    
    # Untaint display property.
    my %allowed = (
	name => 1,
	ip   => 1
	);
    abort "Unknown display property $disp_prop"
	unless $allowed{$disp_prop};

    # Untaint services passed as params by intersecting
    # with known service-names from json-data.
    my $service_names = intersect( [ map { @$_ } 
                                         @{$lists}{qw(owner user visible)} ],
				   $param_services );

  SERVICE:
    for my $sname ( @{$service_names} ) {
	my $rules =
            get_rules_for_owner_and_service( $req, $owner, $sname );
	my $users =
            get_users_for_owner_and_service( $req, $owner, $sname );
	my $user_props = [];
	if ( $expand_users ) {
	    map { push @$user_props, $_->{$disp_prop} } @$users;
	}
	else {
	    $user_props = [ 'User' ];
	}

	for my $rule ( @$rules ) {
	    push @$data, {
		service => $sname,
		action  => $rule->{action},
		src     => $rule->{has_user} eq 'src' ?
		    $user_props : $rule->{src},
		dst     => $rule->{has_user} eq 'dst' ?
		    $user_props : $rule->{dst},
		proto   => $rule->{prt},
	    };
	}
    }
    return $data;
}

sub get_services_owners_and_admins {
    my ($req, $session) = @_;
    my $owner     = $req->param('active_owner');
    my $srv_list  = $req->param('services');
    my $lists     = load_json("owner/$owner/service_lists");
    my $assets    = load_json("owner/$owner/assets");
    my $services  = load_json('services');
    my $service_names = [ split ",", $srv_list ];
    my $data = [];

    my $owner2alias = load_json('owner2alias');
    my $hash = $lists->{hash};
  SERVICE:
    for my $srv_name (@{$service_names}) {
        
        # Check if owner is allowed to access this service.
        $hash->{$srv_name} or abort "Unknown service '$srv_name'";

        my $details = $services->{$srv_name}->{details};
	my @owners = ($details ->{sub_owner} || (), @{ $details->{owner} });

	my $admins;
	for my $o (@owners) {
	    my $emails = load_json("owner/$o/emails");
	    push @$admins, map { $_->{email} } @$emails;
	}
	push @$data, {
	    service   => $srv_name,
	    srv_owner => [ map { $owner2alias->{$_} || $_ } @owners ],
	    admins    => $admins,
	};
    }
    return $data;
}

sub relevant_objects_for_networks {
    my ( $network_names, $assets ) = @_;
    $network_names ||
        internal_err "No networks specified in request for relevant objects!";
    $assets ||
        internal_err "No assets given in request for relevant objects!";

    my %relevant_objects = 
        map({ $_ => 1 } (@$network_names, 
                         map({ @{ $assets->{net2childs}->{$_} } }
                             @$network_names)));
    return \%relevant_objects;
}


####################################################################
# Services, rules, users
####################################################################

sub service_list {
    my ($req, $session) = @_;
    my $owner       = $req->param('active_owner');
    my $relation    = $req->param('relation');
    my $search      = $req->param('search_string');
    my $chosen      = $req->param('chosen_networks');
    my $search_own  = $req->param('search_own');
    my $search_used = $req->param('search_used');
    my $lists    = load_json("owner/$owner/service_lists");
    my $assets   = load_json("owner/$owner/assets");
    my $services = load_json('services');
    my $relevant_objects;
    my $network_names;
    my $plist;

    # Make a real copy not a reference.
    my $copy = { %$lists };

    # Are we in restricted mode with only selected networks?
    if ( $chosen ) {

	# Reset user and owner on copy of $lists.
	$copy->{user}  = [];
	$copy->{owner} = [];

	# Untaint: Intersect chosen networks with all networks
	# within area of ownership.
	$network_names = untaint_networks( $chosen, $assets );

	# Only collect services that are relevant for chosen
	# networks stored in $network_names.
        $relevant_objects =
            relevant_objects_for_networks( $network_names, $assets );

      USER_SERVICE:
	for my $pname ( sort @{$lists->{user}} ) {

            # Check if network or any of its contained resources
            # is user of current service.
            if ($search_used || !$relation || $relation eq 'user') {
                my $users = get_users_for_owner_and_service($req, $owner, $pname,
                    $network_names, $relevant_objects);
                for my $user ( @$users ) {
                    if ($relevant_objects->{$user->{name}}) {
                        push @{$copy->{user}}, $pname;
                        next USER_SERVICE;
                    }
                }
            }
        }
      OWNER_SERVICE:
	for my $pname ( sort @{$lists->{owner}} ) {

            # Check src and dst for own services.
            if ($search_own || !$relation || $relation eq 'owner') {
                for my $rule (@{$services->{$pname}->{rules}}) {
                    for my $what (qw(src dst)) {
			for my $obj (@{ $rule->{$what} }) {
			    if ($relevant_objects->{$obj}) {
				push @{$copy->{owner}}, $pname;
				next OWNER_SERVICE;
			    }
			} 
		    }
		}
	    }
	}
    }

    # $plist is filled here but is overridden in code
    # handling search, IF we are in search mode.
    if ( not $relation ) {
	$plist = [ sort map { @$_ } @{$copy}{qw(owner user visible)} ]
    }
    else {
	$plist = $copy->{$relation};
    }

    # Searching services?
    if ( $search ) {

	# Strip leading and trailing whitespaces.
	$search =~ s/^\s+//;
	$search =~ s/\s+$//;

	# Search case-sensitive?
	if ( !$req->param('search_case_sensitive') ) {
	    $search = "(?i)$search";
	}

	# Exact matches only?
	if ( $req->param('search_exact') ) {
	    $search = '^' . $search . '$';
	}

	# Reset $plist, it gets filled with search results below.
	$plist = [];
	my @search_in = ();
	if ( $search_own ) {
	    push @search_in, 'owner';
	}
	if ( $search_used ) {
	    push @search_in, 'user';
	}
	if ( $req->param('search_visible') ) {
	    push @search_in, 'visible';
	}
	my $search_plist = [ sort map { @$_ } @{$copy}{ @search_in } ];

      SERVICE:
	for my $sname ( @$search_plist ) {

	    # Check if service name itself contains $search.
	    if ( $sname =~ /$search/ ) {
		push @$plist, $sname;
		next SERVICE;
	    }

	    if ( $req->param('search_in_rules') ) {
		my %lookup = (
			      'src'  => 'dst',
			      'dst'  => 'src',
			      'both' => 'both'
			      );
		# Get rules for current owner and service.
		my $rules =
                    get_rules_for_owner_and_service( $req, $owner, $sname );
		if ( $rules ) {
		    for my $r ( @$rules ) {
			# Search in src or dst.
			for my $item ( @{$r->{$lookup{$r->{has_user}}}} ) {
			    if ( $item =~ /$search/ ) {
				push @$plist, $sname;
				next SERVICE;
			    }
			}
			# Search in protocol.
			for my $item ( @{$r->{prt}} ) {
			    if ( $item =~ /$search/ ) {
				push @$plist, $sname;
				next SERVICE;
			    }
			}
		    }
		}
	    }
	    if ( $req->param('search_in_user') ) {
		my $users = get_users_for_owner_and_service( $req, $owner, $sname,
                    $network_names, $relevant_objects );
		if ( $users ) {
		    for my $u ( @$users ) {
			if ( $u->{ip}  &&  $u->{ip} =~ /$search/ ) {
			    push @$plist, $sname;
			    next SERVICE;
			}
			elsif ( $u->{name}  &&  $u->{name} =~ /$search/ ) {
			    push @$plist, $sname;
			    next SERVICE;
			}
			elsif ( $u->{owner}  &&  $u->{owner} =~ /$search/ ) {
			    push @$plist, $sname;
			    next SERVICE;
			}
		    }
		}
	    }
	    if ( $req->param('search_in_desc') ) {
		if ( my $desc = $services->{$sname}->{details}->{description} ) {
		    if ( $desc =~ /$search/ ) {
			push @$plist, $sname;
			next SERVICE;
		    }
		}
	    }
	}
    }

    my $owner2alias = load_json('owner2alias');
    my $add_alias = sub {
        my ($owner) = @_;
        my $v = { name => $owner }; 
        if (my $a = $owner2alias->{$owner}) {
            $v->{alias} = $a;
        }
        return $v
    };
    return [ map {
	my $hash = { name => $_, %{ $services->{$_}->{details}} };

	# Add alias name to 
        # 1. list of owners, 
        # 2. optional single sub_owner (= service owner)
	$hash->{owner} = [ map { $add_alias->($_) } @{ $hash->{owner} } ];
	$hash->{sub_owner} and 
            $hash->{sub_owner} = $add_alias->($hash->{sub_owner});
	$hash;
    } @$plist ];
}

# Untaint: Intersect chosen networks with all networks
# within area of ownership.
# Return untainted networks as array-ref.
sub untaint_networks {
    my ( $chosen, $assets ) = @_;
    my $chosen_networks = [ split /,/, $chosen ];
    my $network_names = $assets->{network_list};
    return intersect( $chosen_networks, $network_names  );
}

sub get_users_for_owner_and_service {
    my ( $req, $owner, $sname, $networks, $relevant_objects ) = @_;
    my $chosen = $req->param('chosen_networks');
    my $lists  = load_json("owner/$owner/service_lists");

    # Get user for current owner and service.
    my $path = "owner/$owner/users";
    my $sname2users = load_json( $path );
    
    # Empty user list is not exported intentionally.
    my $user_objs = $sname2users->{$sname} || [];

    # Are we in restricted mode with only selected networks?
    # Only filter users for own services.
    if ( $chosen && $lists->{hash}->{$sname} eq 'user' ) {
        my $assets = load_json("owner/$owner/assets");
        $networks ||= untaint_networks( $chosen, $assets );

	# Only collect users that are relevant for chosen
	# networks stored in $network_names.
        $relevant_objects ||=
            relevant_objects_for_networks( $networks, $assets );
        @{$user_objs} = grep { $relevant_objects->{$_} } @$user_objs;
    }
    return get_nat_obj_list( $user_objs, $owner);
}

my %src_or_dst =  (
    src  => 'dst',
    dst  => 'src',
    both => 1
    );
sub get_rules_for_owner_and_service {
    my ( $req, $owner, $sname ) = @_;
    my $chosen = $req->param('chosen_networks');
    my $prop   = $req->param('display_property');
    my $lists  = load_json("owner/$owner/service_lists");
    $prop ||= 'ip';  # 'ip' as default property to display
    my $relevant_objects;

    # Check if owner is allowed to access this service.
    $lists->{hash}->{$sname} or abort "Unknown service '$sname'";
    my $services = load_json('services');

    my $no_nat_set = get_no_nat_set($owner);
    my $rules = $services->{$sname}->{rules};

    # If networks were selected and own services are displayed,
    # filter rules to those containing these networks
    # (and their child objects).
    if ( $chosen && $lists->{hash}->{$sname} eq 'owner' ) {
        my $assets = load_json("owner/$owner/assets");
        my $network_names = untaint_networks( $chosen, $assets );

	# Get relevant objects for currently chosen networks.
        $relevant_objects =
            relevant_objects_for_networks( $network_names, $assets );
        $rules = [ grep {
            $_->{has_user} ne 'both' &&
                grep({ $relevant_objects->{$_} } 
                     @{$_->{$src_or_dst{$_->{has_user}}}});
        } @$rules ];
    }

    # Rules reference objects by name.
    # Build copy with 
    # - names substituted by objects
    # - IP addresses in object with NAT applied.
    my $crules;
    for my $rule (@$rules) {
	my $crule = { %$rule };
	for my $what (qw(src dst)) {
	    $crule->{$what} = 
		[ map( { (get_nat_obj($_, $no_nat_set))->{$prop} }
		      @{ $rule->{$what} }) ];
	}
	push @$crules, $crule;
    }
    return $crules;
}

sub get_rules {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner');
    my $sname = $req->param('service') or abort "Missing parameter 'service'";
    return get_rules_for_owner_and_service( $req, $owner, $sname );
}

sub get_users {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner');
    my $sname = $req->param('service') or abort "Missing parameter 'service'";
    return get_users_for_owner_and_service( $req, $owner, $sname );
}

my %text2css = ( '+' => 'icon-add',
                 '-' => 'icon-delete',
                 '!' => 'icon-page_edit',
                 );

my %toplevel_sort = (objects => 1, services => 2, );

sub get_diff {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner');
    my $version = $req->param('version') or 
        abort "Missing parameter 'version'";
    my $changed = 
        Policy_Diff::compare($cache, $version, $selected_history, $owner);
    return if not $changed;

    # Convert to ExtJS tree.
    # Node: Hash with attributes "text" and 
    # - either "leaf: true"
    # - or "children: [ .. ]"
    # Add css class to special +,-,! nodes.
    # Toplevel: array of nodes
    my $node = sub {
        my ($text, $childs) = @_;
        my $result = {};
        if (my $css = $text2css{$text}) {
            $result->{iconCls} = $css;
        }
        else {
            $result->{text} = $text;
        }
        if ($childs) {
            $result->{children} = $childs;
        }
        else {
            $result ->{leaf} = JSON::true;
        }
        return $result;
    };
    my $convert;
    $convert = sub {
        my ($in) = @_;
        my $type = ref($in);
        if (not $type) {
            return $node->($in);
        }
        elsif ($type eq 'HASH') {
            my @result;
            for my $key (sort keys %$in) {
                my $val = $convert->($in->{$key});
                push @result, $node->($key, 
                                      ref($val) eq 'ARRAY' ? $val : [$val]);
            }
            return \@result;
        }
        elsif ($type eq 'ARRAY') {
            return [ map { $convert->($_) } @$in ];
        }
    };
    return
        [ sort { ($toplevel_sort{$a->{text}} || 999) <=> ($toplevel_sort{$b->{text}} || 999) }
          @{ $convert->($changed) } ];
}

sub get_diff_mail {
    my ($req, $session) = @_;
    my $email = $session->param('email');
    return([{ send => JSON::false }]) if $email eq 'guest';
    my $owner = $req->param('active_owner');
    my $store = User_Store::new($config, $email);
    my $aref  = $store->param('send_diff') || [];
    return([{ send => 
                     (grep { $_ eq $owner } @$aref) 
                   ? JSON::true 
                   : JSON::false }]);
}

sub set_diff_mail {
    my ($req, $session) = @_;
    my $email = $session->param('email');
    abort("Can't send diff for user 'guest'") if $email eq 'guest';
    validate_owner($req, $session, 1);
    my $owner = $req->param('active_owner');
    my $send  = $req->param('send');
    my $store = User_Store::new($config, $email);
    my $aref = $store->param('send_diff') || [];
    my $changed;

    # Javascript truth value is coded as string, because it is transferred
    # as parameter and not as JSON data.
    if ($send eq 'true') {
        if (! grep { $_ eq $owner } @$aref) {
            push(@$aref, $owner);
            $changed = 1;
        }
    }
    else {
        $changed = aref_delete($aref, $owner);
    }
    $store->param('send_diff', $aref) if $changed;
    return([]);
}

####################################################################
# Save session data
####################################################################

my %saveparam = ( owner => 1 );

sub set_session_data {
    my ($req, $session) = @_;
    for my $param ($req->param) {
	$saveparam{$param} or abort "Invalid param '$param'";
	my $val = $req->param($param);
	$session->param($param, $val);
    }
    $session->flush();
    return [];
}

####################################################################
# Email -> Admin -> Owner
####################################################################

# Get currently selected owner.
sub get_owner {
    my ($req, $session) = @_;
    my $owner2alias = load_json('owner2alias');
    if (my $active_owner = $session->param('owner')) {
        my $v = { name => $active_owner };
        if (my $a = $owner2alias->{$active_owner}) { 
            $v->{alias} = $a; 
        }
	return [ $v ];
    }
    else {
	return [];
    }
}

# Get list of all owners available for current email.
# Return array of hashes { name => $name, [ alias => $alias ] }
sub get_owners {
    my ($req, $session) = @_;
    my $email = $session->param('email');
    my $email2owners = load_json('email');
    my $owner2alias = load_json('owner2alias');
    return [ map({ my $v = { name => $_ }; 
                   if (my $a = $owner2alias->{$_}) { 
                       $v->{alias} = $a; 
                   } $v 
                 }
                 @{ $email2owners->{$email} }) ];
}

# Get list of all emails for given owner.
# If parameter 'owner' is missing, take 'active_owner'.
sub get_emails {
    my ($req, $session) = @_;
    my $owner = $req->param('owner') || $req->param('active_owner') 
        or abort "Missing param 'owner'";
    if ($owner eq ':unknown') {
	return [];
    }
    return load_json("owner/$owner/emails");
}

# Get list of watcher emails for active owner.
sub get_watchers {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner') 
        or abort "Missing param 'active_owner'";
    return load_json("owner/$owner/watchers");
}

# Get list of supervisor owners for active owner.
sub get_supervisors {
    my ($req, $session) = @_;
    my $owner = $req->param('active_owner') 
        or abort "Missing param 'active_owner'";
    my $supervisors = load_json("owner/$owner/extended_by");
    my $owner2alias = load_json('owner2alias');
    return [ map({ if (my $a = $owner2alias->{$_->{name}}) { 
                       { %$_, alias => $a } 
                   } else { 
                       $_ 
                   }
                 } @$supervisors) ];
}


####################################################################
# Send HTML as answer
####################################################################

sub read_template {
    my ($file) = @_;
    open(my $fh, '<', $file) or internal_err "Can't open $file: $!";
    local $/ = undef;
    my $text = <$fh>;
    close $fh;
    return $text;
}

# Do simple variable substitution.
# Use syntax of template toolkit.
sub process_template {
    my ($text, $vars) = @_;
    while (my ($key, $value) = each %$vars) {
	$text =~ s/\[% $key %\]/$value/g;
    }
    return $text;
}

sub get_substituted_html {
    my ($file, $vars ) = @_;
    my $text = read_template($file);
    $text = process_template($text, $vars);
    return $text;
}					 
   

####################################################################
# Register / reset password
####################################################################

sub send_verification_mail {
    my ($email, $url, $ip) = @_;
    my $text = Template::get($config->{verify_mail_template},
                             { email => $email, 
                               url => $url, 
                               ip => $ip });
    my $sendmail = $config->{sendmail_command};

    # -t: read recipient address from mail text
    # -f: set sender address
    # -F: don't use sender full name
    open(my $mail, '|-', "$sendmail -t -F '' -f $config->{noreply_address}") or 
	internal_err "Can't open $sendmail: $!";
    print $mail Encode::encode('UTF-8', $text);
    close $mail or warn "Can't close $sendmail: $!\n";
    return;
}

# Get / set password for user.
# New password is already encrypted in sub register below.
sub store_password {
    my ($email, $hash) = @_;
    my $store = User_Store::new($config, $email);
    $store->param('hash', $hash);
    $store->clear('old_hash');
    $store->flush();
    return;
}

sub check_password  {
    my ($email, $pass) = @_;
    my $store = User_Store::new($config, $email);
    my $csh = Crypt::SaltedHash->new(algorithm => 'SHA-256');

    # Check password with salted hash.
    if (my $hash = $store->param('hash')) {
        return $csh->validate($hash, $pass);
    }

    # Check against double hashed old password.
    elsif (my $salted_old_hash = $store->param('old_hash')) {
        return $csh->validate($salted_old_hash, md5_hex($pass));
    }

    # Check against old unsalted hashed password
    elsif (my $old_hash = $store->param('pass')) {
        return ($old_hash eq md5_hex($pass));
    }

    # No password known.
    else {
        return;
    }
}

sub register {
    my ($req, $session) = @_;
    my $email = $req->param('email') or abort "Missing param 'email'";
    abort("Can't set password for 'guest'") if $email eq 'guest';
    $email = lc $email;
    my $email2owners = load_json("email");
    $email2owners->{$email} or abort "Email address is not authorized";
    my $base_url = $req->param('base_url') 
	or abort "Missing param 'base_url' (Activate JavaScript)";
    check_attack($email);
    my $token = md5_hex(localtime, $email);
    my $pass = mkpasswd() or internal_err "Can't generate password";

    # Create salted hash from password.
    my $csh = Crypt::SaltedHash->new(algorithm => 'SHA-256');
    $csh->add($pass);
    my $hash = $csh->generate;

    # Store hash in session until verification.
    my $reg_data = { user => $email, hash => $hash, token => $token };
    $session->expire('register', '1d');
    $session->param('register', $reg_data);
    $session->flush();
    my $url = "$base_url/verify?email=$email&token=$token";

    # Send remote address to the recipient to allow tracking of abuse.
    my $ip = $req->address;
    set_attack($email);
    send_verification_mail ($email, $url, $ip);
    return Template::get($config->{show_passwd_template},
				{ pass => Plack::Util::encode_html($pass) });
}

sub verify {
    my ($req, $session) = @_;
    my $email = $req->param('email') or abort "Missing param 'email'";
    my $token = $req->param('token') or abort "Missing param 'token'";
    my $reg_data =  $session->param('register');
    if ($reg_data and
	$reg_data->{user} eq $email and
	$reg_data->{token} eq $token) 
    {
	store_password($email, $reg_data->{hash});
	$session->clear('register');
        $session->flush();
        clear_attack($email);
	return Template::get($config->{verify_ok_template}, {})
    }
    else {
	return Template::get($config->{verify_fail_template}, {});
    }
}					 
    
####################################################################
# Login
####################################################################

# Wait for 10, 20, .., 300 seconds after submitting wrong password.
sub set_attack {
    my ($email) = @_;
    my $store = User_Store::new($config, $email);
    my $wait = $store->param('login_wait') || 5;
    $wait *= 2;
    $wait = 300 if $wait > 300;
    $store->param('login_wait', $wait);
    $store->param('failed_time', time());
    $store->flush();
    return $wait;
}

sub check_attack {
    my ($email) = @_;
    my $store = User_Store::new($config, $email);
    my $wait = $store->param('login_wait');
    return if not $wait;
    my $remain = $store->param('failed_time') + $wait - time();
    if ($remain > 0) {
	abort("Wait for $remain seconds after wrong password" );
    }
    return;
}

sub clear_attack {
    my ($email) = @_;
    my $store = User_Store::new($config, $email);
    $store->clear('login_wait');
    $store->flush();
    return;
}

sub login {
    my ($req, $session) = @_;
    logout($req, $session);
    my $email = $req->param('email') or abort "Missing param 'email'";
    $email = lc $email;
    my $email2owners = load_json("email");
    $email2owners->{$email} or abort "Email address is not authorized";
    my $app_url = $req->param('app') or abort "Missing param 'app'";

    # User 'guest' needs no password.
    if ($email ne 'guest') {
        my $pass = $req->param('pass') or abort "Missing param 'pass'";
        check_attack($email);
        if (not check_password($email, $pass)) {
            set_attack($email);
            abort "Login failed";
        }
        clear_attack($email);
    }
    $session->param('email', $email);
    $session->clear('user');		# Remove old, now unused param.
    $session->expire('logged_in', '60m');
    $session->param('logged_in', 1);
    $session->flush();
    return $app_url;
}

sub logged_in {
    my ($session) = @_;
    return $session->param('logged_in');
}

# Validate active owner. 
# Email could be removed from any owner role at any time in netspoc data.
sub validate_owner {
    my ($req, $session, $owner_needed) = @_;
    if (my $active_owner = $req->param('active_owner')) {
	$owner_needed or abort abort "Must not send parameter 'active_owner'";
	my $email = $session->param('email');
	my $email2owners = $cache->load_json_current('email');
	grep { $active_owner eq $_ } @{ $email2owners->{$email} } or
	    abort "User $email isn't allowed to read owner $active_owner";
    } 
    else {
	$owner_needed and abort "Missing parameter 'active_owner'";
    }
    return;
}

sub logout {
    my ($req, $session) = @_;
    $session->clear('logged_in');
    $session->flush();
    return [];
}

# Find email address for current session.
# This program must ensure that $session->param('email') is only set
# if a user was successfully logged in at least once.
sub session_email {
    my ($req, $session) = @_;
    return $session->param('email') || '';
}

####################################################################
# Request handling
####################################################################

my %path2sub =
    (

     # Default: user must be logged in, JSON data is sent.
     # - anon: anonymous user is allowed
     # - html: send html 
     # - redir: send redirect
     # - owner: valid owner and history must be given as CGI parameter
     # - create_cookie: create cookie if no cookie is available
     login         => [ \&login,         { anon => 1, redir => 1, 
					   create_cookie => 1, } ],
     register      => [ \&register,      { anon => 1, html  => 1, 
					   create_cookie => 1, } ],
     verify        => [ \&verify,        { anon => 1, html  => 1, } ],
     session_email => [ \&session_email, { anon => 1, html => 1, 
					   err_status => 500} ],
     get_policy    => [ \&get_policy,    { anon => 1, add_success => 1, } ],
     logout        => [ \&logout,        { add_success => 1, } ],
     get_owner     => [ \&get_owner,     { add_success => 1, } ],
     get_owners    => [ \&get_owners,    { add_success => 1, } ],
     set           => [ \&set_session_data, { add_success => 1, } ],
     get_history   => [ \&get_history,   { owner => 1, add_success => 1, } ],
     service_list  => [ \&service_list,  { owner => 1, add_success => 1, } ],
     get_emails    => [ \&get_emails,    { owner => 1, add_success => 1, } ],
     get_watchers  => [ \&get_watchers,  { owner => 1, add_success => 1, } ],
     get_supervisors  => [ 
         \&get_supervisors,  { owner => 1, add_success => 1, } ],
     get_rules     => [ \&get_rules,     { owner => 1, add_success => 1, } ],
     get_users     => [ \&get_users,     { owner => 1, add_success => 1, } ],
     get_networks  => [ \&get_networks,  { owner => 1, add_success => 1, } ],
     get_hosts     => [ \&get_hosts,     { owner => 1, add_success => 1, } ],
     get_services_and_rules => [
	 \&get_services_and_rules,       { owner => 1, add_success => 1, } ],
     get_services_owners_and_admins => [
	 \&get_services_owners_and_admins,{ owner => 1, add_success => 1, } ],
     get_diff      => [ \&get_diff,      { owner => 1, } ],
     get_diff_mail => [ \&get_diff_mail, { owner => 1, add_success => 1, } ],
     set_diff_mail => [ \&set_diff_mail, { owner => 1, add_success => 1, } ],
      ); 

# Change 'param' method of Plack::Request.
# Convert UTF-8 bytes to Perl characters in values.
{
    package UTF8::Plack::Request;
    use base "Plack::Request";

    sub param {
        my ($self, @arg) = @_;
        return $self->SUPER::param() if not @arg;
        return Encode::decode_utf8($self->SUPER::param(@arg));
    }
}

sub handle_request {
    my ($env) = @_;
    my $req = UTF8::Plack::Request->new($env);
    my $flags = { html => 1};
    my $res = Plack::Response->new(200);

    # Catch errors.
    eval {
        my $cookie = $req->cookies->{CGISESSID};
        $CGI::Session::Driver::file::FileName = "%s";
	my $session = CGI::Session->load("driver:file", $cookie,
					 { Directory => 
					       $config->{session_dir} }
            );
	my $path = $req->path_info();
	$path =~ s:^/::;
	my $info = $path2sub{$path} or abort "Unknown path '$path'";
	(my $sub, $flags) = @$info;
	if ($session->is_empty()) {
	    if ($flags->{create_cookie}) {
                $session->new();
	    }
            elsif ($flags->{anon}) {
		abort "Cookies must be activated";
	    }

            # This could happen if the user calls the application URL
            # directly, bypassing the login page.
            # This error message triggers a redirect to the login page.
            else {
                abort "Login required";
            }
	}
	select_history($req, $flags->{owner});
	validate_owner($req, $session, $flags->{owner});
	$flags->{anon} or logged_in($session) or abort "Login required";
        $res->cookies->{$session->name} = { value => $session->id, 
                                            path => '/',
                                            expires => time + 365*24*60*60 };
	my $data = $sub->($req, $session);

	if ($flags->{html}) {
            $res->content_type('text/html; charset=utf-8');
            $res->body(Encode::encode('UTF-8', $data));
	}
	elsif ($flags->{redir}) {
            $res->redirect($data);
	}
	else {
            if ($flags->{add_success}) {
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
            }
            $res->content_type('text/x-json');
	    $res->body(to_json($data, {utf8 => 1, pretty => 1}));
	}
    };
    if ($@) {
	my $msg = $@;
	$msg =~ s/\n$//;
	if ($flags->{html} or $flags->{redir}) {

	    # Don't use status 500 on all errors, because IE 
	    # doesn't show error page.
	    my $status = $flags->{err_status} || 200;
            $res->status($status);
            $res->content_type('text/html; charset=utf-8');
	    $res->body(Template::get($config->{error_page}, {msg => $msg}));
	}
	else
	{
            my $result = { success => JSON::false, msg => $msg };
            $res->status(500);
            $res->content_type('text/x-json');
	    $res->body(encode_json($result) . "\n");
	}
    }
    return $res->finalize;
}

####################################################################
# Start server
####################################################################

$config = Load_Config::load();
$cache = JSON_Cache->new(netspoc_data => $config->{netspoc_data},
			 max_versions => 8);

my $app = \&handle_request;

builder {

    # Currently this server runs behind a HTTP proxy.
    enable "XForwardedFor";
    $app;
}
