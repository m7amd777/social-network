package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
	"time"

	"github.com/gofrs/uuid"
)

type SessionRepo struct {
	db *sql.DB
}

func NewSessionRepo(db *sql.DB) *SessionRepo {
	return &SessionRepo{db: db}
}

// CreateSession creates a new session for a user
// Returns the session with the generated token
func (r *SessionRepo) CreateSession(ctx context.Context, userID int64, duration time.Duration) (*models.Session, error) {
	// Generate UUID for session token
	sessionUUID, err := uuid.NewV4()
	if err != nil {
		return nil, err
	}

	token := sessionUUID.String()
	expiresAt := time.Now().Add(duration)

	query := `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
	_, err = r.db.ExecContext(ctx, query, token, userID, expiresAt)
	if err != nil {
		return nil, err
	}

	return &models.Session{
		ID:        token, // We use token as ID in the model
		UserID:    userID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now(),
	}, nil
}

// GetSession retrieves a session by token (only if not expired)
func (r *SessionRepo) GetSession(ctx context.Context, token string) (*models.Session, error) {
	query := `
		SELECT token, user_id, expires_at, created_at 
		FROM sessions 
		WHERE token = ? AND expires_at > datetime('now')
	`

	session := &models.Session{}
	err := r.db.QueryRowContext(ctx, query, token).Scan(
		&session.ID,
		&session.UserID,
		&session.ExpiresAt,
		&session.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	return session, nil
}

// DeleteSession removes a session by token (logout)
func (r *SessionRepo) DeleteSession(ctx context.Context, token string) error {
	query := `DELETE FROM sessions WHERE token = ?`
	_, err := r.db.ExecContext(ctx, query, token)
	return err
}

// DeleteUserSessions removes all sessions for a user
func (r *SessionRepo) DeleteUserSessions(ctx context.Context, userID int64) error {
	query := `DELETE FROM sessions WHERE user_id = ?`
	_, err := r.db.ExecContext(ctx, query, userID)
	return err
}

// CleanupExpiredSessions removes all expired sessions
func (r *SessionRepo) CleanupExpiredSessions(ctx context.Context) error {
	query := `DELETE FROM sessions WHERE expires_at <= datetime('now')`
	_, err := r.db.ExecContext(ctx, query)
	return err
}

// ExtendSession extends the expiration time of a session
func (r *SessionRepo) ExtendSession(ctx context.Context, token string, duration time.Duration) error {
	newExpiresAt := time.Now().Add(duration)
	query := `UPDATE sessions SET expires_at = ? WHERE token = ?`
	_, err := r.db.ExecContext(ctx, query, newExpiresAt, token)
	return err
}
