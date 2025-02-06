package main

import (
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
	Out      string
	URL      string
	Response string
	Status   int
}

func TestJobCheck(t *testing.T) {
	dataFiles, _ := filepath.Glob("testdata/*.t")
	for _, file := range dataFiles {
		t.Run(path.Base(file), func(t *testing.T) {
			var l []descr
			if err := testtxt.ParseFile(file, &l); err != nil {
				t.Fatal(err)
			}
			for _, d := range l {
				t.Run(d.Title, func(t *testing.T) {
					testHandleFunc(t, d, "/api-job-check", apiJobCheckHandler)
				})
			}
		})
	}
}

func testHandleFunc(t *testing.T, d descr,
	url string, handler func(http.ResponseWriter, *http.Request),
) {
	workDir := t.TempDir()
	os.Chdir(workDir)
	os.Setenv("HOME", workDir)
	setEnvPath("KMSPOC", "netspoc")
	testtxt.PrepareInDir(t, "netspoc", "INPUT", d.Netspoc)
	runCmd(t, "export-netspoc -q netspoc export")
	os.WriteFile("export/POLICY", []byte("# p1 #\n"), 0444)
	setEnvPath("KMPOLWEB", "export")
	os.Mkdir("kmdata", 0777)
	setEnvPath("KMDATA", "kmdata")
	os.Mkdir("kmconfig", 0777)
	setEnvPath("KMCONFIG", "kmconfig")
	testtxt.PrepareInDir(t, "kmconfig", "x", d.KMConfig)
	runCmd(t, "kmprep")
	req := httptest.NewRequest(http.MethodPost, url, strings.NewReader(d.Job))
	resp := httptest.NewRecorder()
	handler(resp, req)
	if resp.Code != d.Status {
		t.Errorf("Want status '%d', got '%d'", d.Status, resp.Code)
	}
	if d := cmp.Diff(d.Response, resp.Body.String()); d != "" {
		t.Error(d)
	}
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
