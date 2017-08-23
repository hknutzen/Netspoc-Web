package Load_Config;

use strict;
use warnings;
use Carp;
use JSON;

# Valid config options.
my %conf_keys = (
    map({ ($_ => 1) }
qw(
   diff_mail_template
   error_page
   netspoc_data
   noreply_address
   sendmail_command
   session_dir
   expire_logged_in
   show_passwd_template
   user_dir
   verify_fail_template
   verify_mail_template
   verify_ok_template
   template_path
   about_info_template
   business_units
  )),
    map({ ($_ => 'optional') }
qw(
   ldap_uri
   ldap_dn_template
   ldap_base_dn
   ldap_filter_template
   ldap_email_attr
  ))
);

sub load {
    my $conf_file = glob( $ENV{'PW_FRONTEND_TEST'} ?
                          '~/policyweb-test.conf' : '~/policyweb.conf');
    -f $conf_file or croak("$conf_file must be a plain file");
    my $result;
    open( my $fh, '<', $conf_file ) or croak("Can't open $conf_file: $!");
    {
	local $/ = undef;
	$result = from_json(  <$fh>, { relaxed  => 1 } );
    }
    my %required;
    for my $key (keys %conf_keys) {
        next if $conf_keys{$key} eq 'optional';
        defined $result->{$key} or croak("Missing key '$key' in $conf_file");
    }
    for my $key (keys %$result) {
        $conf_keys{$key} or carp("Unexpected key '$key' in $conf_file");
    }
    return($result);
}

1;
