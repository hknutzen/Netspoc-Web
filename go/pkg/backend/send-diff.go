package backend

import (
	"cmp"
	"fmt"
	"maps"
	"os"
	"slices"
	"strings"
)

func usage() {
	abort("Usage: send-diff yyyy-mm-dd yyyy-mm-dd|pxxx\n")
}

func SendDiff() {
	config := LoadConfig()
	path := config.NetspocData
	s := &state{
		config: config,
		cache:  newCache(config.NetspocData, 8),
	}
	if len(os.Args) != 3 {
		usage()
	}
	oldVer := os.Args[1]
	newVer := os.Args[2]

	userStoreDir := config.UserDir
	emailToOwners := s.loadEmail2Owners()

	userDir, err := os.Open(userStoreDir)
	if err != nil {
		abort("Error opening user directory: %v", err)
	}
	defer userDir.Close()

	users, err := userDir.Readdirnames(0)
	if err != nil {
		abort("Error reading user directory: %v", err)
	}

	ownerToSend := make(map[string][]string)
	for _, email := range users {
		if !strings.Contains(email, "@") {
			continue
		}
		wildcard := "[all]@" + email[strings.Index(email, "@")+1:]
		valid := make(map[string]bool)

		if owners, exists := emailToOwners[wildcard]; exists {
			for _, owner := range owners {
				valid[owner] = true
			}
		}
		if owners, exists := emailToOwners[email]; exists {
			for _, owner := range owners {
				valid[owner] = true
			}
		}
		userFile := fmt.Sprintf("%s/%s", userStoreDir, email)
		store, err := GetUserStore(userFile)
		if err != nil {
			fmt.Printf("Error loading user store for %s: %v\n", email, err)
			continue
		}
		if len(store.SendDiff) < 1 {
			continue
		}
		sendOk := []string{}
		for _, send := range store.SendDiff {
			if valid[send] {
				//fmt.Printf("Sending diff to %s for owner %s\n", email, send)
				sendOk = append(sendOk, send)
			}
		}

		for _, owner := range sendOk {
			ownerToSend[owner] = append(ownerToSend[owner], email)
		}

		// Alte, ungültige Owner herausnehmen,
		// da der Benutzer inzwischen weniger Rechte haben könnte
		// oder der Owner nicht mehr existiert.
		// Den Empfänger per Mail über entfernte Owner informieren.
		if len(sendOk) == len(store.SendDiff) {
			continue
		}
		for _, removed := range store.SendDiff {
			if !valid[removed] {
				fmt.Printf("Not sending diff to %s for removed owner %s\n", email, removed)

				var template string
				if _, err := os.Stat(fmt.Sprintf("%s/current/owner/%s", path, removed)); err == nil {
					template = fmt.Sprintf("%s/diff_owner_invisible", config.MailTemplate)
				} else {
					template = fmt.Sprintf("%s/diff_owner_unknown", config.MailTemplate)
				}
				text, err := s.getTemplateContent(template, map[string]string{
					"Email": email,
					"Owner": removed,
				})
				if err != nil {
					fmt.Printf("Failed to get email template for %s: %v\n", email, err)
					continue
				}
				err = s.sendEmail(text)
				if err != nil {
					fmt.Printf("Failed to send email to %s: %v\n", email, err)
					continue
				}
			}
		}
		store.SendDiff = sendOk
		err = store.WriteToFile(userFile)
		if err != nil {
			fmt.Printf("Failed to write user store for %s: %v\n", email, err)
			continue
		}
	}

	for owner := range ownerToSend {
		changes, err := s.compare(oldVer, newVer, owner)
		if err != nil || changes == nil {
			continue
		}
		diff := ""
		// Sort changes by toplevel keys.
		for _, key := range []string{"objects", "services", "service_lists owner", "service_lists user", "users"} {
			block := make(map[string]interface{})
			block[key] = changes[key]
			if block[key] == nil {
				continue
			}
			for _, line := range Convert(block, 0) {
				diff += line + "\n"
			}
			diff += "\n"
		}
		template := fmt.Sprintf("%s/diff", config.MailTemplate)
		for _, email := range ownerToSend[owner] {
			text, err := s.getTemplateContent(template, map[string]string{
				"Email":  email,
				"Owner":  owner,
				"OldVer": oldVer,
				"NewVer": newVer,
				"Diff":   diff,
			})
			if err != nil {
				fmt.Printf("Failed to get email template for %s: %v\n", email, err)
				continue
			}
			fmt.Fprintln(os.Stderr, "\n", text)
			/*
				err = s.sendEmail(text)
				if err != nil {
					fmt.Printf("Failed to send email to %s: %v\n", email, err)
					continue
				}
			*/
		}
	}
}

