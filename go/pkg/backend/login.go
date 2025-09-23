package backend

// login.go - Handles user login

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"

	"golang.org/x/crypto/bcrypt"
)

func (s *state) setLogin(session *GoSession, email string) {
	session.Put("email", email)
	session.Put("loggedIn", true)
}

func (s *state) loginHandler(w http.ResponseWriter, r *http.Request) {

	session := GetGoSession(r)
	if session == nil {
		http.Error(w, "Session not found", http.StatusInternalServerError)
		return
	}
	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}
	pass := r.FormValue("pass")
	if pass == "" {
		http.Error(w, "Password is required", http.StatusBadRequest)
		return
	}

	// Verify credentials
	if err := s.VerifyCredentials(w, email, pass); err != nil {
		log.Printf("Error verifying credentials for user %s: %v", email, err)
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}
	// Set owner in session
	setOwner(r, email)
	s.setLogin(session, email)

	// Respond to the client
	w.WriteHeader(http.StatusOK)
	fmt.Fprintln(w, "Login successful")
}

func (s *state) VerifyCredentials(w http.ResponseWriter, email string, pass string) error {
	salt := "{SSHA256}"
	userFile := fmt.Sprintf("%s/%s", s.config.UserDir, email)
	store, err := GetUserStore(userFile)
	if err != nil {
		writeError(w, "Failed to get user store: "+err.Error(), http.StatusInternalServerError)
		return err
	}
	//log.Printf("Hash from user store: %v\n", store.Hash)
	//hashedPass, _ := CreateHash(salt, pass)
	//log.Printf("SHA256 sum from password with prefixed salt: %s%x\n", salt, hashedPass)
	valid, err := HashAndCompare(salt, pass, store.Hash)
	if err != nil {
		return nil // Return nil for now, so always login successfully. TODO: CHANGE!
		//return err
	}
	fmt.Println(valid, err)
	return nil
}

func CreateHash(salt, password string) (string, error) {
	h := sha256.New()

	_, err := h.Write([]byte(password))
	if err != nil {
		return "", err
	}
	hashString := hex.EncodeToString(h.Sum(nil))

	return salt + hashString, err
}

// Returns if it's the same/valid or not.
func HashAndCompare(salt, password, hashedPassword string) (bool, error) {
	hash, err := CreateHash(salt, password)
	if err != nil {
		return false, err
	}
	valid := hash == hashedPassword
	if !valid {
		return false, fmt.Errorf("password hash mismatch: %s!=%s", hash, hashedPassword)
	}
	return valid, nil
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
