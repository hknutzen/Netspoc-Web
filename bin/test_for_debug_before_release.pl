#!/usr/local/bin/perl

open(my $fh, "<", "app.html");
my @lines=<$fh>;
my $hits = scalar( grep { /^<script type="text\/javascript" src="\/extjs5\/build\/ext-all-debug.js"> <\/script>/ } @lines );
$hits > 0 && die "Replace ext-all-debug with ext-all before release!";
close($fh);
