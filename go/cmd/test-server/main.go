package main

import (
	"fmt"
	"io"
	"net/http/httptest"
	"net/url"
	"os"

	"github.com/hknutzen/Netspoc-Web/go/pkg/testbackend"
)

// Start Go test server on arbitrary port.
func main() {

	home := os.Getenv("HOME")
	fmt.Fprintf(os.Stderr, "HOME: %s\n", home)
	mux, perlCmd, perlStdin := testbackend.GetMux(home)
	ts := httptest.NewServer(mux)

	// Print port number to STDOUT.
	u, _ := url.Parse(ts.URL)
	fmt.Println(u.Port())
	// Terminate after reading EOF from STDIN.
	io.ReadAll(os.Stdin)
	// Stop Go server.
	ts.Close()
	// Stop Perl server.
	perlStdin.Close()
	perlCmd.Wait()
}
