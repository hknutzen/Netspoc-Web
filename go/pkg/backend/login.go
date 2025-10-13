package backend

// login.go - Handles user login

import (
	"fmt"
	"net/http"
	"strings"
)

func (s *state) setLogin(session *GoSession, email string) {
	session.Put("email", email)
	session.Put("loggedIn", true)
}

func (s *state) loginHandler(w http.ResponseWriter, r *http.Request) {

	session := GetGoSession(r)
	if session == nil {
		http.Error(w, "Session not found", http.StatusInternalServerError)
		return
	}
	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	if email != "guest" {
		pass := r.FormValue("pass")
		if pass == "" {
			http.Error(w, "Password is required", http.StatusBadRequest)
			return
		}
		userFile := fmt.Sprintf("%s/%s", s.config.UserDir, email)
		ustore, err := GetUserStore(userFile)
		if err != nil {
			writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if ustore == nil {
			writeError(w, "Empty user store for: "+email, http.StatusUnauthorized)
			return
		}
		if !ustore.CheckPassword(pass) {
			s.setAttack(r)
			writeError(w, "Login failed", http.StatusUnauthorized)
			return
		}
		s.clearAttack(r)
	}
	s.setLogin(session, email)

	// Redirect to referer/app.html.
	originalURL := strings.TrimSuffix(r.Header.Get("Referer"), "/index.html")
	if !strings.Contains(originalURL, "/") {
		originalURL = "/"
	}
	http.Redirect(w, r, originalURL+"/app.html", http.StatusSeeOther)
}
