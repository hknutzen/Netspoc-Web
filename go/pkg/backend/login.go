package backend

// login.go - Handles user login

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"golang.org/x/crypto/bcrypt"
)

func (s *state) loginHandler(w http.ResponseWriter, r *http.Request) {
	session := GetGoSession(r)
	if session == nil {
		http.Error(w, "Session not found", http.StatusInternalServerError)
		return
	}
	email := r.FormValue("email")
	pass := r.FormValue("pass")
	log.Printf("Session data: %v\n", session.Data)
	session.Put("email", email)
	session.Put("pass", pass)
	session.Put("loggedIn", true)
	log.Printf("Session data after PUT: %v\n", session.Data)
	log.Printf("Session id: %v\n", session.ID)

	userFile := fmt.Sprintf("%s/%s.json", s.config.UserDir, email)

	// Check if user file already exists
	if _, err := os.Stat(userFile); err == nil {
		log.Printf("Error: user %s already exists", email)
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	// Respond to the client
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Login successful")
}

var userLocks = make(map[string]*sync.Mutex)
var userLocksMutex sync.Mutex

func getUserLock(username string) *sync.Mutex {
	userLocksMutex.Lock()
	defer userLocksMutex.Unlock()

	if _, exists := userLocks[username]; !exists {
		userLocks[username] = &sync.Mutex{}
	}
	return userLocks[username]
}

func Register(userDir string, username string, password string) error {
	userLock := getUserLock(username)
	userLock.Lock()
	defer userLock.Unlock()

	userFile := fmt.Sprintf("%s/%s.json", userDir, username)

	// Check if user file already exists
	if _, err := os.Stat(userFile); err == nil {
		return fmt.Errorf("user already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	userData := map[string]string{
		"password": string(hashedPassword),
	}

	file, err := os.Create(userFile)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	if err := encoder.Encode(userData); err != nil {
		return err
	}

	return nil
}

func VerifyCredentials(userDir string, username string, password string) error {
	userLock := getUserLock(username)
	userLock.Lock()
	defer userLock.Unlock()

	userFile := fmt.Sprintf("%s/%s.json", userDir, username)

	file, err := os.Open(userFile)
	if err != nil {
		return fmt.Errorf("invalid username: %w", err)
	}
	defer file.Close()

	var userData map[string]string
	decoder := json.NewDecoder(file)
	if err := decoder.Decode(&userData); err != nil {
		return fmt.Errorf("error reading user data: %w", err)
	}

	passwordInFile := userData["password"]
	err = bcrypt.CompareHashAndPassword([]byte(passwordInFile), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password: %w", err)
	}

	return nil
}
