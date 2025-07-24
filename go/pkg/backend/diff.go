package backend

import (
	"net/http"
)

func (s *state) getDiffMail(w http.ResponseWriter, r *http.Request) {
	userDir := s.config.UserDir
	email := r.FormValue("email")
	userFile := userDir + "/" + email
	store, err := getUserStore(userFile)
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(store.SendDiff) == 0 {
		writeRecords(w, map[string]bool{"send": false})
		return
	}
}

func (s *state) setDiffMail(w http.ResponseWriter, r *http.Request) {
}
