package backend

// login.go - Handles user login

import (
	"fmt"
	"log"
	"net/http"
)

func (s *state) loginHandler(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	if session == nil {
		http.Error(w, "Session not found", http.StatusInternalServerError)
		return
	}
	// Retrieve the session cookie
	cookie := session.Get("cookieName")
	log.Printf("Session data: %v\n", session.data)
	session.Put("email", r.FormValue("email"))
	session.Put("owner", r.FormValue("owner"))
	session.Put("loggedIn", true)
	log.Printf("Session data: %v\n", session.data)

	// Ensure the cookie is of type *http.Cookie
	if cookie == nil {
		http.Error(w, "Session cookie is nil", http.StatusInternalServerError)
		return
	}
	// Type assert the cookie to *http.Cookie
	cookie, ok := cookie.(*http.Cookie)
	if !ok {
		http.Error(w, "Invalid session cookie type", http.StatusInternalServerError)
		return
	}

	// Print the session cookie value to STDERR
	log.Printf("Session Cookie CGISESSID: %v\n", cookie)

	// Respond to the client
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Login successful")
}
