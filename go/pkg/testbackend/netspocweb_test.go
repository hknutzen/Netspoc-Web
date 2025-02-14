package testbackend

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
	"testing"

	"github.com/google/go-cmp/cmp"
	"github.com/hknutzen/testtxt"
)

type descr struct {
	Title    string
	Netspoc  string
	URL      string
	Job      string
	Response string
	Status   int
}

func TestNetspocWeb(t *testing.T) {

	// We need the original HOME to find the bin-directory.
	originalHome := os.Getenv("HOME")
	workDir := t.TempDir()
	os.Setenv("HOME", workDir)

	// Mux has to be created with original home directory
	// The new temp directory is saved as HOME env var.
	mux, perlCmd, perlStdin := GetMux(originalHome)

	// Read test files before changing work directory.
	dataFiles, _ := filepath.Glob("testdata/*.t")

	// Write policyweb.conf file in new HOME directory.
	PrepareConfig(workDir)

	// Perform login
	loginUrl := "/backend/login?email=guest&app=../app.html"
	resp := httptest.NewRecorder()
	mux.ServeHTTP(resp, httptest.NewRequest(http.MethodPost, loginUrl, nil))
	fmt.Fprintf(os.Stderr, "Login : %v\n", resp)
	// Run tests
	for _, file := range dataFiles {
		t.Run(path.Base(file), func(t *testing.T) {
			var l []descr
			if err := testtxt.ParseFile(file, &l); err != nil {
				t.Fatal(err)
			}
			for _, d := range l {
				t.Run(d.Title, func(t *testing.T) {
					testHandleFunc(t, d, "/backend/get_rules", mux.ServeHTTP)
				})
			}
		})
	}
	// Stop Perl server.
	perlStdin.Close()
	perlCmd.Wait()
}

func testHandleFunc(t *testing.T, d descr,
	url string, handler func(http.ResponseWriter, *http.Request),
) {
	policy := "p1"
	home := os.Getenv("HOME")
	netspocDir := filepath.Join(home, "netspoc")
	exportDir := filepath.Join(home, "export")
	fmt.Fprint(os.Stderr, "netspocDir : ", netspocDir, "\n")
	fmt.Fprint(os.Stderr, "exportDir : ", exportDir, "\n")
	// Do export-netspoc
	testtxt.PrepareInDir(t, netspocDir, "INPUT", d.Netspoc)
	//system("echo '# $policy #' > $export_dir/$policy/POLICY") == 0 or die $!;
	//system("cd $export_dir; rm -f current; ln -s $policy current") == 0
	runCmd(t, "export-netspoc -q "+netspocDir+" "+exportDir+"/"+policy)
	os.WriteFile(exportDir+"/"+policy+"/POLICY", []byte("# "+policy+" #\n"), 0444)
	os.Remove(exportDir + "/current")
	os.Symlink(policy, exportDir+"/current")
	printFile(exportDir + "/" + policy + "/email")
	printFile(home + "/policyweb.conf")

	// Call given URL and handle response
	req := httptest.NewRequest(http.MethodPost, url, strings.NewReader(d.Job))
	resp := httptest.NewRecorder()
	handler(resp, req)
	if resp.Code != d.Status {
		t.Errorf("Want status '%d', got '%d'", d.Status, resp.Code)
	}
	if diff := cmp.Diff(d.Response, resp.Body.String()); diff != "" {
		t.Error(diff)
	}
}

func printFile(fileStr string) {
	file, err := os.Open(fileStr)
	if err != nil {
		panic(err)
	}
	defer func() {
		if err = file.Close(); err != nil {
			panic(err)
		}
	}()

	b, err := io.ReadAll(file)
	fmt.Fprintf(os.Stderr, "File : %s\n", b)
}

func runCmd(t *testing.T, line string) {
	args := strings.Fields(line)
	cmd := exec.Command(args[0], args[1:]...)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("Command failed: %q: %v", line, string(out))
	}
}

func setEnvPath(name, dir string) {
	abs, _ := filepath.Abs(dir)
	os.Setenv(name, abs)
}
