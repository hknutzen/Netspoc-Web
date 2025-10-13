package backend

import (
	"net/http"
	"slices"
)

func (s *state) getDiffMail(w http.ResponseWriter, r *http.Request) {
	owner := r.FormValue("active_owner")
	store, err := GetUserStore(s.getUserFile(r))
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if slices.Contains(store.SendDiff, owner) {
		writeRecords(w, []map[string]bool{{"send": true}})
		return
	}
	writeRecords(w, []map[string]bool{{"send": false}})
}

// setDiffMail updates the user's preference for receiving diff emails
func (s *state) setDiffMail(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	if email == "guest" {
		writeError(w, "Can't send diff for user 'guest'", http.StatusBadRequest)
		return
	}
	s.validateOwner(w, r, true)
	owner := r.FormValue("active_owner")
	userFile := s.getUserFile(r)
	store, err := GetUserStore(userFile)
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}

	ln := len(store.SendDiff)
	if r.FormValue("send") == "true" {
		if !slices.Contains(store.SendDiff, owner) {
			store.SendDiff = append(store.SendDiff, owner)
		}
	} else {
		store.SendDiff = slices.DeleteFunc(store.SendDiff, func(v string) bool {
			return v == owner
		})
	}

	if len(store.SendDiff) != ln {
		if err := store.WriteToFile(userFile); err != nil {
			writeError(w, "Failed to write user store: "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
	writeRecords(w, []map[string]bool{{"success": true}})
}

func (s *state) getUserFile(r *http.Request) string {
	email := GetGoSession(r).Get("email").(string)
	userDir := s.config.UserDir
	return userDir + "/" + email
}
