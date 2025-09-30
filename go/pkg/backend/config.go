package backend

import (
	"encoding/json"
	"os"
	"path"
)

type config struct {
	NetspocData     string `json:"netspoc_data"`
	NoreplyAddress  string `json:"noreply_address"`
	SessionDir      string `json:"session_dir"`
	UserDir         string `json:"user_dir"`
	SendmailCommand string `json:"sendmail_command"`
	MailTemplate    string `json:"mail_template"`
}

func loadConfig() *config {
	home, _ := os.UserHomeDir()
	var p string
	if os.Getenv("PW_FRONTEND_TEST") != "" {
		p = path.Join(home, "policyweb-test.conf")
	} else {
		p = path.Join(home, "policyweb.conf")
	}
	data, err := os.ReadFile(p)
	if err != nil {
		abort("Can't %v", err)
	}
	var c config
	if err := json.Unmarshal(data, &c); err != nil {
		abort("in %q: %v", p, err)
	}
	return &c
}
