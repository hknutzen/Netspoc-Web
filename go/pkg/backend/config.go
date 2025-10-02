package backend

import (
	"encoding/json"
	"os"
	"path"
)

type config struct {
	NetspocData        string   `json:"netspoc_data"`
	NoreplyAddress     string   `json:"noreply_address"`
	SessionDir         string   `json:"session_dir"`
	UserDir            string   `json:"user_dir"`
	SendmailCommand    string   `json:"sendmail_command"`
	MailTemplate       string   `json:"mail_template"`
	HTMLTemplate       string   `json:"html_template"`
	ExpireLoggedIn     int      `json:"expire_logged_in"`
	LdapURI            string   `json:"ldap_uri"`
	LdapDNTemplate     string   `json:"ldap_dn_template"`
	LdapBaseDN         string   `json:"ldap_base_dn"`
	LdapFilterTemplate string   `json:"ldap_filter_template"`
	LdapEmailAttr      string   `json:"ldap_email_attr"`
	BusinessUnits      []string `json:"business_units"`
	AboutInfoTemplate  string   `json:"about_info_template"`
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

	// Set some defaults
	var c config
	c.SendmailCommand = "/usr/lib/sendmail"
	c.MailTemplate = path.Join(home, "Netspoc-Web", "go", "pkg", "backend", "mail-templates")
	c.HTMLTemplate = path.Join(home, "Netspoc-Web", "go", "pkg", "backend", "html-templates")
	c.ExpireLoggedIn = 480 // 8 hours
	c.AboutInfoTemplate = c.HTMLTemplate + "/about_info"

	// Override with config file
	if err := json.Unmarshal(data, &c); err != nil {
		abort("in %q: %v", p, err)
	}

	// Check for required config vars.
	if c.NetspocData == "" {
		abort("netspoc_data must be set in %q", p)
	}
	if c.NoreplyAddress == "" {
		abort("noreply_address must be set in %q", p)
	}
	if c.SessionDir == "" {
		abort("session_dir must be set in %q", p)
	}
	if c.UserDir == "" {
		abort("user_dir must be set in %q", p)
	}

	// Check for unexpected config vars. The optional values are those in validKeys
	// that are not explicitly set or checked as mandatory above.
	configMap := make(map[string]interface{})
	if err := json.Unmarshal(data, &configMap); err != nil {
		abort("in %q: %v", p, err)
	}
	validKeys := map[string]bool{
		"netspoc_data":         true,
		"noreply_address":      true,
		"session_dir":          true,
		"user_dir":             true,
		"sendmail_command":     true,
		"mail_template":        true,
		"html_template":        true,
		"expire_logged_in":     true,
		"ldap_uri":             true,
		"ldap_dn_template":     true,
		"ldap_base_dn":         true,
		"ldap_filter_template": true,
		"ldap_email_attr":      true,
		"business_units":       true,
		"about_info_template":  true,
	}
	for k := range configMap {
		if !validKeys[k] {
			abort("Unknown config key %q in %q", k, p)
		}
	}
	return &c
}
