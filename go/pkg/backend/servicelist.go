package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/netip"
	"reflect"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"

	"go4.org/netipx"
)

type jsonMap map[string]any

func (s *state) generateServiceList(w http.ResponseWriter, r *http.Request) []jsonMap {
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return []jsonMap{}
	}
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	relation := r.FormValue("relation")
	serviceLists := s.loadServiceLists(history, owner)
	services := s.loadServices(history)

	var svcNames []string
	if relation != "" {
		switch relation {
		case "owner":
			svcNames = serviceLists.Owner
		case "user":
			svcNames = serviceLists.User
		case "visible":
			svcNames = serviceLists.Visible
		}
	} else {
		if r.FormValue("search_own") != "" {
			svcNames = append(svcNames, serviceLists.Owner...)
		}
		if r.FormValue("search_used") != "" {
			svcNames = append(svcNames, serviceLists.User...)
		}
		if r.FormValue("search_visible") != "" {
			svcNames = append(svcNames, serviceLists.Visible...)
		}
		if r.FormValue("search_disable_at") != "" {
			// Only services with attribute 'disable_at' will be searched.
			svcNames = slices.DeleteFunc(svcNames, func(name string) bool {
				return services[name].Details.DisableAt != ""
			})
		}
		sort.Strings(svcNames)
	}
	svcNames = s.selectChosenNetworks(svcNames, r)
	svcNames = s.selectIPSearch(svcNames, r)
	svcNames = s.selectStringSearch(svcNames, r)
	records := make([]jsonMap, 0)
	for _, name := range svcNames {
		j := make(jsonMap)
		j["name"] = name
		d := services[name].Details
		j["description"] = d.Description
		j["disabled"] = d.Disabled
		j["disable_at"] = d.DisableAt
		var l []jsonMap
		for _, o := range d.Owner {
			l = append(l, jsonMap{"name": o})
		}
		j["owner"] = l
		records = append(records, j)
	}
	return records
}

func (s *state) serviceList(w http.ResponseWriter, r *http.Request) {
	records := s.generateServiceList(w, r)
	writeRecords(w, records)
}

func (s *state) selectChosenNetworks(svcNames []string, r *http.Request,
) []string {
	m := s.getChosenNetworks(r)
	return s.selectServices(svcNames, r, m, nil, nil)
}

func (s *state) selectServices(svcNames []string, r *http.Request,
	m1, m2 map[string]bool, protoMatcher func(string) bool,
) []string {
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	services := s.loadServices(history)
	sname2users := s.loadUsers(history, owner)
	var result []string
SERVICE:
	for _, name := range svcNames {
		users := sname2users[name]
		rules := services[name].Rules

		match := func(m map[string]bool, l []string) bool {
			if m == nil {
				return true
			}
			for _, n := range l {
				if m[n] {
					return true
				}
			}
			return false
		}
		matchUsers := func(m map[string]bool) bool { return match(m, users) }
		matchProto := func(prtList []string) bool {
			for _, p := range prtList {
				if protoMatcher(p) {
					return true
				}
			}
			return false
		}
		matchRules := func(m map[string]bool) bool {
			if m == nil && protoMatcher == nil {
				return true
			}
			for _, rule := range rules {
				if protoMatcher != nil && !matchProto(rule.Prt) {
					continue
				}
				if m == nil {
					return true
				}
				switch rule.HasUser {
				case "both":
					if matchUsers(m) {
						return true
					}
				case "src":
					if match(m, rule.Dst) {
						return true
					}
				case "dst":
					if match(m, rule.Src) {
						return true
					}
				}
			}
			return false
		}

		if matchUsers(m1) {
			if matchRules(m2) {
				result = append(result, name)
				continue SERVICE
			}
		}
		if matchUsers(m2) {
			if matchRules(m1) {
				result = append(result, name)
			}
		}
	}
	return result
}

func (s *state) getChosenNetworks(r *http.Request) map[string]bool {
	chosen := r.FormValue("chosen_networks")
	if chosen == "" {
		return nil
	}
	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	assets := s.loadAssets(history, owner)
	netNames := untaintNetworks(chosen, assets)

	m := make(map[string]bool)
	for _, name := range netNames {
		m[name] = true
		for _, child := range assets.net2childs[name] {
			m[child] = true
		}
	}
	return m
}

