package testbackend

import (
	"cmp"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strings"

	"github.com/hknutzen/Netspoc-Web/go/pkg/backend"
)

// Start Perl test server.
func perlTestServer(originalHome string) (*exec.Cmd, io.WriteCloser) {
	binPath := path.Join(originalHome, "Netspoc-Web", "bin")
	perlCmd := exec.Command(path.Join(binPath, "test-server.pl"))
	perlStdout, _ := perlCmd.StdoutPipe()
	perlStdin, _ := perlCmd.StdinPipe()
	if err := perlCmd.Start(); err != nil {
		panic(err)
	}

	// Read port number of Perl test server from stdout.
	var perlPort string
	if _, err := fmt.Fscanln(perlStdout, &perlPort); err != nil {
		panic(fmt.Errorf("reading port number of %s: %v", perlCmd, err))
	}
	os.Setenv("PERLPORT", perlPort)
	return perlCmd, perlStdin
}

func GetMux(originalHome string) *http.ServeMux {
	// Serve static files and backend.
	mux := http.NewServeMux()
	srcDir := cmp.Or(os.Getenv("NETSPOC_WEB_SRC_DIR"), ".")
	htdocs := http.FileServer(http.Dir(path.Join(srcDir, "htdocs")))
	mux.Handle("/extjs4/", htdocs)
	mux.Handle("/silk-icons/", htdocs)
	rootDir := path.Clean(path.Join(originalHome, "Netspoc-Web"))
	mux.Handle("/", stripIndex(http.FileServer(http.Dir(rootDir))))
	mux.Handle("/backend/", http.StripPrefix("/backend", backend.MainHandler()))
	mux.Handle("/backend6/", http.StripPrefix("/backend6", backend.MainHandler()))
	return mux
}

// Replace /index.html with / to stop 301 redirect.
// Otherwise 'logout' test of t/policyweb.t fails.
func stripIndex(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		r.URL.Path = strings.TrimSuffix(r.URL.Path, "index.html")
		h.ServeHTTP(w, r)
	})
}
