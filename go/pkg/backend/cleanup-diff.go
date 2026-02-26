// For each owner, the script uses the policydiff.go-compare
// function to check if there are any changes for that owner
// between the old and new versions. If changes are detected,
// the owner's name is printed. This allows users to quickly
// see which owners have had their policy data modified between
// the two specified versions.

package backend

import (
	"fmt"
	"os"
)

func FindOwnerDiffs() {
	config := LoadConfig()
	s := &state{
		cache: newCache(config.NetspocData, 8),
	}
	// Argument processing.
	// 2 params expected: old_version new_version
	if len(os.Args) != 3 {
		fmt.Fprintf(os.Stderr, "Usage: find-owner-diffs old_version new_version\nARGS:%v\n",
			os.Args)
		return
	}
	oldVersion := os.Args[1]
	newVersion := os.Args[2]

	// Find active owners
	ownersMap := make(map[string]string)
	emailToOwners := s.loadEmail2Owners()
	for email := range emailToOwners {
		owners := emailToOwners[email]
		for _, owner := range owners {
			ownersMap[owner] = owner
		}
	}
	// Compare files for each owner
	for owner := range ownersMap {
		changed, err := s.cache.compare(oldVersion, newVersion, owner)
		fmt.Fprintf(os.Stderr, "Compared owner %s: err=%v, changed=%v\n", owner, err, changed)
		if err != nil && len(changed) > 0 {
			fmt.Println(owner)
		}
	}
}
