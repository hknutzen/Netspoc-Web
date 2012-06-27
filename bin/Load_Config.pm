package Load_Config;

use strict;
use warnings;
use Carp;
use JSON;

# Valid config options.
my %conf_keys = map { ($_ => 1) } 
qw(
   diff_mail_template
   error_page
   netspoc_data
   noreply_address
   password_dir
   sendmail_command
   session_dir
   show_passwd_template
   verify_fail_template
   verify_mail_template
   verify_ok_template
   );

sub load {
    my ($conf_file) = @_;
    my $result;
    -f $conf_file or croak("$conf_file must be a plain file");
    open( my $fh, $conf_file ) or croak("Can't open $conf_file: $!");
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
        $conf_keys{$key} or croak("Invalid key '$key' in $conf_file");
    }
    return($result);
}

1;
