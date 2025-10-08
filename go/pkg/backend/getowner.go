package backend

import (
	"net/http"
	"slices"
	"strings"
)

func (s *state) getOwners(w http.ResponseWriter, r *http.Request) {
	// Return all owners that the logged-in user is authorized to access.
	// This is used to populate the owner selection dropdown.
	authorizedOwners := s.findAuthorizedOwners(r)
	if len(authorizedOwners) == 0 {
		writeRecords(w, []jsonMap{})
		return
	}
	// Return as a list of {"name": owner}.
	var owners []map[string]string
	for _, owner := range authorizedOwners {
		owners = append(owners, map[string]string{"name": owner})
	}
	writeRecords(w, owners)
}

func (s *state) getOwner(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	owner := session.Get("owner")
	ow := ""
	if owner != nil {
		ow = owner.(string)
		if s.canAccessOwner(r, ow) {
			writeRecords(w, []jsonMap{{"name": ow}})
			return
		}
	}
	l := s.findAuthorizedOwners(r)
	// Selected owner was stored before.
	if ow != "" && slices.Contains(l, ow) {
		writeRecords(w, []jsonMap{{"name": ow}})
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
		session.Put("owner", best)
		writeRecords(w, []jsonMap{{"name": best}})
		return
	}
	writeRecords(w, []jsonMap{})
}

func (s *state) findAuthorizedOwners(r *http.Request) []string {
	m := s.loadEmail2Owners()
	email := GetGoSession(r).Get("email").(string)
	_, dom, _ := strings.Cut(email, "@")
	wildcard := "[all]@" + dom
	result := slices.Concat(m[wildcard], m[email])
	slices.Sort(result)
	result = slices.Compact(result)
	return result
}

// Validate active owner.
// Email could be removed from any owner role at any time in netspoc data.
func (s *state) validateOwner(r *http.Request, ownerNeeded bool) {
	activeOwner := r.URL.Query().Get("active_owner")
	if activeOwner != "" {
		if !ownerNeeded {
			abort("Must not send parameter 'active_owner'")
		}
		if !s.canAccessOwner(r, activeOwner) {
			abort("Not authorized to access owner '" + activeOwner + "'")
		}
	} else {
		if ownerNeeded {
			abort("Missing parameter 'active_owner'")
		}
	}
}

func (s *state) canAccessOwner(r *http.Request, owner string) bool {
	for _, authorizedOwner := range s.findAuthorizedOwners(r) {
		if owner == authorizedOwner {
			return true
		}
	}
	return false
}
