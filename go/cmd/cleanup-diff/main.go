// Find owner diffs for the cleanup daily cronjob.

package main

import "github.com/hknutzen/Netspoc-Web/go/pkg/backend"

func main() {
	backend.FindOwnerDiffs()
}
