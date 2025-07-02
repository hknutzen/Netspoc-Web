package testbackend

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
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
	Title         string
	Netspoc       string
	URL           string
	Params        string
	Response      string
	ResponseNames string
	Status        int
}

func TestNetspocWeb(t *testing.T) {

	// We need the original HOME to find the bin-directory.
	originalHome := os.Getenv("HOME")
	workDir := t.TempDir()
	os.Setenv("HOME", workDir)
	os.Setenv("SERVE_IP6", "1")

	// Write policyweb.conf file in new HOME directory.
	// This has to be done before perlTestServer() is called, so that
	// the config file is read by the Perl test-server.
	PrepareConfig(workDir)
	perlCmd, perlStdin := PerlTestServer(originalHome)
	defer func() {
		// Stop Perl server.
		perlStdin.Close()
		perlCmd.Wait()
	}()

	// Read test files before changing work directory.
	dataFiles, _ := filepath.Glob("testdata/*.t")

	// Run tests
	for _, file := range dataFiles {
		t.Run(path.Base(file), func(t *testing.T) {
			var l []descr
			if err := testtxt.ParseFile(file, &l); err != nil {
				t.Fatal(err)
			}
			for _, d := range l {
				t.Run(d.Title, func(t *testing.T) {
					testHandleFunc(t, d, "/backend/"+d.URL, originalHome)
				})
			}
		})
	}
}

func testHandleFunc(t *testing.T, d descr, endpoint, originalHome string) {

	// Mux needs original home directory
	// to find the root directory.
	mux := GetMux(originalHome)
	policy := "p1"
	home := os.Getenv("HOME")
	netspocDir := filepath.Join(home, "netspoc")
	exportDir := filepath.Join(home, "export")

	// Do export-netspoc
	testtxt.PrepareInDir(t, netspocDir, "INPUT", d.Netspoc)
	runCmd(t, "export-netspoc -q "+netspocDir+" "+exportDir+"/"+policy)
	os.WriteFile(exportDir+"/"+policy+"/POLICY", []byte("# "+policy+" #\n"), 0444)
	os.Remove(exportDir + "/current")
	os.Symlink(policy, exportDir+"/current")

	// Perform login
	loginUrl := "/backend/login?email=guest&app=../app.html"
	req := httptest.NewRequest(http.MethodPost, loginUrl, strings.NewReader(""))
	resp := httptest.NewRecorder()
	mux.ServeHTTP(resp, req)
	cookies := resp.Result().Cookies()

	// Params can be written as single line
	// a=b&c=d
	// or as separate lines
	// a=b
	// c=d
	params := d.Params
	params = strings.TrimSuffix(params, "\n")
	params = strings.ReplaceAll(params, "\n", "&")
	params = url.PathEscape(params)

	// Call given URL and handle response
	req = httptest.NewRequest(http.MethodPost, endpoint+"?"+params, nil)
	// Add cookies of login request.
	for _, c := range cookies {
		req.AddCookie(c)
	}
	resp = httptest.NewRecorder()
	mux.ServeHTTP(resp, req)
	body, _ := io.ReadAll(resp.Body)
	type jsonData struct {
		Success    bool
		Msg        string
		TotalCount int
		Records    json.RawMessage
	}
	var data jsonData
	json.Unmarshal(body, &data)
	if data.Msg != "" {
		t.Errorf("Unexpected response message: %s", data.Msg)
	}
	if d.Status == 0 {
		d.Status = 200
	}
	if resp.Code != d.Status {
		t.Errorf("Want status '%d', got '%d'", d.Status, resp.Code)
	}
	if d.ResponseNames != "" {
		type named struct {
			Name string
		}
		var l []named
		json.Unmarshal(data.Records, &l)
		sl := make([]string, len(l))
		for i, e := range l {
			sl[i] = e.Name
		}
		data.Records, _ = json.Marshal(sl)
		d.Response = d.ResponseNames
	}
	jsonEq(t, d.Response, data.Records)
}

func jsonEq(t *testing.T, expected string, got []byte) {
	normalize := func(d []byte) string {
		var v interface{}
		if err := json.Unmarshal(d, &v); err != nil {
			t.Fatal(err)
		}
		var b bytes.Buffer
		enc := json.NewEncoder(&b)
		enc.SetEscapeHTML(false)
		enc.SetIndent("", " ")
		enc.Encode(v)
		return b.String()
	}
	if d := cmp.Diff(normalize([]byte(expected)), normalize(got)); d != "" {
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
