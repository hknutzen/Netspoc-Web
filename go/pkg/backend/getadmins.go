package backend

import (
	"net/http"
)

func (s *state) getAdmins(w http.ResponseWriter, r *http.Request) {
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("owner")
	if owner == "" {
		owner = r.FormValue("active_owner")
	}
	if owner == "" {
		abort("Missing owner parameter")
	}
	records := make([]jsonMap, 0)
	if owner != ":unknown" {
		emails := s.loadEmails(history, owner)
		for _, e := range emails {
			records = append(records, jsonMap{
				"email": e.Email,
			})
		}
	}
	writeRecords(w, records)
}
