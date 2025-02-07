package backend

import (
	"encoding/json"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"time"
)

/*
COPYRIGHT AND DISCLAIMER

(C) 2024 by Heinz Knutzen <heinz.knutzengmail.com>

https://github.com/hknutzen/Netspoc-Web

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

type cache struct {
	sync.Mutex
	maxVersions int
	netspocDir  string
	entries     map[string]*netspocData
}
type netspocData struct {
	accessed   time.Time
	email      map[string][]string // Map email address to selectable owners.
	emailMu    sync.Mutex
	objects    map[string]*object
	objectsMu  sync.Mutex
	services   map[string]*service
	servicesMu sync.Mutex
	owners     map[string]*ownerData
	ownersMu   sync.Mutex
}
type object struct {
	name       string
	IP         string
	NAT        map[string]string
	Zone       string
	IsSupernet int `json:"is_supernet"`
	Owner      string
}
type service struct {
	Details *struct {
		Description string
		Disabled    int
		DisableAt   string `json:"disable_at"`
		Owner       []string
	}
	Rules []*rule
}
type rule struct {
	HasUser string `json:"has_user"`
	Action  string
	Src     []string
	Dst     []string
	Prt     []string
}
type ownerData struct {
	assets   *assets
	assetsMu sync.Mutex
	// Active NAT tags of this owner.
	natSet   map[string]bool
	natSetMu sync.Mutex
	// Mapping from service to service users of this owner.
	users          map[string][]string
	usersMu        sync.Mutex
	serviceLists   *serviceLists
	serviceListsMu sync.Mutex
	emails         []emailEntry
	emailsMu       sync.Mutex
	watchers       []emailEntry
	watchersMu     sync.Mutex
	extendedBy     []string
	extendedByMu   sync.Mutex
}
type assets struct {
	networkList []string
	net2childs  map[string][]string
}
type serviceLists struct {
	Owner      []string
	User       []string
	Visible    []string
	accessible map[string]bool
}
type emailEntry struct {
	Email string
}

// Creates a new cache object.
//
// Store data of files in memory.
// Data is partially postprocessed after first loading.
func newCache(dir string, max int) *cache {
	return &cache{
		maxVersions: max,
		netspocDir:  dir,
		entries:     make(map[string]*netspocData),
	}
}

// Remove least recently used versions which exceed maxVersions.
func (c *cache) clean() {
	if len(c.entries) <= c.maxVersions {
		return
	}

	// Sort version keys by access time, least used comes first.
	versionsByAtime := slices.SortedFunc(maps.Keys(c.entries),
		func(a, b string) int {
			return c.entries[a].accessed.Compare(c.entries[b].accessed)
		})
	deleteTo := len(versionsByAtime) - c.maxVersions
	for _, version := range versionsByAtime[:deleteTo] {
		delete(c.entries, version)
	}
}

func (c *cache) getCacheEntry(version string) *netspocData {
	c.Lock()
	defer c.Unlock()
	entry, found := c.entries[version]
	if !found {
		c.clean()
		entry = &netspocData{
			owners: make(map[string]*ownerData),
		}
		c.entries[version] = entry
	}
	// Set last access time for data of this version.
	entry.accessed = time.Now()
	return entry
}

func (c *cache) getOwnerEntry(version, owner string) *ownerData {
	entry := c.getCacheEntry(version)
	entry.ownersMu.Lock()
	defer entry.ownersMu.Unlock()
	m := entry.owners
	oEntry := m[owner]
	if oEntry == nil {
		oEntry = &ownerData{}
		m[owner] = oEntry
	}
	return oEntry
}

func (c *cache) loadEmail2Owners() map[string][]string {
	base := c.netspocDir
	dir, err := filepath.EvalSymlinks(filepath.Join(base, "current"))
	if err != nil {
		panic(err)
	}
	policy := filepath.Base(dir)
	entry := c.getCacheEntry(policy)
	entry.emailMu.Lock()
	defer entry.emailMu.Unlock()
	if entry.email == nil {
		c.readPart(policy, "email", &entry.email)
	}
	return entry.email
}

func (c *cache) loadObjects(version string) map[string]*object {
	entry := c.getCacheEntry(version)
	entry.objectsMu.Lock()
	defer entry.objectsMu.Unlock()
	if entry.objects == nil {
		c.readPart(version, "objects", &entry.objects)
		// Fill attribute 'name' of each object.
		for name, object := range entry.objects {
			object.name = name
		}
	}
	return entry.objects
}

func (c *cache) loadServices(version string) map[string]*service {
	entry := c.getCacheEntry(version)
	entry.servicesMu.Lock()
	defer entry.servicesMu.Unlock()
	if entry.services == nil {
		c.readPart(version, "services", &entry.services)
	}
	return entry.services
}

func (c *cache) loadAssets(version, owner string) *assets {
	entry := c.getOwnerEntry(version, owner)
	entry.assetsMu.Lock()
	defer entry.assetsMu.Unlock()
	if entry.assets == nil {
		var origAssets struct {
			Anys map[string]struct {
				Networks map[string][]string
			}
		}
		c.readOwnerPart(version, owner, "assets", &origAssets)
		// Flatten nested data.
		result := &assets{net2childs: make(map[string][]string)}
		for _, n2c := range origAssets.Anys {
			maps.Copy(result.net2childs, n2c.Networks)
		}
		result.networkList = slices.Collect(maps.Keys(result.net2childs))
		entry.assets = result
	}
	return entry.assets
}

func (c *cache) loadNATSet(version, owner string) map[string]bool {
	entry := c.getOwnerEntry(version, owner)
	entry.natSetMu.Lock()
	defer entry.natSetMu.Unlock()
	if entry.natSet == nil {
		var origNAT []string
		c.readOwnerPart(version, owner, "nat_set", &origNAT)
		// Convert to map.
		m := make(map[string]bool)
		for _, tag := range origNAT {
			m[tag] = true
		}
		entry.natSet = m
	}
	return entry.natSet
}

func (c *cache) loadServiceLists(version, owner string) *serviceLists {
	entry := c.getOwnerEntry(version, owner)
	entry.serviceListsMu.Lock()
	defer entry.serviceListsMu.Unlock()
	if entry.serviceLists == nil {
		c.readOwnerPart(version, owner, "service_lists", &entry.serviceLists)
		// Add map with all accessible service names.
		m := make(map[string]bool)
		add := func(l []string) {
			for _, name := range l {
				m[name] = true
			}
		}
		add(entry.serviceLists.Owner)
		add(entry.serviceLists.User)
		add(entry.serviceLists.Visible)
		entry.serviceLists.accessible = m
	}
	return entry.serviceLists
}

func (c *cache) loadUsers(version, owner string) map[string][]string {
	entry := c.getOwnerEntry(version, owner)
	entry.usersMu.Lock()
	defer entry.usersMu.Unlock()
	if entry.users == nil {
		c.readOwnerPart(version, owner, "users", &entry.users)
	}
	return entry.users
}

func (c *cache) loadEmails(version, owner string) []emailEntry {
	entry := c.getOwnerEntry(version, owner)
	entry.emailsMu.Lock()
	defer entry.emailsMu.Unlock()
	if entry.emails == nil {
		c.readOwnerPart(version, owner, "emails", &entry.emails)
	}
	return entry.emails
}

func (c *cache) loadWatchers(version, owner string) []emailEntry {
	entry := c.getOwnerEntry(version, owner)
	entry.watchersMu.Lock()
	defer entry.watchersMu.Unlock()
	if entry.watchers == nil {
		c.readOwnerPart(version, owner, "watchers", &entry.watchers)
	}
	return entry.watchers
}

func (c *cache) loadExtendedBy(version, owner string) []string {
	entry := c.getOwnerEntry(version, owner)
	entry.extendedByMu.Lock()
	defer entry.extendedByMu.Unlock()
	if entry.extendedBy == nil {
		c.readOwnerPart(version, owner, "extended_by", &entry.extendedBy)
	}
	return entry.extendedBy
}

func (c *cache) readPart(version, part string, result interface{}) {
	dir := c.netspocDir
	if version[0] != 'p' {
		// No policy of today, but history of some older date.
		dir = filepath.Join(dir, "history")
	}
	realPath := filepath.Join(dir, version, part)
	fd, err := os.Open(realPath)
	if err != nil {
		panic(err)
	}
	defer fd.Close()
	dec := json.NewDecoder(fd)
	if err := dec.Decode(result); err != nil {
		panic(err)
	}
}

func (c *cache) readOwnerPart(version, owner, part string, result interface{}) {
	c.readPart(version, filepath.Join("owner", owner, part), result)
}
