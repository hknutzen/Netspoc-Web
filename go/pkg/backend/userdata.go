package backend

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
)

type UserStore struct {
	Hash     string   `json:"hash"`
	SendDiff []string `json:"send_diff"`
}

type SSHAEncoder struct{}

// Encode takes a raw password phrase as []byte input and encodes it using
// the SSHAEncoder.
// It returns the encoded password as a byte slice or an error if the
// encoding fails.
func (enc SSHAEncoder) Encode(rawPassPhrase []byte) ([]byte, error) {
	hash := makeSHA256Hash(rawPassPhrase, makeSalt())
	b64 := base64.StdEncoding.EncodeToString(hash)
	return fmt.Appendf(nil, "{SSHA256}%s", b64), nil
}

func (enc SSHAEncoder) EncodeAsString(rawPassPhrase []byte) (string, error) {
	hash := makeSHA256Hash(rawPassPhrase, makeSalt())
	b64 := base64.StdEncoding.EncodeToString(hash)
	return fmt.Sprintf("{SSHA256}%s", b64), nil
}

// MatchesSHA256 matches the encoded password and the raw password
func (enc SSHAEncoder) MatchesSHA256(encodedPassPhrase, rawPassPhrase []byte) bool {
	//strip the {SSHA256} prefix
	if len(encodedPassPhrase) < 9 || string(encodedPassPhrase[:9]) != "{SSHA256}" {
		return false
	}
	//decode the base64 part
	eppS := string(encodedPassPhrase)[9:]
	hash, err := base64.StdEncoding.DecodeString(eppS)
	if err != nil {
		return false
	}
	salt := hash[len(hash)-4:]

	sha256 := sha256.New()
	sha256.Write(rawPassPhrase)
	sha256.Write(salt)
	sum := sha256.Sum(nil)

	return bytes.Equal(sum, hash[:len(hash)-4])
}

// makeSalt make a 4 byte array containing random bytes.
func makeSalt() []byte {
	sbytes := make([]byte, 4)
	rand.Read(sbytes)
	return sbytes
}

// makeSSHAHash make hasing using SHA-256 with salt.
// This is not the final output though. You need to append {SSHA}
// string with base64 of this hash.
func makeSHA256Hash(passphrase, salt []byte) []byte {
	sha256 := sha256.New()
	sha256.Write(passphrase)
	sha256.Write(salt)
	h := sha256.Sum(nil)
	return append(h, salt...)
}

// generatePassword generates a SHA256 hash of the given password
func (u *UserStore) GenerateSaltedHashFromPassword(password string) {
	hash := makeSHA256Hash([]byte(password), makeSalt())
	u.Hash = hex.EncodeToString(hash[:])
}

// CheckPassword checks if the given password matches the stored hash
func (u *UserStore) CheckPassword(password string) bool {
	encoder := SSHAEncoder{}
	rawPassword := []byte(password)
	return encoder.MatchesSHA256([]byte(u.Hash), rawPassword)
}

// readFromFile reads the UserStore data from a JSON file
func (u *UserStore) ReadFromFile(userFile string) error {
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
func (u *UserStore) WriteToFile(userFile string) error {
	data, err := json.Marshal(u)
	if err != nil {
		return err
	}

	// Ensure the directory exists
	dir := filepath.Dir(userFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(userFile, data, 0644)
}

func GetUserStore(userFile string) (*UserStore, error) {
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
		return u.ReadFromFile(userFile)
	} else if os.IsNotExist(err) {
		// File does not exist, create new UserStore
		u.SendDiff = []string{} // initialize empty slice
		u.Hash = ""             // initialize empty string
		return u.WriteToFile(userFile)
	} else {
		// Other error
		return err
	}
}
