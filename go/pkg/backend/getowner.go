package backend

import (
	"errors"
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

func getEmailFromSession(r *http.Request) string {
	email := GetGoSession(r).Get("email")
	if email == nil {
		return ""
	}
	return email.(string)
}

func (s *state) findAuthorizedOwners(r *http.Request) []string {
	m := s.loadEmail2Owners()
	email := getEmailFromSession(r)
	if email == "" {
		return []string{}
	}
	_, dom, _ := strings.Cut(email, "@")
	wildcard := "[all]@" + dom
	result := slices.Concat(m[wildcard], m[email])
	slices.Sort(result)
	result = slices.Compact(result)
	return result
}

// Validate active owner.
// Email could be removed from any owner role at any time in netspoc data.
func (s *state) validateOwner(r *http.Request, ownerNeeded bool) error {
	activeOwner := r.FormValue("active_owner")
	if activeOwner != "" {
		if !ownerNeeded {
			return errors.New("must not send parameter 'active_owner'")
		}
		if !s.canAccessOwner(r, activeOwner) {
			return errors.New("Not authorized to access owner '" + activeOwner + "'")
		}
	} else {
		if ownerNeeded {
			return errors.New("missing parameter 'active_owner'")
		}
	}
	return nil
}

func (s *state) canAccessOwner(r *http.Request, owner string) bool {
	for _, authorizedOwner := range s.findAuthorizedOwners(r) {
		if owner == authorizedOwner {
			return true
		}
	}
	return false
}
