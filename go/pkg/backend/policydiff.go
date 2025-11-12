package backend

import (
	"context"
	"fmt"
	"os"
	"slices"

	"github.com/pkg/diff/myers"
)

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
		return c.diff(oldObj, newObj)
	}
}

func (c *cache) compareWithGlobalServices(old, new map[string]*service, key string) map[string]interface{} {
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
		return c.diff(oldObj, newObj)
	}
}

func (c *cache) diffServiceLists(oldServices, newServices *serviceLists) map[string]interface{} {
	oldOwnServices := oldServices.Owner
	newOwnServices := newServices.Owner
	ownerDiff := c.diff(oldOwnServices, newOwnServices)
	oldUserServices := oldServices.User
	newUserServices := newServices.User
	userDiff := c.diff(oldUserServices, newUserServices)
	result := make(map[string]interface{})
	if len(ownerDiff) > 0 {
		result["owner"] = ownerDiff
	}
	if len(userDiff) > 0 {
		result["user"] = userDiff
	}
	return result
}

type rulesPair struct {
	a []*rule
	b []*rule
}

func (ab *rulesPair) LenA() int { return len(ab.a) }
func (ab *rulesPair) LenB() int { return len(ab.b) }

func (ab *rulesPair) Equal(i, j int) bool {
	return ab.a[i].Action == ab.b[j].Action &&
		ab.a[i].Service == ab.b[j].Service &&
		slices.Equal(ab.a[i].Src, ab.b[j].Src) &&
		slices.Equal(ab.a[i].Dst, ab.b[j].Dst) &&
		slices.Equal(ab.a[i].Prt, ab.b[j].Prt)
}

func (c *cache) diffServices(oldService *service, newService any) map[string]interface{} {
	result := make(map[string]interface{})
	oldRules := oldService.Rules
	newServiceTyped, ok := newService.(*service)
	if !ok {
		abort("Not a service:", newServiceTyped)
	} else {
		newRules := newServiceTyped.Rules
		ab := &rulesPair{a: oldRules, b: newRules}
		s := myers.Diff(context.TODO(), ab)
		ruleChanges := make(map[int]interface{})
		for _, r := range s.Ranges {
			if r.IsDelete() {
				for i := r.LowA; i < r.HighA; i++ {
					idx := i + 1 // start counting rules at 1
					oRule := oldRules[i]
					if oRule != nil {
						if _, ok := ruleChanges[idx]; !ok {
							ruleChanges[idx] = []interface{}{}
						}
						if rulesSlice, ok := ruleChanges[idx].([]interface{}); ok {
							ruleChanges[idx] = append(rulesSlice, oRule)
						} else {
							newRulesSlice := []interface{}{oRule}
							ruleChanges[idx] = newRulesSlice
						}
					}
				}
			} else if r.IsInsert() {
				for i := r.LowB; i < r.HighB; i++ {
					idx := i + 1 // start counting rules at 1
					nRule := newRules[i]
					if nRule != nil {
						if _, ok := ruleChanges[idx]; !ok {
							ruleChanges[idx] = []interface{}{}
						}
						if rulesSlice, ok := ruleChanges[idx].([]interface{}); ok {
							ruleChanges[idx] = append(rulesSlice, nRule)
						} else {
							newRulesSlice := []interface{}{nRule}
							ruleChanges[idx] = newRulesSlice
						}
					}
				}
			} else {
				// handle equal
				for i := r.LowA; i < r.HighA; i++ {
					idx := i + 1 // start counting rules at 1
					oRule := oldRules[i]
					nRule := newRules[i]
					ruleDiff := c.diff(oRule, nRule)
					if len(ruleDiff) > 0 {
						fmt.Fprintf(os.Stderr, "Rule diff for rule %d: %v\n", idx, ruleDiff)
						ruleChanges[idx] = ruleDiff
					}
				}
			}
		}
		if len(ruleChanges) > 0 {
			result["rules"] = ruleChanges
		}
	}
	return result
}

