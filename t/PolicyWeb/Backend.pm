
package PolicyWeb::Backend;

use strict;
use Test::More;
use Test::Differences;
use lib 'bin';
use IPC::Run3;
use File::Temp qw/ tempfile tempdir /;
use Plack::Test;
use JSON;
use HTTP::Request::Common;
use Plack::Builder;
use Data::Dumper;

use PolicyWeb::Init qw/$app $policy $port $SERVER/;

require Exporter;
our @ISA    = qw(Exporter);
our @EXPORT = qw(
  test_run
  extract_records
  extract_names
  prepare_runtime
  );

our $cookie;

sub prepare_runtime {

    PolicyWeb::Init::prepare_runtime_base({ login => 0 });

    # Login as guest
    test_psgi $app, sub {
        my $cb  = shift;
        my $uri = "http://$SERVER:$port/backend/login?email=guest&app=../app.html";
        my $req = HTTP::Request->new(GET => $uri);
        my $res = $cb->($req);
        $res->is_redirect or die "Login failed: ", $res->content;
        $cookie = $res->header('Set-Cookie')
          or die "Missing cookie in response to login";
    };
}

sub test_run {
    my ($title, $path, $request, $owner, $out, $process_result) = @_;

    $request->{active_owner} = $owner;
    $request->{history}      = $policy;

    my $uri = "http://$SERVER:$port/backend/$path?" . join '&',
      map { "$_=$request->{$_}" } keys %$request;
    test_psgi $app, sub {
        my $cb  = shift;
        my $h   = HTTP::Headers->new(Cookie => $cookie);
        my $req = HTTP::Request->new('GET', $uri, $h);
        my $res = $cb->($req);
        $res->is_success or die $res->content;
        my $data = from_json($res->content, { utf8 => 1 });
        eq_or_diff($process_result->($data), $out, $title);
    };
}

############################################################
# Extracts data from result of request.
############################################################
sub extract_records {
    my ($result) = @_;
    my $records = $result->{records} or die 'Missing records in response';
    return $records;
}

sub extract_names {
    my ($result) = @_;
    my $records = $result->{records} or die 'Missing records in response';
    return [ map { $_->{name} } @$records ];
}

1;
