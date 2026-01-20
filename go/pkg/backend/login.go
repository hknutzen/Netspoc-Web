package backend

// login.go - Handles user login

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/go-ldap/ldap/v3"
)

func (s *state) setLogin(session *GoSession, email string) {
	session.Put("email", email)
	session.Put("loggedIn", true)
}

func (s *state) logout(session *GoSession) {
	session.Put("loggedIn", false)
}

func (s *state) logoutHandler(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	s.logout(session)
	http.Redirect(w, r, "/", http.StatusSeeOther)
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
	s.redirectToLandingPage(w, r)
}

func (s *state) ldapCheckPassGetEmail(w http.ResponseWriter, r *http.Request) string {
	email := ""
	user := r.FormValue("user")
	if user == "" {
		writeError(w, "Missing param 'user'", http.StatusBadRequest)
		return ""
	}
	pass := r.FormValue("pass")
	if pass == "" {
		writeError(w, "Missing param 'pass'", http.StatusBadRequest)
		return ""
	}
	s.checkAttack(r)
	ldapURI := s.config.LdapURI
	baseDN := s.config.LdapBaseDN
	emailAttr := s.config.LdapEmailAttr
	l, err := ldap.DialURL(ldapURI)
	if err != nil {
		writeError(w, "LDAP connection failed: "+err.Error(), http.StatusInternalServerError)
		return ""
	}
	defer l.Close()

	dn := fmt.Sprintf(s.config.LdapDNTemplate, user)
	err = l.Bind(dn, pass)
	if err != nil {
		s.setAttack(r)
		writeError(w, "LDAP bind failed: "+err.Error(), http.StatusUnauthorized)
		return ""
	}
	s.clearAttack(r)

	filter := fmt.Sprintf("("+s.config.LdapFilterTemplate+")", ldap.EscapeFilter(user))
	searchRequest := ldap.NewSearchRequest(
		baseDN,
		ldap.ScopeWholeSubtree, ldap.NeverDerefAliases, 0, 0, false,
		filter,
		[]string{emailAttr},
		nil,
	)

	result, err := l.Search(searchRequest)
	if err != nil {
		writeError(w, "LDAP search failed: "+err.Error(), http.StatusInternalServerError)
		return ""
	}
	if len(result.Entries) != 1 {
		writeError(w, "LDAP search returned unexpected number of entries", http.StatusUnauthorized)
		return ""
	}
	email = result.Entries[0].GetAttributeValue(emailAttr)
	if email == "" {
		msg := fmt.Sprintf("Can't find email address for %v", searchRequest.Filter)
		writeError(w, msg, http.StatusUnauthorized)
		return ""
	}
	return email
}

func (s *state) redirectToLandingPage(w http.ResponseWriter, r *http.Request) {
	// Redirect to referer/app.html.
	originalURL := r.Header.Get("Referer")
	originalURL = strings.TrimSuffix(originalURL, "/index.html")
	originalURL = strings.TrimSuffix(originalURL, "/ldap-login.html")
	originalURL = strings.TrimSuffix(originalURL, "/")
	redirURL := originalURL + "/app.html"
	http.Redirect(w, r, redirURL, http.StatusSeeOther)
}

func (s *state) ldapLoginHandler(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	s.logout(session)
	email := s.ldapCheckPassGetEmail(w, r)
	if email == "" {
		return
	}
	err := s.checkEmailAuthorization(email)
	if err != nil {
		writeError(w, err.Error(), http.StatusForbidden)
		return
	}
	s.setLogin(session, email)
	s.redirectToLandingPage(w, r)
}
