package backend

import (
	"context"
	"fmt"
	"os"

	"github.com/pkg/diff/myers"
)

type globalData struct {
	v1          string
	v2          string
	DiffCache   map[string]any
	OldObjects  map[string]any
	NewObjects  map[string]any
	OldServices map[string]any
	NewServices map[string]any
}

func (c *cache) loadVersionForPath(version, path, owner string) map[string]any {
	switch path {
	case "objects":
		objects := c.loadObjects(version)
		convertedObjects := make(map[string]any)
		for k, v := range objects {
			convertedObjects[k] = v
		}
		return convertedObjects
	case "service_lists":
		serviceLists := c.loadServiceLists(version, owner)
		convertedServiceLists := make(map[string]any)
		convertedServiceLists["owner"] = serviceLists.Owner
		convertedServiceLists["user"] = serviceLists.User
		return convertedServiceLists
	case "services":
		services := c.loadServices(version)
		convertedServices := make(map[string]any)
		for k, v := range services {
			convertedServices[k] = v
		}
		return convertedServices
	default:
		abort("Unknown path in loadVersionForPath:", path)
	}
	return nil
}

func (c *cache) compareGlobal(state globalData, path, key string) any {
	cache := state.DiffCache
	if cache[path] == nil {
		cache[path] = make(map[string]any)
	}
	hash := cache[path].(map[string]any)
	if val, ok := hash[key]; ok {
		return val
	}
	old, ok1 := state.OldServices[key].(map[string]any)
	new, ok2 := state.NewServices[key].(map[string]any)
	if path == "objects" {
		old, ok1 = state.OldObjects[key].(map[string]any)
		new, ok2 = state.NewObjects[key].(map[string]any)
	}
	if !ok1 || !ok2 {
		return nil
	}
	if new == nil {
		hash[key] = "-"
		return "-"
	}
	if old == nil {
		hash[key] = "+"
		return "+"
	}
	diff := c.diff(state, old, new, "")
	if len(diff) > 0 {
		hash[key] = diff
		return diff
	}
	return ""
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

func (c *cache) diffUsers(state globalData, old, new map[string][]string) map[string]any {
	result := make(map[string]any)
	usersMap := make(map[string]interface{})
	for key := range old {
		oVal := old[key]
		nVal, ok := new[key]
		if !ok {
			continue
		}
		ab := newUsersPair(oVal, nVal)
		s := myers.Diff(context.TODO(), ab)
		for _, r := range s.Ranges {
			if r.IsDelete() {
				for i := r.LowA; i < r.HighA; i++ {
					userVal := oVal[i]
					if _, ok := usersMap[key]; !ok {
						usersMap[key] = make(map[string][]string)
					}
					if userMap, ok := usersMap[key].(map[string][]string); ok {
						userMap["-"] = append(userMap["-"], userVal)
					} else {
						newUserMap := make(map[string][]string)
						newUserMap["-"] = []string{userVal}
						usersMap[key] = newUserMap
					}
				}
				result[key] = usersMap[key]
			} else if r.IsInsert() {
				for i := r.LowB; i < r.HighB; i++ {
					userVal := nVal[i]
					if _, ok := usersMap[key]; !ok {
						usersMap[key] = make(map[string][]string)
					}
					if userMap, ok := usersMap[key].(map[string][]string); ok {
						userMap["+"] = append(userMap["+"], userVal)
					} else {
						newUserMap := make(map[string][]string)
						newUserMap["+"] = []string{userVal}
						usersMap[key] = newUserMap
					}
				}
				result[key] = usersMap[key]
			} else {
				// handle equal
				for i := r.LowA; i < r.HighA; i++ {
					userVal := oVal[i]
					cResult := c.compareGlobal(state, "objects", userVal)
					if cResult != "" {
						if _, ok := usersMap[key]; !ok {
							usersMap[key] = make(map[string][]string)
						}
						serializedResult := fmt.Sprintf("%v", cResult)
						if userMap, ok := usersMap[key].(map[string][]string); ok {
							userMap["!"] = append(userMap["!"], serializedResult)
						} else {
							newUserMap := make(map[string][]string)
							newUserMap["!"] = []string{serializedResult}
							usersMap[key] = newUserMap
						}
					}
				}
			}
		}
	}
	return usersMap
}

func (c *cache) diffServiceLists(state globalData, owner string) map[string]any {
	result := make(map[string]any)
	for _, key := range []string{"owner", "user"} {
		old := c.loadVersionForPath(state.v1, "service_lists", owner)[key]
		new := c.loadVersionForPath(state.v2, "service_lists", owner)[key]
		diff := c.diff(state, old, new, "services")
		if len(diff) > 0 {
			result[key] = diff
		}
	}
	return result
}

func (c *cache) genGlobalObjectsMap(objects map[string]*object) map[string]any {
	globalObjects := make(map[string]any)
	for name, obj := range objects {
		details := map[string]any{}
		if obj.IP != "" {
			details["ip"] = obj.IP
		}
		if obj.Owner != "" {
			details["owner"] = obj.Owner
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
			idx := fmt.Sprintf("%d", i+1)
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

func (c *cache) diff(state globalData, old, new any, global string) map[string]interface{} {
	lookup := map[string]string{
		"src": "objects",
		"dst": "objects",
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
				result[r] = ""
			}
		}
	case map[string]interface{}:

		for k, vOld := range oldType {
			// Key has been removed in new version.
			vNew, ok := new.(map[string]interface{})[k]
			if !ok {
				result[k] = map[string]interface{}{
					"-": vOld,
				}
			} else {
				subDiff := c.diff(state, vOld, vNew, lookup[k])
				if len(subDiff) > 0 {
					//fmt.Fprintf(os.Stderr, "SUBDIFF for key %s: %v\n", k, subDiff)
					result[k] = subDiff
				}
			}
		}
		for k, vNew := range new.(map[string]interface{}) {
			// Key has been added in new version.
			_, ok := oldType[k]
			if !ok {
				result[k] = map[string]interface{}{
					"+": vNew,
				}
			}
		}
	case map[string][]string:
		//fmt.Fprintf(os.Stderr, "OLD map[string][]string: %v\n", oldType)
		//fmt.Fprintf(os.Stderr, "NEW map[string][]string: %v\n", new)
		for k, vOld := range oldType {
			vNew, ok := new.(map[string][]string)[k]
			if !ok {
				result[k] = map[string][]string{
					"-": vOld,
				}
			} else {
				subDiff := c.diff(state, vOld, vNew, lookup[k])
				if len(subDiff) > 0 {
					//fmt.Fprintf(os.Stderr, "SUBDIFF for key %s: %v\n", k, subDiff)
					result[k] = subDiff
				}
			}
		}
		for k, vNew := range new.(map[string][]string) {
			_, ok := oldType[k]
			if !ok {
				result[k] = map[string][]string{
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
					// Equal case. Find diffs against global data.
					if global == "" {
						continue
					}
					for i := r.LowA; i < r.HighA; i++ {
						oVal := oldSlice[i]
						gd := c.compareGlobal(state, global, oVal)
						if gd != "" {
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
	case int:
		newInt := new.(int)
		oldInt := old.(int)
		if oldInt != newInt {
			arrow := "\u2794"
			r := fmt.Sprintf("%d %s %d", oldInt, arrow, newInt)
			result[r] = r
		}
	default:
		fmt.Fprintf(os.Stderr, "Unhandled type in diff: %v \n", oldType)
		os.Exit(1)
	}
	return result
}

func (c *cache) genGlobalCompareData(v1, v2 string) globalData {
	oldObjects := c.genGlobalObjectsMap(c.loadObjects(v1))
	newObjects := c.genGlobalObjectsMap(c.loadObjects(v2))
	oldServices := c.genGlobalServicesMap(c.loadServices(v1))
	newServices := c.genGlobalServicesMap(c.loadServices(v2))
	return globalData{
		v1:          v1,
		v2:          v2,
		OldObjects:  oldObjects,
		NewObjects:  newObjects,
		OldServices: oldServices,
		NewServices: newServices,
		DiffCache:   make(map[string]any),
	}
}

func (c *cache) compare(v1, v2, owner string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	state := c.genGlobalCompareData(v1, v2)

	diff := c.diffServiceLists(state, owner)
	if len(diff) > 0 {
		result["service_lists"] = diff
	}
	old := c.loadUsers(v1, owner)
	new := c.loadUsers(v2, owner)
	diff = c.diffUsers(state, old, new)
	if len(diff) > 0 {
		result["users"] = diff
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

	globalDiff := state.DiffCache
	for _, what := range []string{"objects", "services"} {
		hash, ok := globalDiff[what].(map[string]any)
		if !ok || hash == nil || len(hash) < 1 {
			continue
		} else {
			for key := range hash {
				// If keys "object" or "services" in the cache are empty,
				// delete the whole key.
				if _, ok := hash[key]; ok {
					if val, ok := hash[key].(map[string]any); ok && len(val) < 1 {
						delete(hash, key)
					}
				}
			}
		}
		// Only add objects and services to result, if those hashes are non-empty.
		if len(hash) > 0 {
			result[what] = hash
		}
	}
	return result, nil
}
