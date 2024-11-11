package main

import (
	"log"
	"net/http"
	"os"

	"github.com/hknutzen/Netspoc-Web/go/pkg/backend"
)

func main() {
	port := os.Getenv("LISTENPORT")
	if port == "" {
		panic("LISTENPORT must be set")
	}
	listen := os.Getenv("LISTENADDRESS") + ":" + port
	log.Printf("Listening on %s", listen)
	log.Fatal(http.ListenAndServe(listen, backend.MainHandler()))
}
