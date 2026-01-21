package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
	"runtime/debug"
	"time"
)

type state struct {
	*cache
	config         *config
	sessionManager *SessionManager
}

func getMux() (*http.ServeMux, *state) {
	cfg := LoadConfig()
	sm := NewSessionManager(
		NewFileSystemSessionStore(cfg.SessionDir),
		30*time.Minute,
		1*time.Hour,
		12*time.Hour,
		"PWGOSESSID",
	)
	s := &state{
		config:         cfg,
		cache:          newCache(cfg.NetspocData, 8),
		sessionManager: sm,
	}
	noLoginMux := http.NewServeMux()
	noLoginMux.HandleFunc("/login", s.loginHandler)
	noLoginMux.HandleFunc("/ldap_login", s.ldapLoginHandler)
	noLoginMux.HandleFunc("/get_policy", s.getPolicy)
	noLoginMux.HandleFunc("/register", s.register)
	noLoginMux.HandleFunc("/verify", s.verify)

	needsLoginMux := http.NewServeMux()
	needsLoginMux.HandleFunc("/get_diff", s.getDiff)
	needsLoginMux.HandleFunc("/get_diff_mail", s.getDiffMail)
	needsLoginMux.HandleFunc("/set_diff_mail", s.setDiffMail)
	needsLoginMux.HandleFunc("/get_admins", s.getAdmins)
	needsLoginMux.HandleFunc("/get_watchers", s.getWatchers)
	needsLoginMux.HandleFunc("/get_admins_watchers", s.getAdminsWatchers)
	needsLoginMux.HandleFunc("/get_owners", s.getOwners)
	needsLoginMux.HandleFunc("/get_owner", s.getOwner)
	needsLoginMux.HandleFunc("/get_rules", s.getRules)
	needsLoginMux.HandleFunc("/get_users", s.getUsers)
	needsLoginMux.HandleFunc("/get_services_and_rules", s.getServicesAndRules)
	needsLoginMux.HandleFunc("/get_networks", s.getNetworks)
	needsLoginMux.HandleFunc("/get_network_resources", s.getNetworkResources)
	needsLoginMux.HandleFunc("/get_networks_and_resources", s.getNetworksAndResources)
	needsLoginMux.HandleFunc("/get_history", s.getHistory)
	needsLoginMux.HandleFunc("/get_supervisors", s.getSupervisors)
	needsLoginMux.HandleFunc("/logout", s.logoutHandler)
	needsLoginMux.HandleFunc("/service_list", s.serviceList)
	needsLoginMux.HandleFunc("/set", s.setSessionData)

	defaultMux := http.NewServeMux()
	defaultMux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if h, pattern := needsLoginMux.Handler(r); pattern != "" {
			if !loggedIn(r) {
				writeError(w, "Login required", http.StatusInternalServerError)
				return
			}
			h.ServeHTTP(w, r)
		} else if h, pattern := noLoginMux.Handler(r); pattern != "" {
			h.ServeHTTP(w, r)
		}
	})
	return defaultMux, s
}

func MainHandler() http.Handler {
	mux, s := getMux()
	return RecoveryHandler(SessionHandler(s, mux))
}

func SessionHandler(s *state, h http.Handler) http.Handler {

	sessionManager := s.sessionManager
	if sessionManager == nil {
		sessionManager = NewSessionManager(
			NewFileSystemSessionStore(s.config.SessionDir),
			30*time.Minute,
			1*time.Hour,
			12*time.Hour,
			"PWGOSESSID",
		)
		s.sessionManager = sessionManager
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionManager.Handle(h).ServeHTTP(w, r)
	})
}

func RecoveryHandler(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				msg := fmt.Errorf("%s - %s", err, debug.Stack())
				writeError(w, msg.Error(), http.StatusInternalServerError)
			}
		}()
		h.ServeHTTP(w, r)
	})
}

func writeError(w http.ResponseWriter, errorMsg string, httpStatus int) {
	w.Header().Set("Connection", "close")
	w.Header().Set("Content-Type", "text/x-json")
	w.WriteHeader(httpStatus)
	// Flusher is only needed temporarily.
	// TODO: remove this when we have a better way to handle HTTP Status
	// and encoding.
	/*
		flusher, ok := w.(http.Flusher)
		if !ok {
			errorMsg = "Error: http.Flusher not supported"
			abort(errorMsg)
		}
	*/
	data := jsonMap{
		"success": false,
		"msg":     errorMsg,
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", " ")
	enc.Encode(data)
	//flusher.Flush()
}

func abort(format string, args ...interface{}) {
	msg := fmt.Sprintf(format+"\n", args...)
	panic(msg)
}
