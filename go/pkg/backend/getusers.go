package backend

import (
	"net/http"
)

func (s *state) getUsers(w http.ResponseWriter, r *http.Request) {
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	history := r.FormValue("history")
	owner := r.FormValue("active_owner")
	service := r.FormValue("service")
	if service == "" {
		abort("Missing parameter service")
	}
	if owner == "" {
		abort("Missing parameter active_owner")
	}
	_, users := getMatchingRulesAndUsers(s, r, service)
	writeRecords(w, getNatObjList(s, users, owner, history))
}

func getNatObjList(s *state, objNames []string, owner string, history string) []jsonMap {
	var result []jsonMap
	natSet := s.loadNATSet(history, owner)
	for _, objName := range objNames {
		obj := getNatObj(s, objName, natSet, history)
		objMap := jsonMap{
			"name": obj,
		}
		result = append(result, objMap)
	}
	//fmt.Fprintf(os.Stderr, "objList=%v\n", result)
	return result
}

func getNatObj(s *state, objName string, natSet map[string]bool, history string) *object {
	objects := s.loadObjects(history)
	obj := getObject(objects, objName)
	nat := obj.NAT
	for _, tag := range nat {
		if natSet[tag] {
			natIP := nat[tag]
			obj.IP = natIP
			break
		}
	}
	return obj
}

func getObject(objects map[string]*object, name string) *object {
	var result *object
	if object, found := objects[name]; found {
		return object
	}
	abort("Object %s not found", name)
	return result
}
