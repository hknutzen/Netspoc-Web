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
	email := getEmailFromSession(r)
	authorizedOwners := s.findAuthorizedOwners(email)
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
	ow := getOwnerFromSession(r)
	email := getEmailFromSession(r)
	authorizedOwners := s.findAuthorizedOwners(email)
	// Selected owner was stored before.
	if ow != "" && slices.Contains(authorizedOwners, ow) {
		writeRecords(w, []jsonMap{{"name": ow}})
		return
	}
	/* Automatically select owner with most number of own services.
	   1. Bestimme die Liste der Owner, die der aktuelle Benutzer
	      sehen darf, mittels findAuthorizedOwners.
	   2. Bestimme aus allen Services eine Map,
	      die angibt, wie viele Services einem Owner gehören.
	      Hierbei werden Multi-Owner-Dienste mehrfach gezählt.
	   3. Bestimme aus 1 und 2 den Owner, dem die meisten Services gehören.
	   4. Schaue für diesen Owner x in owner/x/extended_by
	      und prüfe, ob einer dieser übergeordneten Owner
	      in der Liste von Schritt 2 enthalten ist.
	      Dann nimm diesen, sonst den Owner aus Schritt 3.
	   5. Falls mehrere Owner bei 4. eingetragen sind,
	      bestimme den besten Owner aus der Anzahl
	      der Services in ower/x/service_list.
	*/

	// Create a map of owner to number of services first.
	histPar := s.getHistoryParamOrCurrentPolicy(r)
	services := s.loadServices(histPar)
	ownerToServiceCount := make(map[string]int)
	for _, service := range services {
		for _, owner := range service.Details.Owner {
			ownerToServiceCount[owner]++
		}
	}
	// Find owner with most services.
	bestOwner := ""
	maxServices := 0
	for _, ow := range authorizedOwners {
		count := ownerToServiceCount[ow]
		if count > maxServices {
			maxServices = count
			bestOwner = ow
		}
	}
	if bestOwner != "" {
		extBy := s.loadExtendedBy(histPar, bestOwner)
		maxSize := 0
		for _, entry := range extBy {
			ow := entry.Name
			sl := s.loadServiceLists(histPar, ow)
			size := len(sl.Owner)
			if size > maxSize {
				if slices.Contains(authorizedOwners, ow) {
					maxSize = size
					bestOwner = ow
				}
			}
		}
		session.Put("owner", bestOwner)
		writeRecords(w, []jsonMap{{"name": bestOwner}})
		return
	}
	writeRecords(w, []jsonMap{})
}

func (s *state) findAuthorizedOwners(email string) []string {
	m := s.loadEmail2Owners()
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
	email := getEmailFromSession(r)
	for _, authorizedOwner := range s.findAuthorizedOwners(email) {
		if owner == authorizedOwner {
			return true
		}
	}
	return false
}
