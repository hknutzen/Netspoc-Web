package backend

import (
	"net/http"
)

func (s *state) getWatchers(w http.ResponseWriter, r *http.Request) {
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	emails := s.loadWatchers(history, owner)
	records := make([]jsonMap, 0)
	for _, e := range emails {
		records = append(records, jsonMap{
			"email": e.Email,
		})
	}
	writeRecords(w, records)
}
