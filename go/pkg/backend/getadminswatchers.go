package backend

import (
	"net/http"
	"slices"
	"strings"
)

func (s *state) getAdminsWatchers(w http.ResponseWriter, r *http.Request) {
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	history := r.FormValue("history")
	owner := r.FormValue("owner")
	if owner == "" {
		abort("Missing parameter owner")
	}
	watchers := s.loadWatchers(history, owner)
	admins := s.loadEmails(history, owner)
	combined := slices.Concat(watchers, admins)
	records := make([]jsonMap, 0)
	slices.SortStableFunc(combined, func(a, b emailEntry) int {
		return strings.Compare(a.Email, b.Email)
	})
	for _, e := range combined {
		records = append(records, jsonMap{
			"email": e.Email,
		})
	}
	writeRecords(w, records)
}
