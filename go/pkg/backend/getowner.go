package backend

import (
	"net/http"
	"slices"
	"strings"
)

func (s *state) getOwner(w http.ResponseWriter, r *http.Request) {
	ow := r.FormValue("owner")
	l := s.findAuthorizedOwners(r)
	// Selected owner was stored before.
	if ow != "" && slices.Contains(l, ow) {
		writeRecords(w, []jsonMap{{"name": ow}})
		return
	}
	// Automatically select owner with most number of own services.
	best := ""
	maxSize := 0
	h := s.getHistoryParamOrCurrentPolicy(r)
	for _, ow := range l {
		sl := s.loadServiceLists(h, ow)
		size := len(sl.Owner)
		if size > maxSize {
			maxSize = size
			best = ow
		}
	}
	if best != "" {
		setOwner(r, best)
		writeRecords(w, []jsonMap{{"name": best}})
		return
	}
	writeRecords(w, []jsonMap{})
}

func (s *state) findAuthorizedOwners(r *http.Request) []string {
	m := s.loadEmail2Owners()
	email := getSession(r).Email
	_, dom, _ := strings.Cut(email, "@")
	wildcard := "[all]@" + dom
	result := slices.Concat(m[wildcard], m[email])
	slices.Sort(result)
	result = slices.Compact(result)
	return result
}