// Search for search_ip1, search_ip2 in rules and users.
// If both are given,
// 1. search for ip1 in rules and ip2 in users
// 2. search for ip2 in rules and ip1 in users
// ip1 and ip2 can have an ip or string value.
// ip is
//   - single ip adress
//   - ip address followed by mask or prefix len
//     delimiter is slash or single blank.
//   - string value to search in object names.
//
// Algorithm:
// 1. Build map m1 with names of objects matching ip1
// 2. Build map m2 with names of objects matching ip2
// 3. Search rules and users by simply comparing object names.
func (s *state) selectIPSearch(svcNames []string, r *http.Request,
) []string {
	m1 := s.buildSearchMap(r, "search_ip1")
	m2 := s.buildSearchMap(r, "search_ip2")
	protoMatcher := getProtoMatcher(r)
	return s.selectServices(svcNames, r, m1, m2, protoMatcher)
}

// Build map having those object names as key which match
// search request in "search_ip1|2", "search_subnet", "search_supernet".
func (s *state) buildSearchMap(r *http.Request, key string) map[string]bool {
	search := r.FormValue(key)
	if search == "" {
		return nil
	}
	var prefix netip.Prefix
	if strings.Contains(search, "/") {
		p, err := netip.ParsePrefix(search)
		if err == nil {
			prefix = p
		}
	} else {
		addr, err := netip.ParseAddr(search)
		if err == nil {
			prefix = netip.PrefixFrom(addr, addr.BitLen())
		}
	}
	if prefix.IsValid() {
		return s.buildIPSearchMap(r, prefix)
	}
	return s.buildTextSearchMap(r, search)
}

func (s *state) buildTextSearchMap(r *http.Request, search string,
) map[string]bool {
	history := s.getHistoryParamOrCurrentPolicy(r)
	objects := s.loadObjects(history)
	matcher := getStringMatcher(r, search)

	// Collect names of matching objects.
	result := make(map[string]bool)
	for name := range objects {
		if matcher(name) {
			result[name] = true
		}
	}
	return result
}

// Chreate map having those object names as key which match
// IP search request.
func (s *state) buildIPSearchMap(r *http.Request, p netip.Prefix,
) map[string]bool {
	sub := r.FormValue("search_subnet") != ""

	// Prefix len 0 matches all.
	if p.Bits() == 0 && sub {
		return nil
	}

	history := s.getHistoryParamOrCurrentPolicy(r)
	owner := r.FormValue("active_owner")
	super := r.FormValue("search_supernet") != ""
	objects := s.loadObjects(history)
	natSet := s.loadNATSet(history, owner)

	// Adapt ip to mask.
	p = p.Masked()

	// For collecting matching supernets to be inserted into result.
	var supernets []string

	// Collect names of zones where at least one non supernet / non
	// aggregate matches. This is only needed if supernets are searched.
	// Later we will add only supernets of matching zones.
	matchingZones := make(map[string]bool)
	addMatchingZone := func(obj *object) {
		if super {
			matchingZones[obj.Zone] = true
		}
	}

	// Collect names of matching objects.
	result := make(map[string]bool)
	for name, obj := range objects {

		// Take NAT IP or real IP.
		ip := ""
		for tag, natIP := range obj.NAT {
			if natSet[tag] {
				ip = natIP
				break
			}
		}
		if ip == "" {
			ip = obj.IP
		}

		// Handle host range separately.
		if rg, err := netipx.ParseIPRange(ip); err == nil {
			if rg.Contains(p.Addr()) ||
				sub && (p.Contains(rg.From()) && p.Contains(rg.To())) {
				result[name] = true
			}
			continue
		}

		var prefix netip.Prefix
		if p2, err := netip.ParsePrefix(ip); err == nil {
			prefix = p2
		} else if addr, err := netip.ParseAddr(ip); err == nil {
			prefix = netip.PrefixFrom(addr, addr.BitLen())
		} else {
			// Ignore object without IP address (unnumbered, tunnel).
			continue
		}
		if prefix == p {
			// Interface with negotiated IP has IP/mask of its network.
			// Find it only, if subnets are searched.
			if !sub && !prefix.IsSingleIP() &&
				strings.HasPrefix(name, "interface:") {
				continue
			}
			// Add exact matching object.
			addMatchingZone(obj)
			result[name] = true
		} else if prefix.Bits() < p.Bits() {
			if super && !strings.HasPrefix(name, "interface:") {
				if prefix.Contains(p.Addr()) {
					if obj.IsSupernet != 0 {
						supernets = append(supernets, name)
						continue
					}
					if !strings.HasPrefix(name, "any:") {
						addMatchingZone(obj)
					}
					result[name] = true
				}
			}
		} else if sub && p.Contains(prefix.Addr()) {
			result[name] = true
		}
	}

	if len(matchingZones) == 0 {
		for _, name := range supernets {
			if strings.HasPrefix(name, "network:") {
				result[name] = true
			}
		}
	} else {
		for _, name := range supernets {
			z := objects[name].Zone
			if matchingZones[z] {
				result[name] = true
			}
		}
	}
	return result
}

