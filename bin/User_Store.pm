package User_Store;

use CGI::Session;
use CGI::Session::Driver::file;

# User data is stored with CGI::Session using email as ID.
sub get {
    my ($email) = @_;
    $CGI::Session::Driver::file::FileName = "%s";
    CGI::Session->new ('driver:file;id:static', $email, 
		      { Directory=> $config->{password_dir} } 
		      ) 
	or abort(CGI::Session->errstr());
}

1;
