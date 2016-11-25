
use strict;
use warnings;


package PolicyWeb::FrontendTest;

use base ( "Test::Selenium::Remote::Driver" );
use parent 'Exporter'; # imports and subclasses Exporter

use Data::Dumper;

my $SERVER   = "10.3.28.111";
my $base_url = "http://$SERVER/daniel4/";
#our $backend = $base_url . 'backend';

our @EXPORT = qw(
 login_as_guest
 default_params
 error
 );

my %params = (
    active_owner     => 'guest_owner',
    history          => 'p1',
    chosen_networks  => '',
    expand_users     => 0,
    display_property => 'ip',
    filter_rules     => 1,
    relation         => 'user'
    );    

sub error {
    print STDERR @_, "\n";
}

sub default_params {
    return \%params;
}


sub login_as_guest {
    my $driver = shift;
    $driver->get( $base_url );
    
    $driver->find_element( '//input[@id="email"]', "xpath" );
    $driver->find_element( "pass" );
    
    $driver->send_keys_to_active_element('guest');
    
    my $login_button = $driver->find_element( '//input[@value="Login"]', "xpath" );
    
    $login_button->click();
    
}



1;

