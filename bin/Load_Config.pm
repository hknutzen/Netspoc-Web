package Load_Config;

use strict;
use warnings;
use Carp;
use JSON;
use FindBin;
use Cwd 'abs_path';

my $base_dir = abs_path("$FindBin::Bin/..");

# Valid config options.
# Value is either:
# - default value for optional keys
# - ':OPTIONAL' for optional keys without default value
# - ':REQUIRED' for keys, that need to be specified in config file.

my %conf_keys = (
    map( { ( $_ => ':REQUIRED' ) }
        qw(netspoc_data noreply_address session_dir user_dir) ),
    map( { ( $_ => ':OPTIONAL' ) }
        qw(ldap_uri ldap_dn_template ldap_base_dn
          ldap_filter_template ldap_email_attr business_units
        ) ),
    mail_template       => "$base_dir/mail",
    html_template       => "$base_dir/html",
    template_path       => "$base_dir/templates",
    about_info_template => "$base_dir/html/about_info",
    sendmail_command    => '/usr/lib/sendmail',
    expire_logged_in    => 480,
);

sub load {
    my $conf_file = glob(
        $ENV{'PW_FRONTEND_TEST'}
        ? '~/policyweb-test.conf'
        : '~/policyweb.conf'
    );
    -f $conf_file or croak("$conf_file must be a plain file");
    my $result;
    open( my $fh, '<', $conf_file ) or croak("Can't open $conf_file: $!");
    {
        local $/ = undef;
        $result = from_json( <$fh>, { relaxed => 1 } );
        close $fh;
    }
    for my $key ( keys %conf_keys ) {
        $conf_keys{$key} eq ':REQUIRED' or next;
        defined $result->{$key} or croak("Missing key '$key' in $conf_file");
    }
    for my $key ( keys %$result ) {
        $conf_keys{$key} or carp("Unexpected key '$key' in $conf_file");
    }
    for my $key ( keys %conf_keys ) {
        my $default = $conf_keys{$key};
        next if $default eq ':REQUIRED';
        next if $default eq ':OPTIONAL';
        $result->{$key} //= $default;
    }
    return ($result);
}

1;
