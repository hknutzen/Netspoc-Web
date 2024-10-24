
package PolicyWeb::Backend;

use strict;
use warnings;
use Test::Differences;
use JSON;
use HTTP::Request::Common;
use LWP::UserAgent ();

use lib 'bin';
use PolicyWeb::Init qw/$port $SERVER prepare_runtime_base/;

require Exporter;
our @ISA    = qw(Exporter);
our @EXPORT_OK = qw(
  test_run
  extract_records
  extract_names
  prepare_runtime
  );

our $cookie;

sub prepare_runtime {

    prepare_runtime_base();

    # Login as guest
    my $ua = LWP::UserAgent->new(timeout => 10);
    my $uri = "http://$SERVER:$port/backend/login?email=guest&app=../app.html";
    my $req = HTTP::Request->new(GET => $uri);
    my $res = $ua->simple_request($req);
    $res->is_redirect or die "Login failed: ", $res->content;
    $cookie = $res->header('Set-Cookie')
        or die "Missing cookie in response to login";
}

sub test_run {
    my ($title, $path, $request, $out, $process_result) = @_;
    my $ua = LWP::UserAgent->new(timeout => 10);
    my $uri = "http://$SERVER:$port/backend/$path?" . join '&',
      map { "$_=$request->{$_}" } keys %$request;
    my $h   = HTTP::Headers->new(Cookie => $cookie);
    my $req = HTTP::Request->new('GET', $uri, $h);
    my $res = $ua->simple_request($req);
    $res->is_success or die $res->content;
    my $data = from_json($res->content, { utf8 => 1 });
    eq_or_diff($process_result->($data), $out, $title);
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
