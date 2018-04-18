#!/usr/bin/env perl

=head1 NAME

send_diff.pl - Send email about changes to owner of Netspoc-Web

=head1 COPYRIGHT AND DISCLAIMER

(C) 2016 by Heinz Knutzen     <heinz.knutzen@gmail.com>

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

use strict;
use warnings;

use utf8;
use FindBin;
use lib $FindBin::Bin;
use Load_Config;
use User_Store;
use Template;
use JSON_Cache;
use Policy_Diff;

# Argument processing
sub usage {
    die "Usage: $0 yyyy-mm-dd yyyy-mm-dd|pxxx\n";
}

my $old_ver = shift @ARGV or usage();
my $new_ver = shift @ARGV or usage();
@ARGV and usage();

my $config = Load_Config::load();
my $path = $config->{netspoc_data};

# Cache holding JSON data.
my $cache = JSON_Cache->new(netspoc_data => $path, max_versions => 8);

# Bestimme aktive owner und zugehörige User (= emails).
my $email2owners = $cache->load_json_version($new_ver, 'email');
my %owners;
my %owner2send;

sub intersect {
    my @arrays = @_;
    my $result;
    for my $element (@{pop @arrays}) {
        $result->{$element} = $element;
    }
    for my $set (@arrays) {
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

for my $email (keys %$email2owners) {
    my $owner_aref = $email2owners->{$email};
    for my $owner (@$owner_aref) {
        $owners{$owner} = $owner;
    }

    # Bestimme für jeden Benutzer die Owner,
    # über die er bei Änderungen informiert werden möchte.
    # Wir müssen alte, ungültige Owner herausnehmen,
    # da der Benutzer inzwischen weniger Rechte haben könnte.
    my $store = User_Store::load($config, $email);
    next if not $store;
    my $send_aref = $store->param('send_diff');
    next if not $send_aref;
    for my $owner (@{ intersect($owner_aref, $send_aref) }) {
        push(@{ $owner2send{$owner} }, $email);
    }
}

my %replace = (
    '+' => '(+)',
    '-' => '(-)',
    '!' => '(!)',
    'service_lists owner' => 'Liste eigener Dienste',
    'service_lists user'  => 'Liste genutzter Dienste',
    'objects'             => 'Objekte',
    'services'            => 'Dienste',
    'users'               => 'Liste der Benutzer (User)',
    );

sub convert {
    my ($in, $level) = @_;
    my $type = ref($in);
    if (not $type) {
        $in = $replace{$in} || $in;
        return(' ' x $level . $in);
    }
    elsif ($type eq 'HASH') {
        return(map { convert($_, $level+1) }
               map { ($_, $in->{$_}) } sort keys %$in);
    }
    elsif ($type eq 'ARRAY') {
        return(map { convert($_, $level+1) } @$in);
    }
}

my %toplevel_sort = (objects => 1, services => 2, );

# Vergleiche Dateien für jeden Owner.
for my $owner (sort keys %owners) {

    # Gibt es Empfänger für die Diffs?
    my $aref = $owner2send{$owner};
    next if not $aref;

    my $changes = Policy_Diff::compare($cache, $old_ver, $new_ver, $owner);
    next if not $changes;
    my $diff = join("\n", map( { convert({ $_, $changes->{$_} }, -1) }
                               (sort { ($toplevel_sort{$a} || 999)
                                       <=>
                                       ($toplevel_sort{$b} || 999) }
                                keys %$changes)));

    my $sendmail = $config->{sendmail_command};
    for my $email (@$aref) {
        my $text = Template::get($config->{diff_mail_template},
                                 { email   => $email,
                                   owner   => $owner,
                                   old_ver => $old_ver,
                                   new_ver => $new_ver,
                                   diff    => $diff
                                 });

        # -t: read recipient address from mail text
        # -f: set sender address
        # -F: don't use sender full name
        open(my $mail, '|-', "$sendmail -t -F '' -f $config->{noreply_address}")
          or die "Can't open $sendmail: $!";
        print $mail Encode::encode('UTF-8', $text);
        close $mail or warn "Can't close $sendmail: $!";
    }
}
