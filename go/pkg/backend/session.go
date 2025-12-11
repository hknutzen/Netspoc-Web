package backend

import (
	"fmt"
	"net/http"
)

// setSessionData handles the process of saving specific request parameters
// into the session. It validates the parameters against a predefined list
// of allowed keys and stores their values in the session.
// It is called as handler for URL /set
//
// Parameters:
//   - w: The HTTP response writer used to send responses to the client.
//   - r: The HTTP request containing the parameters to be saved.
//
// Behavior:
//   - Only parameters explicitly defined in the `saveParam` map are allowed
//     to be saved in the session.
//   - If an invalid parameter is encountered, an error response with
//     HTTP status 400 (Bad Request) is sent to the client.
//   - Valid parameters are stored in the session using the `Put` method.
//   - An empty JSON response is written to the client upon successful execution.
func (s *state) setSessionData(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	// Define the parameters that are allowed to be saved in the session.
	saveParam := map[string]bool{
		"owner": true,
	}
	// Parse the request parameters.
	r.ParseForm() // Populates r.PostForm
	for key, value := range r.PostForm {
		if len(value) > 1 {
			// There should be only one value per key.
			writeError(w, fmt.Sprintf("Multiple values for param '%s'", key), http.StatusBadRequest)
			return
		}
		// Check if the parameter is allowed to be saved.
		if !saveParam[key] {
			writeError(w, fmt.Sprintf("Invalid param '%s'", key), http.StatusBadRequest)
			return
		}
		session.Put(key, value[0]) // Store the first value for the key.
	}
	writeRecords(w, []jsonMap{})
}

func loggedIn(r *http.Request) bool {
	loggedIn := GetGoSession(r).Get("loggedIn")
	if loggedInBool, ok := loggedIn.(bool); ok {
		return loggedInBool
	}
	return false
}
