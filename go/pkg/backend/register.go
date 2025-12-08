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
	s.checkEmailAuthorization(w, r, email)
	// Why do we need to check base URL in Perl?
	s.checkAttack(w, r)

	password := generatePassword(10, true, true, true)
	hash := sha256.Sum256([]byte(password))
	hashStr := hex.EncodeToString(hash[:])
	tokenSalt := fmt.Sprintf("%d", time.Now().UnixNano())
	tokenHash := sha256.Sum256([]byte(tokenSalt + email))
	token := hex.EncodeToString(tokenHash[:])
	registerData := map[string]string{
		"user":  email,
		"hash":  hashStr,
		"token": token}
	session.Put("register", registerData)
	s.setAttack(r)
	ip := r.RemoteAddr
	base := r.Host
	if r.TLS == nil {
		base = "http://" + base
	} else {
		base = "https://" + base
	}
	url := fmt.Sprintf("%s/verify?email=%s&token=%s", base, email, token)
	s.sendVerificationEmail(w, email, url, ip)
	tmpl, err := htmltemplate.ParseFiles(path.Join(s.config.HTMLTemplate, "show_password"))
	if err != nil {
		writeError(w, "Failed to load template", http.StatusInternalServerError)
		return
	}
	err = tmpl.Execute(w, password)
	if err != nil {
		writeError(w, "Failed to render template", http.StatusInternalServerError)
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
	registerData := data.(map[string]string)
	email := registerData["user"]
	hash := registerData["hash"]
	token := registerData["token"]
	if registerData != nil && email == reqEmail && token == reqToken {
		s.storePassword(w, email, hash)
		session.Delete("register")
		s.clearAttack(r)
	} else {
		writeError(w, "Invalid registration data", http.StatusBadRequest)
		return
	}
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

func (s *state) sendVerificationEmail(w http.ResponseWriter, email, url, ip string) {
	templatePath := fmt.Sprintf("%s/verify", s.config.MailTemplate)
	text, err := s.getTemplateContent(templatePath, map[string]string{
		"email": email,
		"url":   url,
		"ip":    ip,
	})
	if err != nil {
		writeError(w, "Failed to get email template: "+err.Error(), http.StatusInternalServerError)
		return
	}
	err = s.sendEmail(text)
	if err != nil {
		writeError(w, "Failed to send email: "+err.Error(), http.StatusInternalServerError)
		return
	}
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

func (s *state) checkEmailAuthorization(w http.ResponseWriter, r *http.Request, email string) {
	owners := s.findAuthorizedOwners(r)
	if len(owners) == 0 {
		writeError(w, "Email "+email+" is not authorized", http.StatusForbidden)
		return
	}
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

func (s *state) checkAttack(w http.ResponseWriter, r *http.Request) {
	count := s.readAttackCount(r)
	if count == 0 {
		return
	}
	modified, err := s.readAttackModified(r)
	if err != nil {
		return
	}
	wait := count * 10
	if wait > 120 {
		wait = 120
	}
	remain := int(time.Until(modified.Add(time.Duration(wait) * time.Second)).Seconds())
	if remain > 0 {
		http.Error(w, fmt.Sprintf("Wait for %d seconds after wrong password", remain), http.StatusTooManyRequests)
	}
}

func (s *state) clearAttack(r *http.Request) {
	file := s.readAttackFile(r)
	_ = os.Remove(file)
}
