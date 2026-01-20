package backend

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	htmltemplate "html/template"
	"math/rand"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"strconv"
	"strings"
	texttemplate "text/template"
	"time"
)

func (s *state) register(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	email := r.FormValue("email")
	if email == "" {
		writeError(w, "Email is required", http.StatusBadRequest)
		return
	}
	if email == "guest" {
		writeError(w, "Can't set password for 'guest'", http.StatusBadRequest)
		return
	}
	email = strings.ToLower(email)
	err := s.checkEmailAuthorization(email)
	if err != nil {
		writeError(w, err.Error(), http.StatusForbidden)
		return
	}
	// Why do we need to check base URL in Perl?
	err = s.checkAttack(r)
	if err != nil {
		writeError(w, err.Error(), http.StatusTooManyRequests)
		return
	}

	password := generatePassword(10, true, true, true)
	encoder := SSHAEncoder{}
	var hashStr string
	hashStr, err = encoder.EncodeAsString([]byte(password))
	if err != nil {
		writeError(w, "Failed to encode password: "+err.Error(), http.StatusInternalServerError)
		return
	}
	tokenSalt := fmt.Sprintf("%d", time.Now().UnixNano())
	tokenHash := sha256.Sum256([]byte(tokenSalt + email))
	token := hex.EncodeToString(tokenHash[:])
	registerData := map[string]string{
		"user":  email,
		"hash":  hashStr,
		"token": token}
	session.Put("register", registerData)
	s.setAttack(r)
	ip := GetClientIP(r)
	base := r.Header.Get("Referer")
	if base == "" {
		writeError(w, "Missing Referer in header", http.StatusBadRequest)
		return
	}
	verifyUrl := fmt.Sprintf("backend6/verify?email=%s&token=%s", email, token)
	url := strings.Replace(base, "passwd.html", verifyUrl, 1)
	err = s.sendVerificationEmail(email, url, ip)
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	err = s.renderHtmlTemplate(w, "show_passwd", password)
	if err != nil {
		writeError(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *state) verify(w http.ResponseWriter, r *http.Request) {
	reqEmail := r.FormValue("email")
	reqToken := r.FormValue("token")
	session := GetGoSession(r)
	data := session.Get("register")
	if data == nil {
		writeError(w, "No registration in progress", http.StatusBadRequest)
		return
	}
	registerData := data.(map[string]any)
	email := registerData["user"].(string)
	hash := registerData["hash"].(string)
	token := registerData["token"].(string)
	if registerData != nil && email == reqEmail && token == reqToken {
		s.storePassword(w, email, hash)
		session.Delete("register")
		s.clearAttack(r)
		err := s.renderHtmlTemplate(w, "verify_ok", "")
		if err != nil {
			writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		err := s.renderHtmlTemplate(w, "verify_fail", "")
		if err != nil {
			writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}
		return
	}
}

func (s *state) renderHtmlTemplate(w http.ResponseWriter, p, data string) error {
	tmplPath := path.Join(s.config.HTMLTemplate, p)
	tmpl, err := htmltemplate.ParseFiles(tmplPath)
	if err != nil {
		return fmt.Errorf("failed to load template %s: %w", tmplPath, err)
	}
	err = tmpl.Execute(w, data)
	if err != nil {
		return fmt.Errorf("failed to render template %s: %w", tmplPath, err)
	}
	return nil
}

func (s *state) storePassword(w http.ResponseWriter, email, hash string) {
	userFile := fmt.Sprintf("%s/%s", s.config.UserDir, email)
	store, err := GetUserStore(userFile)
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return
	}
	store.Hash = hash
	err = store.WriteToFile(userFile)
	if err != nil {
		writeError(w, "Failed to save user store: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

func (s *state) sendEmail(text string) error {
	sendmail := s.config.SendmailCommand
	noreply := s.config.NoreplyAddress

	cmd := exec.Command(sendmail, "-t", "-F", "''", "-f", noreply)
	pipe, err := cmd.StdinPipe()
	if err != nil {
		return err
	}

	if err := cmd.Start(); err != nil {
		return err
	}

	_, err = pipe.Write([]byte(text))
	if err != nil {
		return err
	}

	pipe.Close()
	if err := cmd.Wait(); err != nil {
		return err
	}
	return nil
}

func (s *state) sendVerificationEmail(email, url, ip string) error {
	templatePath := fmt.Sprintf("%s/verify", s.config.MailTemplate)
	text, err := s.getTemplateContent(templatePath, map[string]string{
		"email": email,
		"url":   url,
		"ip":    ip,
	})
	if err != nil {
		return fmt.Errorf("failed to get email template: %w", err)
	}
	err = s.sendEmail(text)
	if err != nil {
		return fmt.Errorf("failed to send email to %s: %w", email, err)
	}
	return nil
}

func (s *state) getTemplateContent(templatePath string, data map[string]string) (string, error) {
	tmpl, err := texttemplate.ParseFiles(templatePath)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var builder strings.Builder
	err = tmpl.Execute(&builder, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return builder.String(), nil
}

func (s *state) checkEmailAuthorization(email string) error {
	owners := s.findAuthorizedOwners(email)
	if len(owners) == 0 {
		return fmt.Errorf("email %s is not authorized", email)
	}
	return nil
}

const (
	letterBytes  = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	specialBytes = "!@#$%^&*()_+-=[]{}\\|;':\",.<>/?`~"
	numBytes     = "0123456789"
)

func init() {
	rand.New(rand.NewSource(time.Now().UnixNano()))
}

func generatePassword(length int, useLetters bool, useSpecial bool, useNum bool) string {
	b := make([]byte, length)
	for i := range b {
		if useLetters {
			b[i] = letterBytes[rand.Intn(len(letterBytes))]
		} else if useSpecial {
			b[i] = specialBytes[rand.Intn(len(specialBytes))]
		} else if useNum {
			b[i] = numBytes[rand.Intn(len(numBytes))]
		}
	}
	return string(b)
}

func (s *state) readAttackFile(r *http.Request) string {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	dir := s.config.SessionDir
	return fmt.Sprintf("%s/attack-%s", dir, ip)
}

func (s *state) readAttackCount(r *http.Request) int {
	file := s.readAttackFile(r)
	data, err := os.ReadFile(file)
	if err != nil {
		return 0
	}
	count, err := strconv.Atoi(string(data))
	if err != nil {
		return 0
	}
	return count
}

func (s *state) storeAttackCount(r *http.Request, count int) error {
	file := s.readAttackFile(r)
	return os.WriteFile(file, []byte(strconv.Itoa(count)), 0644)
}

func (s *state) readAttackModified(r *http.Request) (time.Time, error) {
	file := s.readAttackFile(r)
	info, err := os.Stat(file)
	if err != nil {
		return time.Time{}, err
	}
	return info.ModTime(), nil
}

func (s *state) setAttack(r *http.Request) {
	count := s.readAttackCount(r)
	count++
	_ = s.storeAttackCount(r, count)
}

func (s *state) checkAttack(r *http.Request) error {
	count := s.readAttackCount(r)
	if count == 0 {
		return nil
	}
	modified, err := s.readAttackModified(r)
	if err != nil {
		return err
	}
	wait := count * 10
	if wait > 120 {
		wait = 120
	}
	remain := int(time.Until(modified.Add(time.Duration(wait) * time.Second)).Seconds())
	if remain > 0 {
		return fmt.Errorf("wait for %d seconds after wrong password", remain)
	}
	return nil
}

func (s *state) clearAttack(r *http.Request) {
	file := s.readAttackFile(r)
	_ = os.Remove(file)
}

// Standard headers list
var requestHeaders = []string{"X-Client-Ip", "X-Forwarded-For",
	"Cf-Connecting-Ip", "Fastly-Client-Ip", "True-Client-Ip",
	"X-Real-Ip", "X-Cluster-Client-Ip", "X-Forwarded",
	"Forwarded-For", "Forwarded"}

// returns IP address string; The IP address if known, defaulting to empty string.
func GetClientIP(r *http.Request) string {

	for _, header := range requestHeaders {
		switch header {
		case "X-Forwarded-For": // Load-balancers (AWS ELB) or proxies.
			if host, correctIP := getClientIPFromXForwardedFor(r.Header.Get(header)); correctIP {
				return host
			}
		default:
			if host := r.Header.Get(header); isCorrectIP(host) {
				return host
			}
		}
	}

	//  remote address checks.
	host, _, splitHostPortError := net.SplitHostPort(r.RemoteAddr)
	if splitHostPortError == nil && isCorrectIP(host) {
		return host
	}
	return ""
}

// returns first known ip address else return empty string
func getClientIPFromXForwardedFor(headers string) (string, bool) {
	if headers == "" {
		return "", false
	}
	// x-forwarded-for may return multiple IP addresses in the format:
	// "client IP, proxy 1 IP, proxy 2 IP"
	// Therefore, the right-most IP address is the IP address of the most recent proxy
	// and the left-most IP address is the IP address of the originating client.
	forwardedIps := strings.Split(headers, ",")
	for _, ip := range forwardedIps {
		// header can contain spaces too, strip those out.
		ip = strings.TrimSpace(ip)
		// make sure we only use this if it's ipv4 (ip:port)
		if splitted := strings.Split(ip, ":"); len(splitted) == 2 {
			ip = splitted[0]
		}
		if isCorrectIP(ip) {
			return ip, true
		}
	}
	return "", false
}

// return true if ip string is valid textual representation of an IP address,
// else returns false
func isCorrectIP(ip string) bool {
	return net.ParseIP(ip) != nil
}
