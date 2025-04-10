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
	emails := s.loadEmails(history, owner)
	records := make([]jsonMap, 0)
	for _, e := range emails {
		records = append(records, jsonMap{
			"email": e.Email,
		})
	}
	writeRecords(w, records)
}
