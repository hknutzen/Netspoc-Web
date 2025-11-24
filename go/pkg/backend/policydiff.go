package backend

import (
	"context"
	"fmt"
	"os"

	"github.com/pkg/diff/myers"
)

type globalDiffs struct {
	Objects  map[string]interface{}
	Services map[string]interface{}
}

type pair struct {
	a []string
	b []string
}

func (ab *pair) LenA() int { return len(ab.a) }
func (ab *pair) LenB() int { return len(ab.b) }

func (ab *pair) Equal(i, j int) bool {
	return ab.a[i] == ab.b[j]
}

func newUsersPair(a, b []string) *pair {
	up := &pair{a: a, b: b}
	return up
}

func (cache *cache) diffUsers(v1, v2 string,
	oldUsers, newUsers map[string][]string) map[string]interface{} {

	usersMap := make(map[string]interface{})
	for serviceName, oUsers := range oldUsers {
		if newUsers[serviceName] == nil {
			continue
		}
		nUsers := newUsers[serviceName]
		ab := newUsersPair(oUsers, nUsers)
		s := myers.Diff(context.TODO(), ab)
		for _, r := range s.Ranges {
			if r.IsDelete() {
				for i := r.LowA; i < r.HighA; i++ {
					oUser := oUsers[i]
					if oUser != "" {
						if _, ok := usersMap[serviceName]; !ok {
							usersMap[serviceName] = make(map[string][]string)
						}
						if userMap, ok := usersMap[serviceName].(map[string][]string); ok {
							userMap["-"] = append(userMap["-"], oUser)
						} else {
							newUserMap := make(map[string][]string)
							newUserMap["-"] = []string{oUser}
							usersMap[serviceName] = newUserMap
						}
					}
				}
			} else if r.IsInsert() {
				for i := r.LowB; i < r.HighB; i++ {
					nUser := nUsers[i]
					if nUser != "" {
						if _, ok := usersMap[serviceName]; !ok {
							usersMap[serviceName] = make(map[string][]string)
						}
						if userMap, ok := usersMap[serviceName].(map[string][]string); ok {
							userMap["+"] = append(userMap["+"], nUser)
						} else {
							newUserMap := make(map[string][]string)
							newUserMap["+"] = []string{nUser}
							usersMap[serviceName] = newUserMap
						}
					}
				}
			} else {
				// handle equal
				old := cache.loadObjects(v1)
				new := cache.loadObjects(v2)
				for i := r.LowA; i < r.HighA; i++ {
					userVal := oUsers[i]
					cResult := cache.compareWithGlobalObjects(old, new, userVal)
					if len(cResult) > 0 {
						if _, ok := usersMap[serviceName]; !ok {
							usersMap[serviceName] = make(map[string][]string)
						}
						serializedResult := fmt.Sprintf("%v", cResult)
						if userMap, ok := usersMap[serviceName].(map[string][]string); ok {
							userMap["!"] = append(userMap["!"], serializedResult)
						} else {
							newUserMap := make(map[string][]string)
							newUserMap["!"] = []string{serializedResult}
							usersMap[serviceName] = newUserMap
						}
					}
				}
			}
		}
	}
	return usersMap
}

func (c *cache) compareWithGlobalObjects(old, new map[string]*object, key string) map[string]interface{} {
	oldObj, ok1 := old[key]
	newObj, ok2 := new[key]
	if ok1 && !ok2 {
		// deleted
		return map[string]interface{}{
			"-": oldObj,
		}
	} else if !ok1 && ok2 {
		// added
		return map[string]interface{}{
			"+": newObj,
		}
	} else {
		// compare
		return c.diff(oldObj, newObj, map[string]interface{}{})
	}
}

func (c *cache) compareGlobal(global globalDiffs, what, element string) map[string]interface{} {
	// what is either "objects" or "services"
	switch what {
	case "objects":
		if global.Objects[element] != nil {
			return global.Objects[element].(map[string]interface{})
		}
	case "services":
		if global.Services[element] != nil {
			return global.Services[element].(map[string]interface{})
		}
	default:
		abort("Unknown type (object|service) in compareGlobal:", what)
	}
	return nil
}

func (c *cache) diffServiceLists(oldServices, newServices *serviceLists) map[string]interface{} {
	oldOwnServices := oldServices.Owner
	newOwnServices := newServices.Owner
	ownerDiff := c.diff(oldOwnServices, newOwnServices, map[string]interface{}{})
	oldUserServices := oldServices.User
	newUserServices := newServices.User
	userDiff := c.diff(oldUserServices, newUserServices, map[string]interface{}{})
	result := make(map[string]interface{})
	if len(ownerDiff) > 0 {
		result["owner"] = ownerDiff
	}
	if len(userDiff) > 0 {
		result["user"] = userDiff
	}
	return result
}

