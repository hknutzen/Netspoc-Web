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

func MainHandler() http.Handler {
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
	mux.Handle("/", httputil.NewSingleHostReverseProxy(perlServer))
	return handlers.RecoveryHandler( /*handlers.PrintRecoveryStack(true)*/ )(mux)
}

func abort(format string, args ...interface{}) {
	msg := fmt.Sprintf(format+"\n", args...)
	panic(msg)
}
