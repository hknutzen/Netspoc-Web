package main

import (
	"fmt"
	"io"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"

	"github.com/hknutzen/Netspoc-Web/go/pkg/testbackend"
)

// Start Go test server on arbitrary port.
func main() {

	homeDir := strings.TrimSuffix(os.Getenv("NETSPOC_WEB_SRC_DIR"), "Netspoc-Web")
	mux := testbackend.GetMux(homeDir)
	ts := httptest.NewServer(mux)

	// Print port number to STDOUT.
	u, _ := url.Parse(ts.URL)
	fmt.Println(u.Port())
	// Terminate after reading EOF from STDIN.
	io.ReadAll(os.Stdin)
	// Stop Go server.
	ts.Close()
}
