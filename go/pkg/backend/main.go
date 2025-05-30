package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"
)

type state struct {
	*cache
	config *config
}

func getMux() *http.ServeMux {
	cfg := loadConfig()
	s := &state{
		config: cfg,
		cache:  newCache(cfg.NetspocData, 8),
	}
	port := os.Getenv("PERLPORT")
	if port == "" {
		abort("PERLPORT must be set")
	}
	perlServer, err := url.Parse("http://localhost:" + port)
	if err != nil {
		panic(err)
	}

	noLoginMux := http.NewServeMux()
	noLoginMux.HandleFunc("/login", s.loginHandler)
	noLoginMux.HandleFunc("/get_policy", s.getPolicy)

	needsLoginMux := http.NewServeMux()
	needsLoginMux.HandleFunc("/get_admins", s.getAdmins)
	needsLoginMux.HandleFunc("/get_watchers", s.getWatchers)
	needsLoginMux.HandleFunc("/get_admins_watchers", s.getAdminsWatchers)
	needsLoginMux.HandleFunc("/get_rules", s.getRules)
	needsLoginMux.HandleFunc("/get_users", s.getUsers)
	needsLoginMux.HandleFunc("/get_services_and_rules", s.getServicesAndRules)
	needsLoginMux.HandleFunc("/get_networks", s.getNetworks)
	needsLoginMux.HandleFunc("/get_network_resources", s.getNetworkResources)
	needsLoginMux.HandleFunc("/get_networks_and_resources", s.getNetworksAndResources)
	needsLoginMux.HandleFunc("/get_history", s.getHistory)
	needsLoginMux.HandleFunc("/service_list", s.serviceList)

	createCookieMux := http.NewServeMux()
	//createCookieMux.HandleFunc("/register", s.register)

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
		} else if h, pattern := createCookieMux.Handler(r); pattern != "" {
			h.ServeHTTP(w, r)
		} else {
			httputil.NewSingleHostReverseProxy(perlServer).ServeHTTP(w, r)
		}
	})
	return defaultMux
}

func MainHandler() http.Handler {
	sessionManager := NewSessionManager(
		NewInMemorySessionStore(),
		30*time.Minute,
		1*time.Hour,
		12*time.Hour,
		"FOOBAR",
	)
	return sessionManager.Handle(getMux())
	//return handlers.RecoveryHandler( /*handlers.PrintRecoveryStack(true)*/ )(getMux())
}

func writeError(w http.ResponseWriter, errorMsg string, httpStatus int) {
	w.Header().Set("Content-Type", "text/x-json")
	w.WriteHeader(httpStatus)
	// Flusher is only needed temporarily.
	// TODO: remove this when we have a better way to handle HTTP Status
	// and encoding.
	flusher, ok := w.(http.Flusher)
	if !ok {
		errorMsg = "Error: http.Flusher not supported"
		abort(errorMsg)
	}
	data := jsonMap{
		"success": false,
		"msg":     errorMsg,
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", " ")
	enc.Encode(data)
	flusher.Flush()
}

func abort(format string, args ...interface{}) {
	msg := fmt.Sprintf(format+"\n", args...)
	panic(msg)
}
