package backend

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"regexp"
)

func (s *state) getHistoryParamOrCurrentPolicy(r *http.Request) string {
	history := r.FormValue("history")
	if history == "" {
		return s.currentPolicy(r)
	}
	return history
}

func (s *state) currentPolicy(r *http.Request) string {
	return s.getPolicy()[0]["policy"]
}

func (s *state) getPolicy() []map[string]string {
	var result []map[string]string
	policyPath := s.config.NetspocData + "/current"
	entry, err := getPolicyFromFile(policyPath)
	if err != nil {
		return nil
	}
	entry["current"] = "1"
	result = append(result, entry)
	return result
}

func getPolicyFromFile(policyPath string) (map[string]string, error) {
	policyPath += "/POLICY"
	fileInfo, err := os.Stat(policyPath)
	if err != nil {
		return nil, fmt.Errorf("can't open %s: %v", policyPath, err)
	}

	modTime := fileInfo.ModTime()
	date := modTime.Format("2006-01-02")
	time := modTime.Format("15:04")

	file, err := os.Open(policyPath)
	if err != nil {
		return nil, fmt.Errorf("can't open %s: %v", policyPath, err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	if !scanner.Scan() {
		return nil, fmt.Errorf("can't read policy name in %s", policyPath)
	}
	line := scanner.Text()

	re := regexp.MustCompile(`^# (\S+)`)
	matches := re.FindStringSubmatch(line)
	if len(matches) < 2 {
		return nil, fmt.Errorf("can't find policy name in %s", policyPath)
	}

	return map[string]string{
		"policy": matches[1],
		"date":   date,
		"time":   time,
	}, nil
}