var portRE = regexp.MustCompile(`^((?:tcp|udp) )?(\d+)$`)

// Input:
//   - tcp|udp NNN
//   - NNN
//   - tcp|udp
//   - some other string: search in protocol name and modifier
func getProtoMatcher(r *http.Request) func(string) bool {
	search := strings.ToLower(r.FormValue("search_proto"))
	if m := portRE.FindStringSubmatch(search); m != nil {
		tcpudp, port := m[1], m[2]
		if r.FormValue("search_range") != "" {
			if tcpudp == "" {
				tcpudp = `(?:tcp|udp) `
			}
			// tcp|udp [source-port:]port|port-range
			regex := regexp.MustCompile(fmt.Sprintf(
				`^%s(?:.*:)?(?:%s|(.*)-(.*))(?:$|,)`, tcpudp, port))
			portNum, _ := strconv.Atoi(port)
			return func(p string) bool {
				if m := regex.FindStringSubmatch(p); m != nil {
					if m[1] == "" {
						return true
					}
					p1, _ := strconv.Atoi(m[1])
					p2, _ := strconv.Atoi(m[2])
					if p1 <= portNum && portNum <= p2 {
						return true
					}
				}
				return false
			}
		} else {
			var regex *regexp.Regexp
			if tcpudp != "" {
				regex = regexp.MustCompile(fmt.Sprintf(
					`^%s(?:.*:)?%s(?:$|,)`, tcpudp, port))
			} else {
				// Search whole number: protcol, source-port, icmp type or code.
				regex = regexp.MustCompile(fmt.Sprintf(
					`(?:^|[- :/])%s($|[-:/,])`, port))
			}
			return func(p string) bool { return regex.MatchString(p) }
		}
	} else {
		// Search for protocol name, protocol modifier or other substring.
		return func(p string) bool { return strings.Contains(p, search) }
	}
}

func (s *state) selectStringSearch(svcNames []string, r *http.Request,
) []string {
	search := r.FormValue("search_string")
	if search == "" {
		return svcNames
	}
	history := s.getHistoryParamOrCurrentPolicy(r)
	services := s.loadServices(history)
	inDesc := r.FormValue("search_in_desc") != ""
	matcher := getStringMatcher(r, search)
	var result []string
	for _, name := range svcNames {
		if matcher(name) ||
			inDesc && matcher(services[name].Details.Description) {
			result = append(result, name)
		}
	}
	return result
}

func getStringMatcher(r *http.Request, search string) func(string) bool {
	caseSensitive := r.FormValue("search_case_sensitive") != ""
	exact := r.FormValue("search_exact") != ""
	if !caseSensitive {
		search = strings.ToLower(search)
	}
	return func(n string) bool {
		if !caseSensitive {
			n = strings.ToLower(n)
		}
		if exact {
			return n == search
		}
		return strings.Contains(n, search)
	}
}

// Intersect chosen networks with all networks of current owner.
func untaintNetworks(chosen string, a *assets) []string {
	l := strings.Split(chosen, ",")
	return intersect(l, a.networkList)
}

func intersect(s1, s2 []string) []string {
	m := make(map[string]bool)
	var result []string
	for _, e := range s1 {
		m[e] = true
	}
	for _, e := range s2 {
		if m[e] {
			result = append(result, e)
		}
	}
	return result
}

func writeRecords(w http.ResponseWriter, records any) {
	data := jsonMap{
		"success": true,
	}
	if v := reflect.ValueOf(records); v.Kind() == reflect.Slice {
		data["records"] = records
		data["totalCount"] = v.Len()
	} else {
		data["data"] = records
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", " ")
	enc.Encode(data)
}
