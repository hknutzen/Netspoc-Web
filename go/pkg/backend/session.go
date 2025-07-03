package backend

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
)

type session struct {
	LoggedIn bool `json:"logged_in"`
	Email    string
	Owner    string
}

func getSession(r *http.Request) *session {
	addr := fmt.Sprintf("http://localhost:%s/get_session_data",
		os.Getenv("PERLPORT"))
	req, err := http.NewRequest("GET", addr, nil)
	if err != nil {
		panic(err)
	}
	// Add cookies of original request.
	for _, c := range r.Cookies() {
		req.AddCookie(c)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var s session
	if err := json.Unmarshal(body, &s); err != nil {
		abort("while decoding result of 'get_session_data': %v\n%s", err, body)
	}
	return &s
}

func loggedIn(r *http.Request) bool {
	return getSession(r).LoggedIn
}

func setOwner(r *http.Request, o string) {
	q := url.Values{}
	q.Set("owner", o)
	addr := fmt.Sprintf("http://localhost:%s/set_session_data?%s",
		os.Getenv("PERLPORT"), q.Encode())
	req, err := http.NewRequest("GET", addr, nil)
	if err != nil {
		panic(err)
	}
	// Add cookies of original request.
	for _, c := range r.Cookies() {
		req.AddCookie(c)
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		panic(err)
	}
	resp.Body.Close()
}