func (c *cache) diff(old, new any) map[string]interface{} {
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
				subDiff := c.diff(vOld, vNew)
				if len(subDiff) > 0 {
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
					// Handle equal -> nothing to do here!
					// If two string slices are equal, they are just that: equal
				}
			}
		}
	case *object:
		newObj, ok := new.(*object)
		if !ok {
			abort("Not an object:", newObj)
		} else {
			// Compare IP6
			if oldType.IP6 != newObj.IP6 {
				result["ip6"] = map[string]interface{}{
					"from": oldType.IP6,
					"to":   newObj.IP6,
				}
			}
		}
	case *service:
		serviceDiff := c.diffServices(oldType, new)
		if len(serviceDiff) > 0 {
			for k, v := range serviceDiff {
				result[k] = v
			}
		}
	case *rule:
		newRule, ok := new.(*rule)
		if !ok {
			abort("Not a rule:", newRule)
		} else {
			// Compare slices Src, Dst, Prt
			sliceFields := map[string]struct {
				old []string
				new []string
			}{
				"src": {old: oldType.Src, new: newRule.Src},
				"dst": {old: oldType.Dst, new: newRule.Dst},
				"prt": {old: oldType.Prt, new: newRule.Prt},
			}
			for fieldName, slices := range sliceFields {
				ab := &pair{a: slices.old, b: slices.new}
				s := myers.Diff(context.TODO(), ab)
				fieldChanges := make(map[string][]string)
				for _, r := range s.Ranges {
					if r.IsDelete() {
						for i := r.LowA; i < r.HighA; i++ {
							oVal := slices.old[i]
							if oVal != "" {
								fieldChanges["-"] = append(fieldChanges["-"], oVal)
							}
						}
					} else if r.IsInsert() {
						for i := r.LowB; i < r.HighB; i++ {
							nVal := slices.new[i]
							if nVal != "" {
								fieldChanges["+"] = append(fieldChanges["+"], nVal)
							}
						}
					}
				}
				if len(fieldChanges) > 0 {
					result[fieldName] = fieldChanges
				}
			}
		}
	case []interface{}:
		//oldSlice := old.([]interface{})
		newSlice, ok := new.([]interface{})
		if !ok {
			abort("Not a slice:", newSlice)
		} else {
			/*
				oLen := len(oldSlice)
				nLen := len(newSlice)
				if len(newSlice) > 0 && len(oldSlice) > 0 {

				}
			*/
		}
	default:
		//fmt.Fprintf(os.Stderr, "Unhandled type in diff: %v", oldType)
	}
	return result
}

func (c *cache) compare(v1, v2, owner string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
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

	/*
		type service struct {
			Details *struct {
				Description string
				Disabled    int    `json:"disabled,omitempty"`
				DisableAt   string `json:"disable_at,omitempty"`
				Owner       []string
			}
			Rules []*rule
		}
	*/
	// Add changed services to result.
	oldServices := c.loadServices(v1)
	newServices := c.loadServices(v2)
	serviceChanges := make(map[string]interface{})
	for serviceName, oldService := range oldServices {
		newService, ok := newServices[serviceName]
		if !ok {
			// Service deleted.
			serviceChanges[serviceName] = map[string]interface{}{
				"-": oldService,
			}
			continue
		}
		serviceDiff := c.diff(oldService, newService)
		if len(serviceDiff) > 0 {
			serviceChanges[serviceName] = serviceDiff
		}
	}
	for serviceName, newService := range newServices {
		_, ok := oldServices[serviceName]
		if !ok {
			// Service added.
			serviceChanges[serviceName] = map[string]interface{}{
				"+": newService,
			}
		}
	}
	result["services"] = serviceChanges

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
	// TODO: remove this!!
	delete(result, "users")
	delete(result, "objects")
	delete(result, "service_lists user")
	delete(result, "service_lists owner")

	return result, nil
}
