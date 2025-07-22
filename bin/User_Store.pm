package User_Store;

use strict;
use warnings;
use Carp;
use Fcntl qw(:flock);
use JSON;
use open qw(:std :utf8);

use lib '~/Netspoc-Web/bin/';    # Replace with the actual path to CGI_Store.pm
use CGI_Store;

sub new {
    my ( $config, $email ) = @_;
    my $path  = "$config->{user_dir}/$email";
    my $store = {};
    my $obj   = bless( { store => $store, path => $path } );
    if ( open( my $fh, '<', $path ) ) {
        flock( $fh, LOCK_SH ) or croak("couldn't lock '$path': $!");
        local $/ = undef;
        my $data = <$fh>;
        close($fh);

        # Read old format of CGI::Session.
        if ( $data =~ /^\$D =/ ) {
            my $old = CGI_Store::load( $config, $email );
            for my $key (qw(hash old_hash send_diff)) {
                if ( defined( my $v = $old->param($key) ) ) {
                    $store->{$key} = $v;
                }
            }

            # Overwrite with new JSON format.
            $obj->flush();
        }
        else {
            $obj->{store} = from_json($data);
        }
    }
    return $obj;
}

sub load { new(@_); }

sub param {
    my ( $self, $key, $val ) = @_;
    if ( @_ eq 2 ) {
        return $self->{store}->{$key};
    }
    $self->{store}->{$key} = $val;
    $self->flush();
}

sub clear {
    my ( $self, $key ) = @_;
    delete $self->{store}->{$key};
    $self->flush();
}

sub flush {
    my ($self) = @_;
    my $json   = to_json( $self->{store} );
    my $path   = $self->{path};
    open( my $fh, '>', $path ) or croak "couldn't open $path: $!";
    flock( $fh, LOCK_EX )      or croak("couldn't lock '$path': $!");
    print( $fh $json );
    close($fh);
}

1;
