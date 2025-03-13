package backend

import (
	"maps"
	"net/http"
	"slices"
)

func (s *state) getNetworks(w http.ResponseWriter, r *http.Request) {
	networks := s.generateNetworks(r)
	writeRecords(w, networks)
}

func (s *state) generateNetworks(r *http.Request) []*object {
	owner := r.FormValue("active_owner")
	chosen := r.FormValue("chosen_networks")
	history := r.FormValue("history")
	assets := s.loadAssets(history, owner)
	networkNames := assets.networkList
	if chosen != "" {
		networkNames = untaintNetworks(chosen, assets)
	}
	return getNatObjList(s, networkNames, owner, history)
}

func (s *state) getNetworkResourcesForNetworks(r *http.Request, selected string) []jsonMap {
	var data []jsonMap
	if selected != "" {
		owner := r.FormValue("active_owner")
		history := r.FormValue("history")
		assets := s.loadAssets(history, owner)
		networkNames := untaintNetworks(selected, assets)
		natSet := s.loadNATSet(history, owner)
		objects := s.loadObjects(history)
		for _, networkName := range networkNames {
			childNames := assets.net2childs[networkName]
			for _, childName := range childNames {
				obj := getObject(objects, childName)
				entry := jsonMap{
					"name":       networkName,
					"child_ip":   name2IP(s, history, childName, natSet),
					"child_name": childName,
					"child_owner": map[string]string{
						"owner": obj.Owner,
					},
				}
				data = append(data, entry)
			}
		}
	}
	return data
}

func (s *state) getNetworkResources(w http.ResponseWriter, r *http.Request) {
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	selected := r.FormValue("selected_networks")
	result := s.getNetworkResourcesForNetworks(r, selected)
	writeRecords(w, result)
}

func (s *state) getNetworksAndResources(w http.ResponseWriter, r *http.Request) {
	var result []jsonMap
	if !loggedIn(r) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	networks := s.generateNetworks(r)
	netsAsCSV := ""
	for _, network := range networks {
		netsAsCSV += network.name + ","
	}
	type Network struct {
		Name     string    `json:"name"`
		IP       string    `json:"ip"`
		Owner    string    `json:"owner"`
		Children []jsonMap `json:"children"`
	}
	data := s.getNetworkResourcesForNetworks(r, netsAsCSV)
	net2data := make(map[string]Network)
	for _, network := range networks {
		net2data[network.name] = Network{
			Name:     network.name,
			IP:       network.IP,
			Owner:    network.Owner,
			Children: []jsonMap{},
		}
	}
	for _, resource := range data {
		child := jsonMap{
			"ip":    resource["child_ip"],
			"name":  resource["child_name"],
			"owner": resource["child_owner"].(map[string]string)["owner"],
		}
		name := resource["name"].(string)
		network := net2data[name]
		network.Children = append(network.Children, child)
		net2data[name] = network
	}
	keys := slices.Sorted(maps.Keys(net2data))
	for _, netName := range keys {
		result = append(result, jsonMap{
			"name":     netName,
			"ip":       net2data[netName].IP,
			"owner":    net2data[netName].Owner,
			"children": net2data[netName].Children,
		})
	}
	writeRecords(w, result)
}
