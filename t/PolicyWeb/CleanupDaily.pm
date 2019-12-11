package PolicyWeb::CleanupDaily;

use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use File::Find;
use Cwd 'abs_path';
use Exporter;
@ISA    = qw/ Exporter /;
@EXPORT = qw/
  set_timestamp_of_files
  export_netspoc
  cleanup_daily
  run
  make_visible
  /;

sub set_timestamp_of_files {
    my ($path, $timestamp) = @_;
    find(sub { -f and utime($timestamp, $timestamp, $_) }, $path);
}

sub export_netspoc {
    my ($travis, $input, $export_dir, $policy_num, $timestamp) = @_;
    my $policy = "p$policy_num";
    my ($in_fh, $filename) = tempfile(UNLINK => 1);
    print $in_fh $input;
    close $in_fh;

    my $policy_path = "$export_dir/$policy";
    my $cmd; 
    if ($travis) {
        $cmd = "perl /home/travis/build/Leuchtstift/Netspoc/bin/export-netspoc -quiet $filename $policy_path";
    } else {
        $cmd = "perl /home/$ENV{USER}/Netspoc/bin/export-netspoc -quiet $filename $policy_path";
    }
    run($cmd);
    system("echo '# $policy #' > $policy_path/POLICY") == 0 or die $!;
    system("cd $export_dir; ln -sfT $policy current") == 0  or die $!;
    set_timestamp_of_files($policy_path, $timestamp);
}

sub cleanup_daily {
    my $cmd = "bin/cleanup_daily";
    return run($cmd);
}

sub run {
    my $cmd     = shift;
    my $comment = shift;
    my ($stdout, $stderr);
    if ($comment) {
        print "$comment\n$cmd\n";
    }
    else {
        print "$cmd\n";
    }
    run3($cmd, \undef, \$stdout, \$stderr);
    my $status = $?;
    $status == 0 or die "'$cmd' failed:\n$stderr\n";
    $stderr and die "Unexpected output on STDERR during '$cmd':\n$stderr\n";
    return $stdout;
}

sub make_visible {
    my ($home_dir, $path) = @_;
    my $abs = abs_path($path) or die "Can't find '$path' directory: $!";
    -d "$home_dir/NetspocWeb" or mkdir "$home_dir/NetspocWeb" or die $!;
    symlink $abs, "$home_dir/NetspocWeb/$path" or die $!;
}

1;
