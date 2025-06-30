package backend

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

type GoSession struct {
	CreatedAt      time.Time      `json:"created_at"`
	LastActivityAt time.Time      `json:"last_activity_at"`
	ID             string         `json:"id"`
	Data           map[string]any `json:"data"`
}

type SessionStore interface {
	read(id string) (*GoSession, error)
	write(session *GoSession) error
	destroy(id string) error
	gc(idleExpiration, absoluteExpiration time.Duration) error
}

type SessionManager struct {
	store              SessionStore
	idleExpiration     time.Duration
	absoluteExpiration time.Duration
	cookieName         string
}

func (m *SessionManager) Handle(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Start the session
		session, rws := m.start(r)

		// Create a new response writer
		sw := &sessionResponseWriter{
			ResponseWriter: w,
			sessionManager: m,
			request:        rws,
		}

		// Add essential headers
		w.Header().Add("Vary", "Cookie")
		w.Header().Add("Cache-Control", `no-cache="Set-Cookie"`)

		// Call the next handler and pass the new response writer and new request
		next.ServeHTTP(sw, rws)

		// Save the session
		m.save(session)

		// Write the session cookie to the response if not already written
		writeCookieIfNecessary(sw)
	})
}

type sessionResponseWriter struct {
	http.ResponseWriter
	sessionManager *SessionManager
	request        *http.Request
	done           bool
}

func (w *sessionResponseWriter) Write(b []byte) (int, error) {
	writeCookieIfNecessary(w)
	return w.ResponseWriter.Write(b)
}

func (w *sessionResponseWriter) WriteHeader(code int) {
	writeCookieIfNecessary(w)
	w.ResponseWriter.WriteHeader(code)
}

func (w *sessionResponseWriter) Unwrap() http.ResponseWriter {
	return w.ResponseWriter
}

func writeCookieIfNecessary(w *sessionResponseWriter) {
	if w.done {
		return
	}

	session, ok := w.request.Context().Value(sessionContextKey{}).(*GoSession)
	if !ok {
		panic("session not found in request context")
	}

	cookie := &http.Cookie{
		Name:  w.sessionManager.cookieName,
		Value: session.ID,
		//Domain:   "localhost",
		HttpOnly: true,
		Path:     "/",
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(w.sessionManager.idleExpiration),
		MaxAge:   int(w.sessionManager.idleExpiration / time.Second),
	}

	http.SetCookie(w.ResponseWriter, cookie)

	w.done = true
}

func GetGoSession(r *http.Request) *GoSession {
	session, ok := r.Context().Value(sessionContextKey{}).(*GoSession)
	if !ok {
		panic("session not found in request context")
	}

	return session
}

func generateSessionId() string {
	id := make([]byte, 32)

	_, err := io.ReadFull(rand.Reader, id)
	if err != nil {
		panic("failed to generate session id")
	}

	return base64.RawURLEncoding.EncodeToString(id)
}

func newSession() *GoSession {
	return &GoSession{
		ID:             generateSessionId(),
		Data:           make(map[string]any),
		CreatedAt:      time.Now(),
		LastActivityAt: time.Now(),
	}
}

func (s *GoSession) Get(key string) any {
	return s.Data[key]
}

func (s *GoSession) Put(key string, value any) {
	s.Data[key] = value
}

func (s *GoSession) Delete(key string) {
	delete(s.Data, key)
}

func NewSessionManager(
	store SessionStore,
	gcInterval,
	idleExpiration,
	absoluteExpiration time.Duration,
	cookieName string) *SessionManager {

	m := &SessionManager{
		store:              store,
		idleExpiration:     idleExpiration,
		absoluteExpiration: absoluteExpiration,
		cookieName:         cookieName,
	}

	go m.gc(gcInterval)

	return m
}

func (m *SessionManager) gc(d time.Duration) {
	ticker := time.NewTicker(d)

	for range ticker.C {
		m.store.gc(m.idleExpiration, m.absoluteExpiration)
	}
}

func (m *SessionManager) validate(session *GoSession) bool {
	if time.Since(session.CreatedAt) > m.absoluteExpiration ||
		time.Since(session.LastActivityAt) > m.idleExpiration {

		// Delete the session from the store
		err := m.store.destroy(session.ID)
		if err != nil {
			panic(err)
		}

		return false
	}

	return true
}

type sessionContextKey struct{}

// Retrieves the session by reading the session cookie or generates a new
// one if needed. It then attaches the session to the request using context values.
func (m *SessionManager) start(r *http.Request) (*GoSession, *http.Request) {
	var session *GoSession

	// Read From Cookie
	cookie, err := r.Cookie(m.cookieName)
	if err == nil {
		session, err = m.store.read(cookie.Value)
		if err != nil {
			log.Printf("Failed to read session from store: %v", err)
		}
	}

	// Generate a new session
	if session == nil || !m.validate(session) {
		session = newSession()
	}

	// Attach session to context
	ctx := context.WithValue(r.Context(), sessionContextKey{}, session)
	r = r.WithContext(ctx)

	return session, r
}

func (m *SessionManager) save(session *GoSession) error {
	session.LastActivityAt = time.Now()

	err := m.store.write(session)
	if err != nil {
		return err
	}

	return nil
}

// ****************************************************************************
//
// # Implementing a File System Session Store
//
// ****************************************************************************
type FileSystemSessionStore struct {
	mu  sync.RWMutex
	dir string
}

func NewFileSystemSessionStore(dir string) *FileSystemSessionStore {
	return &FileSystemSessionStore{
		dir: dir,
	}
}

func (s *FileSystemSessionStore) read(id string) (*GoSession, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	filePath := s.filePath(id)
	data, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var session GoSession
	err = json.Unmarshal(data, &session)
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (s *FileSystemSessionStore) write(session *GoSession) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := s.filePath(session.ID)
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	err = os.WriteFile(filePath, data, 0644)
	if err != nil {
		return err
	}

	return nil
}

func (s *FileSystemSessionStore) destroy(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := s.filePath(id)
	err := os.Remove(filePath)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	return nil
}

func (s *FileSystemSessionStore) gc(idleExpiration, absoluteExpiration time.Duration) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	files, err := os.ReadDir(s.dir)
	if err != nil {
		return err
	}

	for _, file := range files {
		filePath := s.dir + "/" + file.Name()
		data, err := os.ReadFile(filePath)
		if err != nil {
			continue
		}

		var session GoSession
		err = json.Unmarshal(data, &session)
		if err != nil {
			continue
		}

		if time.Since(session.LastActivityAt) > idleExpiration ||
			time.Since(session.CreatedAt) > absoluteExpiration {
			os.Remove(filePath)
		}
	}

	return nil
}

func (s *FileSystemSessionStore) filePath(id string) string {
	return s.dir + "/" + id + ".json"
}
