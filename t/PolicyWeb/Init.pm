package PolicyWeb::Init;

use strict;
use warnings;
use IPC::Open2;
use IPC::Run3;
use File::Temp            qw/tempfile tempdir/;
use File::Spec::Functions qw/ file_name_is_absolute splitpath catdir catfile /;
use File::Path 'make_path';

require Exporter;
our @ISA = qw(Exporter);

our @EXPORT_OK = qw(
  prepare_export
  prepare_runtime_base
  $port
  $policy
  $SERVER
  $export_dir
  $home_dir
  $netspoc
);

our $SERVER = "127.0.0.1";
our $port;
our $policy = 'p0';
our $export_dir;
$ENV{NETSPOC_WEB_SRC_DIR} = $ENV{HOME} . '/Netspoc-Web';

############################################################
# Shared Netspoc configuration
############################################################
our $netspoc = <<'END';
owner:Axolotl = { admins = guest; }
owner:Blutegel = { admins = guest; }
owner:Chinchilla = { admins = guest; }
owner:Dachs = { admins = guest; }
owner:Eule = { admins = guest; }
owner:Flamingo = { admins = guest; }
owner:Gundi = { admins = guest; }
owner:Hermelin = { admins = guest; }
owner:Igeltanreks = { admins = guest; }
owner:Josephinenlori = { admins = guest; }
owner:Kondor = { admins = guest; }
owner:Lemming = { admins = guest; }
owner:Mungo = { admins = guest; }
owner:Nerz = { admins = guest; }
owner:Otter = { admins = guest; }
owner:Python = { admins = guest; }
owner:Qualle = { admins = guest; }
owner:Regenwurm = { admins = guest; }
owner:Steinbock = { admins = guest; }
owner:x = { admins = guest; show_all; }
owner:y = { admins = guest; }
owner:z = { admins = guest; }

area:all = { owner = x; anchor = network:Big; }
any:Big  = { link = network:Big; }
any:Sub1 = { ip = 10.1.2.0/23; link = network:Big; }
any:Sub2 = { ip = 10.1.1.0/25; link = network:Big; }

network:Sub = { ip = 10.1.1.0/24; owner = z; subnet_of = network:Big; }
router:u = {
 interface:Sub;
 interface:L = { ip = 10.3.3.3; loopback; }
 interface:Big = { ip = 10.1.0.2; }
}
network:Big = {
 ip = 10.1.0.0/16;
 host:B10 = { ip = 10.1.0.10; owner = z; }
 host:Range = { range = 10.1.0.90-10.1.0.99; }
}

router:asa = {
 managed;
 model = ASA;
 routing = manual;
 interface:Big    = { ip = 10.1.0.1; hardware = outside; }
 interface:Kunde  = { ip = 10.2.2.1; hardware = inside; }
 interface:KUNDE  = { ip = 10.2.3.1; hardware = inside; }
 interface:KUNDE1 = { ip = 10.2.4.1; hardware = inside; }
 interface:DMZ    = { ip = 10.9.9.1; hardware = dmz; }
 interface:KUNDE_N1 = { ip = 10.2.5.1; hardware = inside; }
 interface:KUNDE_N2 = { ip = 10.2.6.1; hardware = inside; }
 interface:KUNDE_N3 = { ip = 10.2.7.1; hardware = inside; }
 interface:KUNDE_N4 = { ip = 10.2.8.1; hardware = inside; }
}

network:Kunde  = { ip = 10.2.2.0/24; owner = y; host:k  = { ip = 10.2.2.2; } }
network:KUNDE  = { ip = 10.2.3.0/24; owner = y; host:K  = { ip = 10.2.3.3; } }
network:KUNDE1 = { ip = 10.2.4.0/24; owner = y; host:K1 = { ip = 10.2.4.4; } }
network:KUNDE_N1 = { ip = 10.2.5.0/24; owner = Mungo; host:M1 = { ip = 10.2.5.5; } }
network:KUNDE_N2 = { ip = 10.2.6.0/24; owner = Nerz; host:N1 = { ip = 10.2.6.6; } }
network:KUNDE_N3 = { ip = 10.2.7.0/24; owner = Otter; host:O1 = { ip = 10.2.7.7; } }
network:KUNDE_N4 = { ip = 10.2.8.0/24; owner = Kondor; host:Ko1 = { ip = 10.2.8.8; } }
any:Kunde = { link = network:Kunde; }

network:DMZ = { ip = 10.9.9.0/24; }
any:DMZ10 = { ip = 10.0.0.0/8; link = network:DMZ; }

router:inet = {
 interface:DMZ;
 interface:Internet;
}

network:Internet = { ip = 0.0.0.0/0; has_subnets; }

service:Test1 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
}

service:Test2 = {
 description = My foo
 user = network:Big, any:Sub1;
 permit src = user; dst = host:k; prt = udp 80;
}

service:Test3 = {
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 81;
}

