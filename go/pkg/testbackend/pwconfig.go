package testbackend

import (
	"fmt"
	"os"
	"path/filepath"
)

func PrepareConfig(homeDir string) {

	confData := []byte(fmt.Sprintf(`
{
"netspoc_data" : "%s",
"user_dir" : "%s",
"session_dir" : "%s",
"noreply_address" : "noreply",
}
`, filepath.Join(homeDir, "export"), filepath.Join(homeDir, "users"), filepath.Join(homeDir, "sessions")))
	fname := filepath.Join(homeDir, "policyweb.conf")
	err := os.WriteFile(fname, confData, 0666)
	check(err)
}

func check(e error) {
	if e != nil {
		panic(e)
	}
}
