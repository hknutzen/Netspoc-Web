package backend

import (
	"net/http"
	"slices"
)

func (s *state) getRules(w http.ResponseWriter, r *http.Request) {
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	history := r.FormValue("history")
	owner := r.FormValue("active_owner")
	service := r.FormValue("service")
	if history == "" {
		abort("Missing parameter history")
	}
	if service == "" {
		abort("Missing parameter service")
	}
	if owner == "" {
		abort("Missing parameter active_owner")
	}
	serviceLists := s.loadServiceLists(history, owner)
	if !serviceLists.accessible[service] {
		abort("Unknown service '%s'", service)
	}
	writeRecords(w, expandRules(s, r, service))
}

func expandRules(s *state, r *http.Request, service string) []jsonMap {
	rules, users := getMatchingRulesAndUsers(s, r, service)
	return adaptNameIPUser(s, r, rules, users)
}

func getMatchingRulesAndUsers(s *state, r *http.Request, service string) ([]*rule, []string) {
	owner := r.FormValue("active_owner")
	history := r.FormValue("history")
	services := s.loadServices(history)
	sname2users := s.loadUsers(history, owner)
	rules := services[service].Rules
	users := sname2users[service]
	chosenNetworks := s.getChosenNetworks(r)
	m1 := s.buildSearchMap(r, "search_ip1")
	m2 := s.buildSearchMap(r, "search_ip2")
	protoMatcher := getProtoMatcher(r)
	rules, users = selectRulesAndUsers(rules, users, chosenNetworks, nil, nil)
	rules, users = selectRulesAndUsers(rules, users, m1, m2, protoMatcher)
	return rules, users
}

/*
Get rules and users of selected service.
If search is active:
- one obj_hash:
  - if users match, then show all rules matching protocol
  - if users don't match, then show matching rules

- two obj_hash
  - if users match first hash, then show rules matching second hash
  - if users match second hash, then show rules matching first hash
  - if some users match first, some second and
    if some rules match first, some second
    then show all matching rules and users
*/
func selectRulesAndUsers(rules []*rule, users []string, obj1Map map[string]bool, obj2Map map[string]bool, protoMatcher func(string) bool) ([]*rule, []string) {
	if obj1Map != nil && obj2Map != nil {
		matchingUsers1 := selectUsers(users, obj1Map)
		matchingUsers2 := selectUsers(users, obj2Map)
		if len(matchingUsers1) > 0 && len(matchingUsers2) > 0 {
			rules1 := selectRules(rules, true, obj1Map, protoMatcher)
			rules2 := selectRules(rules, true, obj2Map, protoMatcher)
			if len(rules1) > 0 && len(rules2) > 0 {
				rules = slices.Compact(slices.Concat(rules1, rules2))
				users = slices.Compact(slices.Concat(matchingUsers1, matchingUsers2))
			} else if len(rules1) > 0 {
				rules = rules1
				users = matchingUsers2
			} else if len(rules2) > 0 {
				rules = rules2
				users = matchingUsers1
			} else {
				rules = nil
				users = nil
			}
		} else if len(matchingUsers1) > 0 {
			rules = selectRules(rules, false, obj2Map, protoMatcher)
			users = matchingUsers1
		} else if len(matchingUsers2) > 0 {
			rules = selectRules(rules, false, obj1Map, protoMatcher)
			users = matchingUsers2
		} else {
			rules = nil
			users = nil
		}
	} else {
		var objMap map[string]bool
		if obj1Map != nil {
			objMap = obj1Map
		} else {
			objMap = obj2Map
		}
		matchingUsers1 := selectUsers(users, objMap)
		if len(matchingUsers1) < 1 {
			rules = selectRules(rules, false, objMap, protoMatcher)
		} else {
			rules = selectRules(rules, false, nil, protoMatcher)
			users = matchingUsers1
		}
	}
	return rules, users
}

func selectUsers(users []string, objMap map[string]bool) []string {
	if objMap == nil {
		return users
	}
	result := []string{}
	for _, user := range users {
		if objMap[user] {
			result = append(result, user)
		}
	}
	return result
	//return slices.DeleteFunc(users, func(s string) bool { return !objMap[s] })
}

func selectRules(rules []*rule, matchingUsers bool, objMap map[string]bool, protoMatcher func(string) bool) []*rule {
	result := []*rule{}
	if objMap == nil && protoMatcher == nil {
		return rules
	}
RULE:
	for _, rule := range rules {
		if protoMatcher != nil {
			found := false
			for _, proto := range rule.Prt {
				if protoMatcher(proto) {
					found = true
				}
			}
			if !found {
				continue RULE
			}
		}
		if objMap == nil {
			result = append(result, rule)
			continue RULE
		}
		hasUser := rule.HasUser
		if hasUser == "both" {
			if matchingUsers {
				result = append(result, rule)
				continue RULE
			}
		}
		for _, obj := range rule.Src {
			if objMap[obj] {
				result = append(result, rule)
				continue RULE
			}
		}
		for _, obj := range rule.Dst {
			if objMap[obj] {
				result = append(result, rule)
				continue RULE
			}
		}
	}
	return result
}

/*
Substitute objects in rules by ip or name.
Substitute 'users' keyword by ip or name of users.
*/
func adaptNameIPUser(s *state, r *http.Request, rules []*rule, userNames []string) []jsonMap {
	result := []jsonMap{}
	history := r.FormValue("history")
	expandUsers := r.FormValue("expand_users")
	owner := r.FormValue("active_owner")
	dispProp := r.FormValue("display_property")
	natSet := s.loadNATSet(history, owner)

	getVal := func(names []string) any {
		if dispProp == "ip" {
			res := []string{}
			for _, name := range names {
				res = append(res, name2IP(s, history, name, natSet))
			}
			return slices.Compact(res)
		} else if dispProp == "ip_and_name" {
			var result []map[string]string
			for _, name := range names {
				m := make(map[string]string)
				m["name"] = name
				m["ip"] = name2IP(s, history, name, natSet)
				result = append(result, m)
			}
			return result
		} else {
			return names
		}
	}
	for _, rule := range rules {
		src := rule.Src
		dst := rule.Dst
		if expandUsers == "1" {
			if hasUser(rule, "src") {
				src = userNames
			}
			if hasUser(rule, "dst") {
				dst = userNames
			}
		}
		copy := jsonMap{
			"action": rule.Action,
			"src":    getVal(src),
			"dst":    getVal(dst),
			"prt":    rule.Prt,
		}
		copy["has_user"] = rule.HasUser
		result = append(result, copy)
	}
	return result
}

func name2IP(s *state, version string, objName string, natSet map[string]bool) string {
	objects := s.loadObjects(version)
	obj := objects[objName]
	if obj == nil {
		abort("Unknown object '%s'", objName)
	}
	objNat := obj.NAT
	for tag := range objNat {
		if natSet[tag] {
			obj.IP = objNat[tag]
			return obj.IP
		}
	}
	return obj.IP
}

func hasUser(rule *rule, what string) bool {
	result := false
	if what == "src" {
		result = rule.HasUser == "src" || rule.HasUser == "both"
	} else if what == "dst" {
		result = rule.HasUser == "dst" || rule.HasUser == "both"
	}
	return result
}
