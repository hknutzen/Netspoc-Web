
=head1 COPYRIGHT AND DISCLAIMER

(C) 2017 by Heinz Knutzen     <heinz.knutzen@gmail.com>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.

=cut

package CGI_Store;

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
                               { Directory=> $config->{user_dir} },

                               # Set undocumented parameter 'read_only',
                               # to not update atime when reading.
                               1);
}

1;
