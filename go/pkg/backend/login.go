package backend

// login.go - Handles user login

import (
	"fmt"
	"net/http"

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
	http.Redirect(w, r, "/", http.StatusFound)
}

func (s *state) loginHandler(w http.ResponseWriter, r *http.Request) {

	session := GetGoSession(r)
	if session == nil {
		writeError(w, "Session not found", http.StatusInternalServerError)
		return
	}
	email := r.FormValue("email")
	if email == "" {
		writeError(w, "Email is required", http.StatusBadRequest)
		return
	}
	if email != "guest" {
		pass := r.FormValue("pass")
		if pass == "" {
			writeError(w, "Password is required", http.StatusBadRequest)
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
		err = s.checkAttack(r)
		if err != nil {
			writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if !ustore.CheckPassword(pass) {
			s.setAttack(r)
			//writeError(w, "Login failed", http.StatusUnauthorized)
			writeHTMLError(w, "Login failed")
			return
		}
		s.clearAttack(r)
	}
	s.setLogin(session, email)

	// Redirect to referer/app.html.
	s.redirectToLandingPage(w)
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
		//writeError(w, "LDAP connection failed: "+err.Error(), http.StatusInternalServerError)
		writeHTMLError(w, "Login failed")
		return ""
	}
	defer l.Close()

	dn := fmt.Sprintf(s.config.LdapDNTemplate, user)
	err = l.Bind(dn, pass)
	if err != nil {
		s.setAttack(r)
		//writeError(w, "LDAP bind failed: "+err.Error(), http.StatusUnauthorized)
		writeHTMLError(w, "Login failed")
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

func (s *state) redirectToLandingPage(w http.ResponseWriter) {
	// Redirect to ../app.html.
	// It is built this way to comply how it was implemented using Perl.
	// It works around the fact that the Redirect function from package http transforms
	// the relative URL into an absolute one, which can cause issues if the Referer
	// header is missing or malformed or modified.
	// The referrer header is modified by mod_proxy in Apache and this causes
	// the http.Redirect function to redirect to the wrong URL.
	// The following three lines are the essence of what is going on in the http.Redirect
	// function, but it doesn't transform the relative URL into an absolute one.
	// And it ignores the GET special cases and the generation of the HTML body for
	// non-GET requests, which is not needed in our case.
	h := w.Header()
	h.Set("Location", "../app.html")
	w.WriteHeader(http.StatusFound)
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
		//writeError(w, err.Error(), http.StatusForbidden)
		return
	}
	s.setLogin(session, email)
	s.redirectToLandingPage(w)
}

func writeHTMLError(w http.ResponseWriter, errorMsg string) {
	s := &state{
		config: LoadConfig(),
	}
	w.Header().Set("Connection", "close")
	w.WriteHeader(http.StatusInternalServerError)
	err := s.renderHtmlTemplate(w, "error", errorMsg)
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
	}
}
