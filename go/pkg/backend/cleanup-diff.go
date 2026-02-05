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
	"time"
)

func FindOwnerDiffs() {
	config := LoadConfig()
	s := &state{
		config: config,
		cache:  newCache(config.NetspocData, 8),
	}
	// Argument processing.
	// 2 params expected: old_version new_version
	os.Args = os.Args[1:]
	if len(os.Args) != 2 {
		fmt.Fprintln(os.Stderr, "Usage: find-owner-diffs old_version new_version")
		return
	}
	oldVersion := os.Args[0]
	newVersion := os.Args[1]

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
		start := time.Now() // Start measuring time
		changed, err := s.cache.compare(oldVersion, newVersion, owner)
		duration := time.Since(start).Seconds() // Measure elapsed time in seconds
		fmt.Printf("%s (took %v)\n", owner, duration)
		if err != nil {
			continue
		}
		if len(changed) > 0 {
			fmt.Printf("%s (took %v)\n", owner, duration)
		}
	}
}
