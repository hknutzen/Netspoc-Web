package backend

import (
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"

	"github.com/gorilla/handlers"
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
	mux := http.NewServeMux()
	mux.HandleFunc("/service_list", s.serviceList)
	mux.HandleFunc("/get_admins", s.getAdmins)
	mux.HandleFunc("/get_watchers", s.getWatchers)
	mux.HandleFunc("/get_admins_watchers", s.getAdminsWatchers)
	mux.HandleFunc("/get_rules", s.getRules)
	mux.HandleFunc("/get_users", s.getUsers)
	mux.HandleFunc("/get_services_and_rules", s.getServicesAndRules)
	mux.HandleFunc("/get_networks", s.getNetworks)
	mux.HandleFunc("/get_network_resources", s.getNetworkResources)
	mux.HandleFunc("/get_networks_and_resources", s.getNetworksAndResources)
	mux.Handle("/", httputil.NewSingleHostReverseProxy(perlServer))
	return mux
}

func MainHandler() http.Handler {
	return handlers.RecoveryHandler( /*handlers.PrintRecoveryStack(true)*/ )(getMux())
}

func abort(format string, args ...interface{}) {
	msg := fmt.Sprintf(format+"\n", args...)
	panic(msg)
}
