package User_Store;

use strict;
use warnings;
use CGI::Session;
use CGI::Session::Driver::file;

# User data is stored with CGI::Session using email as ID.
sub new {
    my ($config, $email) = @_;
    $CGI::Session::Driver::file::FileName = "%s";
    return(CGI::Session->new ('driver:file;id:static', $email, 
                              { Directory=> $config->{user_dir} }) 
           or abort(CGI::Session->errstr()));
}

sub load {
    my ($config, $email) = @_;
    $CGI::Session::Driver::file::FileName = "%s";
    return CGI::Session->load ('driver:file;id:static', $email, 
                               { Directory=> $config->{user_dir} });
}

1;
