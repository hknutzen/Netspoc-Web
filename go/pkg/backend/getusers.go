package backend

import (
	"net/http"
	"slices"
)

func (s *state) getUsers(w http.ResponseWriter, r *http.Request) {
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	service := r.FormValue("service")
	_, users := getMatchingRulesAndUsers(s, r, service)
	writeRecords(w, getCombinedObjList(s, users, owner, history))
}

func getNatObjList(s *state, objNames []string, owner string, history string) []*object {
	var result []*object
	natSet := s.loadNATSet(history, owner)
	for _, objName := range objNames {
		obj := getNatObj(s, objName, natSet, history)
		result = append(result, obj)
	}
	return result
}

func getIP6ObjList(s *state, objNames []string, history string) []*object {
	var result []*object
	for _, objName := range objNames {
		obj := getIP6Obj(s, objName, history)
		if obj != nil {
			result = append(result, obj)
		}
	}
	return result
}

// Return natObjList and IP6ObjList combined as []*object.
// The IP6ObjList is a seperate list of objects carrying the
// same name as the natObjList but with IP6 address in the attribute 'ip'.
func getCombinedObjList(s *state, objNames []string, owner string, history string) []*object {
	result := getNatObjList(s, objNames, owner, history)
	return slices.Concat(result, getIP6ObjList(s, objNames, history))
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
	if obj.IP != "" && obj.IP6 != "" {
		obj2 := *obj
		obj2.IP6 = ""
		return &obj2
	}
	return obj
}

func getIP6Obj(s *state, objName string, history string) *object {
	objects := s.loadObjects(history)
	obj := getObject(objects, objName)
	if obj.IP6 != "" {
		obj2 := *obj
		obj2.IP = obj.IP6
		obj2.IP6 = ""
		return &obj2
	}
	return nil
}

func getObject(objects map[string]*object, name string) *object {
	var result *object
	if object, found := objects[name]; found {
		return object
	}
	abort("Object %s not found", name)
	return result
}
