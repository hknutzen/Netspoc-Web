package backend

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"os"
)

type UserStore struct {
	Hash     string   `json:"hash"`
	SendDiff []string `json:"send_diff"`
}

// generatePassword generates a SHA256 hash of the given password
func (u *UserStore) generatePassword(password string) {
	hash := sha256.Sum256([]byte(password))
	u.Hash = hex.EncodeToString(hash[:])
}

// checkPassword checks if the given password matches the stored hash
func (u *UserStore) checkPassword(password string) bool {
	hash := sha256.Sum256([]byte(password))
	return u.Hash == hex.EncodeToString(hash[:])
}

// readFromFile reads the UserStore data from a JSON file
func (u *UserStore) readFromFile(userFile string) error {
	file, err := os.Open(userFile)
	if err != nil {
		return err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, u)
}

// writeToFile writes the UserStore data to a JSON file
func (u *UserStore) writeToFile(userFile string) error {
	data, err := json.Marshal(u)
	if err != nil {
		return err
	}

	return os.WriteFile(userFile, data, 0644)
}

func getUserStore(userFile string) (*UserStore, error) {
	userStore := &UserStore{}
	if err := userStore.ensureUserFile(userFile); err != nil {
		return nil, err
	}
	return userStore, nil
}

// ensureUserFile checks if the userFile exists. If it does, reads its content into UserStore.
// If not, creates a new UserStore with a new password hash and writes it to userFile.
func (u *UserStore) ensureUserFile(userFile string) error {
	if _, err := os.Stat(userFile); err == nil {
		// File exists, read content
		return u.readFromFile(userFile)
	} else if os.IsNotExist(err) {
		// File does not exist, create new UserStore
		u.SendDiff = []string{} // initialize empty slice
		u.Hash = ""             // initialize empty string
		return u.writeToFile(userFile)
	} else {
		// Other error
		return err
	}
}
