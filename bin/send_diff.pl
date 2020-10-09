#!/usr/bin/env perl

=head1 NAME

send_diff.pl - Send email about changes to owner of Netspoc-Web

=head1 COPYRIGHT AND DISCLAIMER

(C) 2020 by Heinz Knutzen     <heinz.knutzen@gmail.com>

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
use Email::Simple;
use Email::Stuffer;
use FindBin;
use lib $FindBin::Bin;
use Load_Config;
use User_Store;
use Template;
use JSON_Cache;
use Policy_Diff;
use open qw(:std :utf8);

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
# Untersuche, über welche Owner die User informiert werden wollen.
# Das ist im User-Store im Attribut 'send_diff' gespeichert.
my $users_dir = $config->{user_dir};
my $email2owners = $cache->load_json_version($new_ver, 'email');
my %owner2send;

opendir(my $dh, $users_dir) or exit;
for my $email (sort readdir($dh)) {
    $email =~ /[@]/ or next;
    my $wildcard = $email =~ s/^.*@/[all]@/r;
    my %valid;
    if (my $owners = $email2owners->{$wildcard}) {
        @valid{@$owners} = @$owners;
    }
    if (my $owners = $email2owners->{$email}) {
        @valid{@$owners} = @$owners;
    }

    # Bestimme für jeden Benutzer die Owner,
    # über die er bei Änderungen informiert werden möchte.
    my $store = User_Store::load($config, $email) or next;
    my $send_aref = $store->param('send_diff') or next;
    my @send_ok = grep { $valid{$_} } @$send_aref;
    for my $owner (@send_ok) {
        push(@{ $owner2send{$owner} }, $email);
    }

    # Alte, ungültige Owner herausnehmen,
    # da der Benutzer inzwischen weniger Rechte haben könnte
    # oder der Owner nicht mehr existiert.
    # Den Empfänger per Mail über entfernte Owner informieren.
    next if @send_ok == @$send_aref;
    for my $invalid (grep { not $valid{$_} } @$send_aref) {
        my $template
            = -d "$path/current/owner/$invalid"
            ? "$config->{mail_template}/diff_owner_invisible"
            : "$config->{mail_template}/diff_owner_unknown";

        my $text = Template::get($template,
                                 {email => $email, owner => $invalid});
        sendmail($text);
    }
    $store->param('send_diff', \@send_ok)
}
closedir($dh);

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
for my $owner (sort keys %owner2send) {

    my $changes = Policy_Diff::compare($cache, $old_ver, $new_ver, $owner)
        or next;
    my $diff = join("\n", map( { convert({ $_ => $changes->{$_} }, -1) }
                               (sort { ($toplevel_sort{$a} || 999)
                                       <=>
                                       ($toplevel_sort{$b} || 999) }
                                keys %$changes)));

    my $template = "$config->{mail_template}/diff";
    for my $email (@{ $owner2send{$owner} }) {
        my $text = Template::get($template,
                                 { email   => $email,
                                   owner   => $owner,
                                   old_ver => $old_ver,
                                   new_ver => $new_ver,
                                   diff    => $diff
                                 });
        sendmail($text);

    }
}

sub sendmail {
    my ($text) = @_;
    my $sendmail = $config->{sendmail_command} or
        die "Missing config for: sendmail_command\n";
    my $from = $config->{noreply_address};
    my $email = Email::Simple->new($text);

    # -t: read recipient address from mail text
    # -f: set sender address
    # -F: do not use sender full name
    open(my $mail, '|-', "$sendmail -t -F '' -f $from")
        or die "Can't open $sendmail: $!";
    print $mail Email::Stuffer->new({ to => $email->header('to'),
                                      subject => $email->header('subject'),
                                      text_body => $email->body(),
                                    })->as_string();
    close $mail or warn "Can't close $sendmail: $!";
}