var replace = map[string]string{
	"+":                   "(+)",
	"-":                   "(-)",
	"!":                   "(!)",
	"service_lists owner": "Liste eigener Dienste",
	"service_lists user":  "Liste genutzter Dienste",
	"objects":             "Objekte",
	"services":            "Dienste",
	"users":               "Liste der Benutzer (User)",
}

// Convert should convert the changes coming from the func compare.
// The keys of the nested data structure should be changed in-place
// to more human-readable strings according to map "replace".
// The level parameter indicates the
// nesting level (0: top-level, 1: inside objects/services, etc.).
// Each replaced key should be prefixed with indentation spaces
// according to the nesting level.
// The result is a flat list of strings representing the changes.
// Each replaced key is on a new separate line.
func Convert(input interface{}, level int) []string {
	var result []string
	indent := strings.Repeat("  ", level)

	switch v := input.(type) {
	case map[string]interface{}:
		keys := slices.SortedFunc(maps.Keys(v), func(a, b string) int {
			return cmp.Compare(strings.ToLower(a), strings.ToLower(b))
		})
		for _, key := range keys {
			value := v[key]
			replacedKey := replace[key]
			if replacedKey == "" {
				replacedKey = key
			}
			result = append(result, fmt.Sprintf("%s%s", indent, replacedKey))
			switch nestedValue := value.(type) {
			case map[string]interface{}:
				result = append(result, Convert(nestedValue, level+1)...)
			case map[string][]string:
				for key, values := range nestedValue {
					replacedKey := replace[key]
					if replacedKey == "" {
						replacedKey = key
					}
					result = append(result, fmt.Sprintf("%s%s", indent, replacedKey))
					for _, val := range values {
						replacedValue := replace[val]
						if replacedValue == "" {
							replacedValue = val
						}
						result = append(result, fmt.Sprintf("%s%s", indent+"  ", replacedValue))
					}
				}
			case []interface{}:
				result = append(result, Convert(nestedValue, level+1)...)
			case []string:
				for _, val := range nestedValue {
					replacedValue := replace[val]
					if replacedValue == "" {
						replacedValue = val
					}
					result = append(result, fmt.Sprintf("%s%s", indent+"  ", replacedValue))
				}
			case string:
				replacedValue := replace[nestedValue]
				if replacedValue == "" {
					replacedValue = nestedValue
				}
				result = append(result, fmt.Sprintf("%s%s", indent+"  ", replacedValue))
			case int:
				result = append(result, fmt.Sprintf("%s%d", indent+"  ", nestedValue))
			case map[int]interface{}:
				result = append(result, Convert(nestedValue, level+1)...)
			default:
				fmt.Fprintf(os.Stderr, "Unhandled nested value type %T in Convert\n", nestedValue)
				result = append(result, fmt.Sprintf("%s%v", indent+"  ", nestedValue))
			}
		}
	case []interface{}:
		for _, item := range v {
			result = append(result, Convert(item, level)...)
		}
	case string:
		replacedValue := replace[v]
		if replacedValue == "" {
			replacedValue = v
		}
		result = append(result, fmt.Sprintf("%s%s", indent, replacedValue))
	}

	return result
}
