package backend

import (
	"errors"
	"fmt"
	"os"
)

func diffServiceLists(oldServices, newServices map[string]serviceList) map[string]interface{} {
	result := make(map[string]interface{})
	jsonEq(oldServices, newServices, &result)
	if len(result) == 0 {
		return nil
	}
	return result
}

func diffUsers(oldUsers, newUsers map[string][]string) map[string]interface{} {
	result := make(map[string]interface{})
	jsonEq(oldUsers, newUsers, &result)
	if len(result) == 0 {
		return nil
	}
	return result
}

func (c *cache) compare(v1, v2, owner string) (map[string]interface{}, error) {
	result := make(map[string]interface{})
	whatList := []string{"service_lists", "users"}

	for _, what := range whatList {
		path := fmt.Sprintf("owner/%s/%s", owner, what)

		oldData := c.loadAssets(v1, owner)
		newData := c.loadAssets(v2, owner)

		diffFunc, ok := path2diff[what]
		if !ok {
			return nil, errors.New("diff function not found")
		}

		diff, err := diffFunc(state, oldData, newData)
		if err != nil {
			return nil, err
		}
		if diff != nil {
			result[what] = diff
		}
	}

	globalDiff := state.DiffCache
	for _, what := range []string{"objects", "services"} {
		hash := globalDiff[what]
		if len(hash) == 0 {
			continue
		}

		for key, value := range hash {
			if value == nil {
				delete(hash, key)
			}
		}

		if len(hash) > 0 {
			result[what] = hash
		}
	}

	if serviceLists, ok := result["service_lists"].(map[string]interface{}); ok {
		delete(result, "service_lists")
		for key, value := range serviceLists {
			result[fmt.Sprintf("service_lists %s", key)] = value
		}
	}

	return result, nil
}

func isValidDate(date string) bool {
	// Implement date validation logic if needed
	return true
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
