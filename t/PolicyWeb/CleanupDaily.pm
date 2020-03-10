package PolicyWeb::CleanupDaily;

use strict;
use warnings;
use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use File::Find;
use Cwd 'abs_path';
use Exporter;
our @ISA    = qw/ Exporter /;
our @EXPORT = qw/
  set_timestamp_of_files
  export_netspoc
  cleanup_daily
  make_visible
  /;

sub set_timestamp_of_files {
    my ($path, $timestamp) = @_;
    find(sub { -f and utime($timestamp, $timestamp, $_) }, $path);
}

sub export_netspoc {
    my ($input, $export_dir, $policy_num, $timestamp) = @_;
    my $policy = "p$policy_num";
    my ($in_fh, $filename) = tempfile(UNLINK => 1);
    print $in_fh $input;
    close $in_fh;

    my $policy_path = "$export_dir/$policy";
    my $export_cmd = "$ENV{ORIG_HOME}/Netspoc/bin/export-netspoc";
    my $cmd = "perl $export_cmd -quiet $filename $policy_path";
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
    my ($cmd) = @_;
    my ($stdout, $stderr);
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
