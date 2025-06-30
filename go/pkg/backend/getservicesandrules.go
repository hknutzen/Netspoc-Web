package backend

import (
	"net/http"
)

func (s *state) getServicesAndRules(w http.ResponseWriter, r *http.Request) {
	expandUsers := r.FormValue("expand_users")
	serviceRecords := s.generateServiceList(r)

	// If no services are found, return an empty result.
	result := []jsonMap{}

	for _, service := range serviceRecords {
		service, ok := service["name"].(string)
		if !ok {
			http.Error(w, "Invalid service name", http.StatusInternalServerError)
			return
		}
		rules := s.expandRules(r, service)

		// Adapt multi service result.
		for _, rule := range rules {
			// The service name on the rule is needed for grouping in the frontend.
			rule["service"] = service
			if expandUsers != "1" {
				if rule["has_user"] == "src" {
					rule["src"] = []string{"User"}
				}
				if rule["has_user"] == "dst" {
					rule["dst"] = []string{"User"}
				}
			}
			result = append(result, rule)
		}
	}
	writeRecords(w, result)
}
