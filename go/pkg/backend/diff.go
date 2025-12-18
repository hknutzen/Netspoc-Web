package backend

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"slices"
)

func (s *state) getDiff(w http.ResponseWriter, r *http.Request) {
	owner := r.FormValue("active_owner")
	version := r.FormValue("version")
	selectedHistory := s.getHistoryParamOrCurrentPolicy(r)
	if version == "" {
		writeError(w, "version parameter is required", http.StatusBadRequest)
	}
	c := s.cache
	changed, err := c.compare(version, selectedHistory, owner)
	if err != nil {
		writeError(w, "Failed to get diff: "+err.Error(), http.StatusInternalServerError)
		return
	}
	text2css := map[string]string{
		"+": "icon-add",
		"-": "icon-delete",
		"!": "icon-page_edit",
	}

	// Convert to ExtJS tree.
	// Node: Map with attributes "text" and
	// - either "leaf: true"
	// - or "children: [ .. ]"
	// Add CSS class to special +,-,! nodes.
	// Top-level: slice of nodes
	node := func(text string, children any) any {
		result := make(map[string]any)
		if css, ok := text2css[text]; ok {
			result["iconCls"] = css
		} else {
			result["text"] = text
		}
		if children != nil {
			result["children"] = children
		} else {
			result["leaf"] = true
		}
		return result
	}
	var convert func(data any) any
	convert = func(data any) any {
		result := []any{}
		switch v := data.(type) {
		case map[string][]string:
			for _, k := range sortedKeys(v) {
				vv := v[k]
				childNodes := convert(vv)
				result = append(result, node(k, childNodes))
			}
		case map[string]any:
			for _, k := range sortedKeys(v) {
				vv := v[k]
				childNodes := convert(vv)
				l, ok := childNodes.([]string)
				if ok {
					result = append(result, node(k, l))
				} else {
					result = append(result, node(k, childNodes))
				}
			}
		case []string:
			slices.Sort(v)
			for _, vv := range v {
				result = append(result, node(vv, nil))
			}
		case string:
			result = append(result, node(v, nil))
		case int:
			s := fmt.Sprintf("%d", v)
			result = append(result, node(s, nil))
		default:
			msg := fmt.Sprintf("Unhandled default: %v TYPE: %v", v, reflect.TypeOf(v))
			writeError(w, msg, http.StatusInternalServerError)
		}
		return result
	}
	toplevelSort := map[string]int{"objects": 1, "services": 2}
	tree := convert(changed)
	if treeSlice, ok := tree.([]any); ok {
		slices.SortFunc(treeSlice, func(a, b any) int {
			aMap, aOk := a.(map[string]any)
			bMap, bOk := b.(map[string]any)
			if aOk && bOk {
				aText, aTextOk := aMap["text"].(string)
				bText, bTextOk := bMap["text"].(string)
				if aTextOk && bTextOk {
					aOrder, aOrderOk := toplevelSort[aText]
					bOrder, bOrderOk := toplevelSort[bText]
					if aOrderOk && bOrderOk {
						return aOrder - bOrder
					}
					if aOrderOk {
						return -1
					}
					if bOrderOk {
						return 1
					}
					if aText < bText {
						return -1
					} else if aText > bText {
						return 1
					}
				}
			}
			return 0
		})
		tree = treeSlice
	}
	w.Header().Set("Content-Type", "text/x-json")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	enc.Encode(tree)
}

func sortedKeys(m any) []string {
	var keys []string
	switch v := m.(type) {
	case map[string]any:
		keys = make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
	case map[string][]string:
		keys = make([]string, 0, len(v))
		for k := range v {
			keys = append(keys, k)
		}
	default:
		panic(fmt.Sprintf("unsupported map type: %T", m))
	}
	slices.Sort(keys)
	return keys
}

func (s *state) getDiffMail(w http.ResponseWriter, r *http.Request) {
	owner := r.FormValue("active_owner")
	store, err := GetUserStore(s.getUserFile(r))
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if slices.Contains(store.SendDiff, owner) {
		writeRecords(w, []map[string]bool{{"send": true}})
		return
	}
	writeRecords(w, []map[string]bool{{"send": false}})
}

// setDiffMail updates the user's preference for receiving diff emails
func (s *state) setDiffMail(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	if email == "guest" {
		writeError(w, "Can't send diff for user 'guest'", http.StatusBadRequest)
		return
	}
	s.validateOwner(w, r, true)
	owner := r.FormValue("active_owner")
	userFile := s.getUserFile(r)
	store, err := GetUserStore(userFile)
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}

	ln := len(store.SendDiff)
	if r.FormValue("send") == "true" {
		if !slices.Contains(store.SendDiff, owner) {
			store.SendDiff = append(store.SendDiff, owner)
		}
	} else {
		store.SendDiff = slices.DeleteFunc(store.SendDiff, func(v string) bool {
			return v == owner
		})
	}

	if len(store.SendDiff) != ln {
		if err := store.WriteToFile(userFile); err != nil {
			writeError(w, "Failed to write user store: "+err.Error(),
				http.StatusInternalServerError)
			return
		}
	}
	writeRecords(w, []map[string]bool{{"success": true}})
}

func (s *state) getUserFile(r *http.Request) string {
	email := GetGoSession(r).Get("email").(string)
	userDir := s.config.UserDir
	return userDir + "/" + email
}
