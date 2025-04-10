package backend

import (
	"net/http"
)

// This is a stub for now.
// TODO: Implement the register function to handle user registration.
func (s *state) register(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	records := make([]jsonMap, 0)
	records = append(records, jsonMap{
		"email": email,
	})
	writeRecords(w, records)
}
