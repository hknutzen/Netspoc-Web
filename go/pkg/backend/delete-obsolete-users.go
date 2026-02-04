// Compare users found in /home/netspocweb/users to list of admins and watchers
// found in json export data (/home/netspocweb/export/current) from netspoc.
// Delete those that are not found in export data.

package backend

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func DeleteObsoleteUsers() {
	config := LoadConfig()
	s := &state{
		cache: newCache(config.NetspocData, 8),
	}
	userStoreDir := config.UserDir
	emailToOwners := s.loadEmail2Owners()
	d, err := os.Open(userStoreDir)
	if err != nil {
		os.Exit(1)
	}
	defer d.Close()
	files, err := d.Readdirnames(-1)
	if err != nil {
		os.Exit(1)
	}
	now := time.Now()
	for _, email := range files {
		if !strings.Contains(email, "@") {
			continue
		}
		domain := strings.SplitN(email, "@", 2)[1]
		wildcard := "[all]@" + domain
		if _, ok := emailToOwners[wildcard]; ok {
			continue
		}
		if _, ok := emailToOwners[email]; ok {
			continue
		}
		filePath := filepath.Join(userStoreDir, email)
		info, err := os.Stat(filePath)
		if err != nil {
			continue
		}
		if now.Sub(info.ModTime()) > 7*24*time.Hour {
			if err := os.Remove(filePath); err != nil {
				fmt.Fprintf(os.Stderr, "Could not unlink %s: %v\n", filePath, err)
			}
		}
	}
}