func (c *cache) diffServices(v1, v2 string) map[string]interface{} {
	oldGlobalServices := c.genGlobalServicesMap(c.loadServices(v1))
	newGlobalServices := c.genGlobalServicesMap(c.loadServices(v2))
	fmt.Fprintf(os.Stderr, "OLD GLOBAL SERVICES: %v\n",
		oldGlobalServices["POL-MZED-ST_PROD_ST_ALG2WEB"].(map[string]any)["rules"])
	fmt.Fprintf(os.Stderr, "NEW GLOBAL SERVICES: %v\n",
		newGlobalServices["POL-MZED-ST_PROD_ST_ALG2WEB"].(map[string]any)["rules"])
	return c.diff(oldGlobalServices, newGlobalServices, map[string]interface{}{})
}

func (c *cache) diffObjects(v1, v2 string) map[string]interface{} {
	oldGlobalObjects := c.genGlobalObjectsMap(c.loadObjects(v1))
	newGlobalObjects := c.genGlobalObjectsMap(c.loadObjects(v2))
	return c.diff(oldGlobalObjects, newGlobalObjects, map[string]interface{}{})
}

func (c *cache) genGlobalObjectsMap(objects map[string]*object) map[string]any {
	globalObjects := make(map[string]any)
	for name, obj := range objects {
		details := map[string]any{}
		if obj.IP != "" {
			details["ip"] = obj.IP
		}
		if obj.IP6 != "" {
			details["ip6"] = obj.IP6
		}
		if obj.Owner != "" {
			details["owner"] = obj.Owner
		}
		if obj.IsSupernet > 0 {
			details["is_supernet"] = obj.IsSupernet
		}
		if obj.Zone != "" {
			details["zone"] = obj.Zone
		}
		if obj.NAT != nil {
			details["nat"] = obj.NAT
		}
		globalObjects[name] = details
	}
	return globalObjects
}

func (c *cache) genGlobalServicesMap(services map[string]*service) map[string]any {
	globalServices := make(map[string]any)
	for serviceName, serviceObj := range services {
		details := map[string]any{}
		if serviceObj.Details.Description != "" {
			details["desc"] = serviceObj.Details.Description
		}
		if len(serviceObj.Details.Owner) > 0 {
			details["owner"] = serviceObj.Details.Owner
		}
		if serviceObj.Details.Disabled > 0 {
			details["disabled"] = serviceObj.Details.Disabled
		}
		if serviceObj.Details.DisableAt != "" {
			details["disable_at"] = serviceObj.Details.DisableAt
		}

		globalServices[serviceName] = map[string]any{
			"rules":   map[string]any{},
			"details": details,
		}
		for i, rule := range serviceObj.Rules {
			idx := fmt.Sprintf("%d", i)
			rulesMap := globalServices[serviceName].(map[string]any)["rules"].(map[string]any)
			if rulesMap[idx] == nil {
				ruleData := map[string][]string{}
				if len(rule.Src) > 0 {
					ruleData["src"] = rule.Src
				}
				if len(rule.Dst) > 0 {
					ruleData["dst"] = rule.Dst
				}
				if len(rule.Prt) > 0 {
					ruleData["prt"] = rule.Prt
				}
				if len(ruleData) > 0 {
					rulesMap[idx] = ruleData
				}
			}
		}
	}
	return globalServices
}

func (c *cache) diff(old, new any, global map[string]interface{}) map[string]interface{} {
	ignore := map[string]bool{
		"hash":        true,
		"has_user":    true,
		"name":        true,
		"nat":         true,
		"is_supernet": true,
		"zone":        true,
	}
	result := make(map[string]interface{})
	switch oldType := old.(type) {
	case string:
		newStr, ok := new.(string)
		if !ok {
			abort("Not a string:", newStr)
		} else {
			oldStr := old.(string)
			if oldStr != newStr {
				arrow := "\u2794"
				r := fmt.Sprintf("%s %s %s", oldStr, arrow, newStr)
				result[r] = r
			}
		}
	case map[string]interface{}:

		for k, vOld := range oldType {
			if ignore[k] {
				continue
			}
			// Key has been removed in new version.
			vNew, ok := new.(map[string]interface{})[k]
			if !ok {
				result[k] = map[string]interface{}{
					"-": vOld,
				}
			} else {
				subDiff := c.diff(vOld, vNew, global)
				if len(subDiff) > 0 {
					fmt.Fprintf(os.Stderr, "SUBDIFF for key %s: %v\n", k, subDiff)
					result[k] = subDiff
				}
			}
		}
		for k, vNew := range new.(map[string]interface{}) {
			if ignore[k] {
				continue
			}
			// Key has been added in new version.
			_, ok := oldType[k]
			if !ok {
				result[k] = map[string]interface{}{
					"+": vNew,
				}
			}
		}
	case []string:
		newSlice, ok := new.([]string)
		if !ok {
			abort("Not a slice:", newSlice)
		} else {
			oldSlice := old.([]string)
			ab := &pair{a: oldSlice, b: newSlice}
			s := myers.Diff(context.TODO(), ab)
			for _, r := range s.Ranges {
				if r.IsDelete() {
					for i := r.LowA; i < r.HighA; i++ {
						oVal := oldSlice[i]
						if oVal != "" {
							if _, ok := result["-"]; !ok {
								result["-"] = []string{}
							}
							if vals, ok := result["-"].([]string); ok {
								result["-"] = append(vals, oVal)
							} else {
								newVals := []string{oVal}
								result["-"] = newVals
							}
						}
					}
				} else if r.IsInsert() {
					for i := r.LowB; i < r.HighB; i++ {
						nVal := newSlice[i]
						if nVal != "" {
							if _, ok := result["+"]; !ok {
								result["+"] = []string{}
							}
							if vals, ok := result["+"].([]string); ok {
								result["+"] = append(vals, nVal)
							} else {
								newVals := []string{nVal}
								result["+"] = newVals
							}
						}
					}
				} else {
					if global == nil {
						continue
					}
					for i := r.LowA; i < r.HighA; i++ {
						oVal := oldSlice[i]
						nVal := newSlice[i]
						if oVal != nVal {
							arrow := "\u2794"
							fmt.Fprintf(os.Stderr, "UNEQUAL: OLD:%v %s NEW:%v\n", oVal, arrow, nVal)
							continue
						}
						fmt.Fprintf(os.Stderr, "Equal: %v\n", oVal)
						gd := c.compareGlobal(global, "objects", oVal)
						if len(gd) > 0 {
							if _, ok := result["!"]; !ok {
								result["!"] = []string{}
							}
							if vals, ok := result["!"].([]string); ok {
								result["!"] = append(vals, oVal)
							} else {
								newVals := []string{oVal}
								result["!"] = newVals
							}
						}
					}
				}
			}
		}
	default:
		//fmt.Fprintf(os.Stderr, "Unhandled type in diff: %v", oldType)
	}
	return result
}

