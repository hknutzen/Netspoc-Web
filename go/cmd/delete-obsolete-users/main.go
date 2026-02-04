// Deletes user files in users_dir that are not found in the export data (admins/watchers),
// and are at least 7 days old.

package main

import "github.com/hknutzen/Netspoc-Web/go/pkg/backend"

func main() {
	backend.DeleteObsoleteUsers()
}
