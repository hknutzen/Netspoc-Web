package testbackend

import (
	"bytes"
	"cmp"
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

	go_cmp "github.com/google/go-cmp/cmp"
	"github.com/hknutzen/Netspoc-Web/go/pkg/backend"
	"github.com/hknutzen/testtxt"
)

type descr struct {
	Title         string
	Netspoc       string
	Netspoc2      string
	SetSendDiff   string
	Email         string
	Password      string
	URL           string
	Params        string
	Response      string
	ResponseNames string
	Diff          string
	Error         string
	Status        int
	GetSendDiff   string
	Todo          bool
}

func TestNetspocWeb(t *testing.T) {

	// We need the original HOME to find the bin-directory.
	originalHome := os.Getenv("HOME")

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
	if d.Todo {
		t.Skip("skipping TODO test")
	}

	workDir := t.TempDir()
	os.Setenv("HOME", workDir)
	os.Setenv("SERVE_IP6", "1")

	// Write policyweb.conf file in new HOME directory.
	// This has to be done before perlTestServer() is called, so that
	// the config file is read by the Perl test-server.
	PrepareConfig(workDir)

	// Mux needs original home directory
	// to find the root directory.
	mux := GetMux(originalHome)

	// Export one or two Netspoc policies.
	home := os.Getenv("HOME")
	export := func(input, policy string) {
		netspocDir := filepath.Join(home, "netspoc")
		exportDir := filepath.Join(home, "export")
		// Do export-netspoc
		testtxt.PrepareInDir(t, netspocDir, "INPUT", input)
		runCmd(t, "export-netspoc -q "+netspocDir+" "+exportDir+"/"+policy)
		os.WriteFile(filepath.Join(exportDir, policy, "POLICY"),
			[]byte("# "+policy+" #\n"), 0444)
		symLink := filepath.Join(exportDir, "current")
		os.Remove(symLink)
		os.Symlink(policy, symLink)
	}
	export(d.Netspoc, "p1")
	if d.Netspoc2 != "" {
		export(d.Netspoc2, "p2")
	}

	// Prepare login
	loginUrl := "/backend/login?app=../app.html"
	email := cmp.Or(d.Email, "guest")
	loginUrl += "&email=" + url.QueryEscape(email)
	// Create user-session-file
	userFile := filepath.Join(home, "users", email)
	store, err := backend.GetUserStore(userFile)
	if err != nil {
		t.Fatalf("Failed to create user store for %s: %v", userFile, err)
	}
	if d.Password != "" {
		encoder := backend.SSHAEncoder{}
		store.Hash, err = encoder.EncodeAsString([]byte(d.Password))
		if err != nil {
			t.Fatalf("Failed to set password for %s: %v", userFile, err)
		}
		loginUrl += "&pass=" + url.QueryEscape(d.Password)
	}
	if d.SetSendDiff != "" {
		store.SendDiff = strings.Fields(d.SetSendDiff)
	}
	if err := store.WriteToFile(userFile); err != nil {
		t.Fatalf("Failed to write user store for %s: %v", userFile, err)
	}
	// Perform login
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
	if d.Status == 0 {
		d.Status = 200
	}
	if resp.Code != d.Status {
		t.Errorf("Want status '%d', got '%d'", d.Status, resp.Code)
	}
	if d.GetSendDiff != "" {
		t.Run("send diff", func(t *testing.T) {
			store, _ := backend.GetUserStore(userFile)
			l := strings.Fields(d.GetSendDiff)
			if d := go_cmp.Diff(l, store.SendDiff); d != "" {
				t.Error(d)
			}
		})
	}
	if d.Error != "" {
		msg := ""
		var data struct {
			Msg string
		}
		if json.Unmarshal(body, &data) == nil {
			msg = data.Msg
		} else {
			msg = string(body)
		}
		if d := go_cmp.Diff(d.Error, msg); d != "" {
			t.Error(d)
		}
	} else if d.Diff != "" {
		jsonEq(t, d.Diff, body)
	} else {
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
	if d := go_cmp.Diff(normalize([]byte(expected)), normalize(got)); d != "" {
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