func (c *cache) compare(v1, v2, owner string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	globalDiffs := &globalDiffs{
		Objects:  c.diffObjects(v1, v2),
		Services: c.diffServices(v1, v2),
	}
	fmt.Fprintf(os.Stderr, "GLOBAL OBJECTS V1: %v\n", globalDiffs.Objects)
	fmt.Fprintf(os.Stderr, "GLOBAL SERVICES V1: %v\n", globalDiffs.Services)
	pathToDiffHandler := map[string]func(string, string) (map[string]interface{}, error){
		"service_lists": func(v1, v2 string) (map[string]interface{}, error) {
			oldServices := c.loadServiceLists(v1, owner)
			newServices := c.loadServiceLists(v2, owner)
			return c.diffServiceLists(oldServices, newServices), nil
		},
		"users": func(v1, v2 string) (map[string]interface{}, error) {
			oldUsers := c.loadUsers(v1, owner)
			newUsers := c.loadUsers(v2, owner)
			return c.diffUsers(v1, v2, oldUsers, newUsers), nil
		},
	}
	for _, what := range []string{"service_lists", "users"} {
		if handler, ok := pathToDiffHandler[what]; ok {
			diff, err := handler(v1, v2)
			if err != nil {
				return nil, err
			}
			if len(diff) > 0 {
				result[what] = diff
			}
		} else {
			return nil, fmt.Errorf("no diff handler for %s", what)
		}
	}

	// Change result["service_list"][<key>] to result["service_list <key>"].
	// <key> is either "user" or "owner".
	if len(result) > 0 {
		if _, ok := result["service_lists"]; ok {
			sl := result["service_lists"].(map[string]interface{})
			for k, v := range sl {
				result[fmt.Sprintf("service_lists %s", k)] = v
			}
			delete(result, "service_lists")
		}
	}

	// Add changed services to result.
	// Only keep the actual changed services.
	// Remove those that were added or removed, since they
	// are already included in service_lists.
	serviceChanges := c.diffServices(v1, v2)
	fmt.Fprintf(os.Stderr, "SERVICE CHANGES: %v\n", serviceChanges)
	/*
		for k, v := range serviceChanges {
			fmt.Fprint(os.Stderr, "-----> CHECKING SERVICE CHANGE KEY:", k, "\n")
			if _, ok := result["service_lists owner"]; ok {
				slOwner := result["service_lists owner"].(map[string]interface{})
				if _, ok2 := slOwner["+"]; ok2 {
					if _, ok3 := slOwner["+"].([]string); ok3 {
						// Service was added -> skip
						delete(serviceChanges, k)
						continue
					}
				} else if _, ok2 := slOwner["-"]; ok2 {
					if _, ok3 := slOwner["-"].([]string); ok3 {
						// Service was removed -> skip
						delete(serviceChanges, k)
						continue
					}
				} else {
					// Service was modified -> keep
					serviceChanges[k] = v
				}
			}
		}
	*/
	result["services"] = serviceChanges

	// TODO: remove this!!
	delete(result, "users")
	//delete(result, "objects")
	//delete(result, "service_lists user")
	//delete(result, "service_lists owner")

	return result, nil
}