service:Test3a = {
 multi_owner;
 user = network:Sub;
 permit src = user; dst = network:Kunde; prt = tcp 80;
 permit src = user; dst = network:DMZ; prt = tcp 81;
}

service:Test4 = {
 description = Your foo
 multi_owner;
 user = host:B10, host:k, host:Range, interface:u.Big, network:DMZ;
 permit src = user; dst = host:k; prt = tcp 81;
 permit src = user; dst = host:B10; prt = tcp 82;
}

service:Test5 = {
 user = any:Big;
 permit src = user; dst = host:k; prt = tcp 82;
}

service:Test6 = {
 user = host:B10;
 permit src = user; dst = any:Kunde; prt = udp 82;
}

service:Test7 = {
 user = host:B10;
 permit src = user; dst = network:Internet; prt = udp 82;
}

service:Test8 = {
 user = host:B10;
 permit src = user; dst = any:DMZ10; prt = udp 82;
}

service:Test9 = {
 user = host:B10, host:k;
 permit src = user; dst = user; prt = udp 83;
}

service:Test10 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE; prt = tcp 84;
}

service:Test11 = {
 user = network:Sub;
 permit src = user; dst = network:KUNDE1; prt = tcp 84;
}

service:Test20 = {
 user = network:KUNDE_N1, network:KUNDE_N2, network:KUNDE_N3;
 permit src = user; dst = network:Big; prt = tcp 84;
}

service:Test21 = {
 user = network:KUNDE_N1, network:KUNDE_N2, network:KUNDE_N3;
 permit src = user; dst = network:Big; prt = tcp 999;
}

END
############################################################

$export_dir = tempdir( CLEANUP => 1 );

sub prepare_in_dir {
    my ($input) = @_;

    # Prepare input directory and file(s).
    # Input is optionally preceeded by single lines of dashes
    # followed by a filename.
    # If no filenames are given, a single file named STDIN is used.
    my $delim = qr/^-+[ ]*(\S+)[ ]*\n/m;
    my @input = split( $delim, $input );
    my $first = shift @input;

    # Input does't start with filename.
    # No further delimiters are allowed.
    if ($first) {
        if (@input) {
            BAIL_OUT("Only a single input block expected");
            return;
        }
        @input = ( 'STDIN', $first );
    }
    my $in_dir = tempdir( CLEANUP => 1 );
    while (@input) {
        my $path = shift @input;
        my $data = shift @input;
        if ( file_name_is_absolute $path) {
            BAIL_OUT("Unexpected absolute path '$path'");
            return;
        }
        my ( undef, $dir, $file ) = splitpath($path);
        my $full_dir = catdir( $in_dir, $dir );
        make_path($full_dir);
        my $full_path = catfile( $full_dir, $file );
        open( my $in_fh, '>', $full_path ) or die "Can't open $path: $!\n";
        print $in_fh $data;
        close $in_fh;
    }
    return $in_dir;
}

# Add export-netspoc to PATH
$ENV{PATH} = "$ENV{HOME}/Netspoc/bin/:$ENV{PATH}";

sub prepare_export {
    my ($input) = @_;
    $input ||= $netspoc;
    my $in_dir = prepare_in_dir($input);

    my ($counter) = $policy =~ /^p(\d+)/;
    $counter++;
    $policy = "p$counter";

    my $cmd = "export-netspoc --quiet $in_dir $export_dir/$policy";
    my ( $stdout, $stderr );
    run3( $cmd, \undef, \$stdout, \$stderr );
    my $status = $?;
    $status == 0 or die "Export failed:\n$stderr\n";
    $stderr and die "Unexpected output during export:\n$stderr\n";
    system("echo '# $policy #' > $export_dir/$policy/POLICY") == 0 or die $!;
    system("cd $export_dir; rm -f current; ln -s $policy current") == 0
      or die $!;
}

our $home_dir = tempdir( CLEANUP => 1 );
my $conf_file = "$home_dir/policyweb.conf";
my $conf_data = <<END;
{
 "netspoc_data"         : "$export_dir",
 "user_dir"             : "$home_dir/users",
 "session_dir"          : "$home_dir/sessions",
 "noreply_address"      : "noreply"
}
END

# $pid and $chld_in need to be global, otherwise the test-server
# would get deleted after prepare_runtime_base has finished.
my $pid;

# Server will wait for EOF on $chld_in and then exit.
my $chld_in;

sub prepare_runtime_base {

    # Prepare config file for netspoc.psgi
    open( my $fh, '>', $conf_file ) or die "Can't open $conf_file";
    print $fh $conf_data;
    close $fh;

    # netspoc.psgi searches config file in $HOME directory.
    local $ENV{HOME} = $home_dir;

    # Automatically clean up child process after it has finished.
    #$SIG{CHLD}='IGNORE';

    my $cmd = 'bin/test-server';
    $pid  = open2( my $chld_out, $chld_in, $cmd ) or die "Can't start $cmd: $!";
    $port = <$chld_out>;
    chomp $port;
}

1;
