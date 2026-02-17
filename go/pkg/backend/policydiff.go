package backend

import (
	"context"
	"fmt"
	"strconv"

	"github.com/pkg/diff/myers"
)

type diffState struct {
	cache    *cache
	v1, v2   string
	objects  map[string]any
	services map[string]any
}

func (c *cache) compare(v1, v2, owner string) (map[string]any, error) {
	d := &diffState{
		cache:    c,
		v1:       v1,
		v2:       v2,
		objects:  make(map[string]any),
		services: make(map[string]any),
	}
	result := d.diffServiceLists(owner)
	if df := d.diffUsersLists(owner); df != nil {
		result["users"] = df
	}

	addGlobal := func(key string, global map[string]any) {
		for name, df := range global {
			if df == nil {
				delete(global, name)
			}
		}
		if len(global) != 0 {
			result[key] = global
		}
	}
	addGlobal("objects", d.objects)
	addGlobal("services", d.services)
	return result, nil
}

func (d *diffState) diffServiceLists(owner string) map[string]any {
	a := d.cache.loadServiceLists(d.v1, owner)
	b := d.cache.loadServiceLists(d.v2, owner)
	result := make(map[string]any)
	if df := d.diffServiceList(a.Owner, b.Owner); df != nil {
		result["service_lists owner"] = df
	}
	if df := d.diffServiceList(a.User, b.User); df != nil {
		result["service_lists user"] = df
	}
	return result
}

func (d *diffState) diffUsersLists(owner string) any {
	a := d.cache.loadUsers(d.v1, owner)
	b := d.cache.loadUsers(d.v2, owner)
	result := make(map[string]any)
	// Iterate over service names.
	// Ignore removed or added services,
	// which are found when comparing service_lists.
	for sName, aL := range a {
		if bL, found := b[sName]; found {
			if df := d.diffObjectList(aL, bL); df != nil {
				result[sName] = df
			}
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func (d *diffState) diffServiceList(a, b []string) any {
	result := make(map[string][]string)
	ab := newPair(a, b)
	s := myers.Diff(context.Background(), ab)
	for _, r := range s.Ranges {
		if r.IsDelete() {
			result["-"] = append(result["-"], a[r.LowA:r.HighA]...)
		} else if r.IsInsert() {
			result["+"] = append(result["+"], b[r.LowB:r.HighB]...)
		} else {
			for _, name := range a[r.LowA:r.HighA] {
				if d.diffService(name) {
					result["!"] = append(result["!"], a[r.LowA:r.HighA]...)
				}
			}
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func (d *diffState) diffObjectList(a, b []string) any {
	result := make(map[string][]string)
	ab := newPair(a, b)
	s := myers.Diff(context.Background(), ab)
	for _, r := range s.Ranges {
		if r.IsDelete() {
			result["-"] = append(result["-"], a[r.LowA:r.HighA]...)
		} else if r.IsInsert() {
			result["+"] = append(result["+"], b[r.LowB:r.HighB]...)
		} else {
			for _, name := range a[r.LowA:r.HighA] {
				if d.diffObject(name) {
					result["!"] = append(result["!"], a[r.LowA:r.HighA]...)
				}
			}
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func (d *diffState) diffObject(name string) bool {
	diff, found := d.objects[name]
	if !found {
		a := d.cache.loadObjects(d.v1)[name]
		b := d.cache.loadObjects(d.v2)[name]
		m := make(map[string]any)
		if df := compareString(a.IP, b.IP); df != "" {
			m["ip"] = df
		}
		if df := compareString(a.IP6, b.IP6); df != "" {
			m["ip6"] = df
		}
		if df := compareString(a.Owner, b.Owner); df != "" {
			m["owner"] = df
		}
		if len(m) != 0 {
			diff = m
		}
		d.objects[name] = diff
	}
	return diff != nil
}

func (d *diffState) diffService(name string) bool {
	diff, found := d.services[name]
	if !found {
		a := d.cache.loadServices(d.v1)[name]
		b := d.cache.loadServices(d.v2)[name]
		m := make(map[string]any)
		if df := compareDetails(a, b); df != nil {
			m["details"] = df
		}
		if df := d.compareRules(a, b); df != nil {
			m["rules"] = df
		}
		if len(m) != 0 {
			diff = m
		}
		d.services[name] = diff
	}
	return diff != nil
}

func compareDetails(a, b *service) any {
	aD := a.Details
	bD := b.Details
	result := make(map[string]any)
	if df := compareString(aD.Description, bD.Description); df != "" {
		result["description"] = df
	}
	if df := compareBool(aD.Disabled, bD.Disabled); df != "" {
		result["disabled"] = df
	}
	if df := compareString(aD.DisableAt, bD.DisableAt); df != "" {
		result["disable_at"] = df
	}
	if df := compareStringList(aD.Owner, bD.Owner); df != nil {
		result["owner"] = df
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func (d *diffState) compareRules(a, b *service) any {
	if len(a.Rules) != len(b.Rules) {
		return "!"
	}
	result := make(map[string]any)
	for i, aRule := range a.Rules {
		bRule := b.Rules[i]
		if df := d.compareRule(aRule, bRule); df != nil {
			ruleNum := strconv.Itoa(i + 1)
			result[ruleNum] = df
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func (d *diffState) compareRule(a, b *rule) any {
	result := make(map[string]any)
	if df := compareString(a.Action, b.Action); df != "" {
		result["action"] = df
	}
	if df := d.diffObjectList(a.Src, b.Src); df != nil {
		result["src"] = df
	}
	if df := d.diffObjectList(a.Dst, b.Dst); df != nil {
		result["dst"] = df
	}
	if df := compareStringList(a.Prt, b.Prt); df != nil {
		result["prt"] = df
	}
	if len(result) == 0 {
		return nil
	}
	return result
}

func compareString(a, b string) string {
	if a == b {
		return ""
	}
	arrow := "\u2794"
	return fmt.Sprintf("%s %s %s", a, arrow, b)
}

func compareBool(a, b int) string {
	if a == b {
		return ""
	}
	if b != 0 {
		return "+"
	}
	return "-"
}

func compareStringList(a, b []string) any {
	result := make(map[string][]string)
	ab := newPair(a, b)
	s := myers.Diff(context.Background(), ab)
	for _, r := range s.Ranges {
		if r.IsDelete() {
			result["-"] = append(result["-"], a[r.LowA:r.HighA]...)
		} else if r.IsInsert() {
			result["+"] = append(result["+"], b[r.LowB:r.HighB]...)
		}
	}
	if len(result) == 0 {
		return nil
	}
	return result
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

func newPair(a, b []string) *pair {
	return &pair{a: a, b: b}
}
