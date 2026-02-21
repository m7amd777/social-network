package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
)

type AuthRepo struct {
	db *sql.DB
}

func NewAuthRepo(db *sql.DB) *AuthRepo {
	return &AuthRepo{db: db}
}

// CreateUser inserts a new user into the database
func (r *AuthRepo) CreateUser(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, avatar_path, nickname, about_me, profile_visibility)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	visibility := "public"
	if user.IsPrivate {
		visibility = "private"
	}

	result, err := r.db.ExecContext(ctx, query,
		user.Email,
		user.PasswordHash,
		user.FirstName,
		user.LastName,
		user.DateOfBirth,
		user.Avatar,
		user.Nickname,
		user.AboutMe,
		visibility,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.ID = id
	return nil
}

// GetUserByEmail finds a user by email
func (r *AuthRepo) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, date_of_birth, 
		       COALESCE(avatar_path, ''), COALESCE(nickname, ''), COALESCE(about_me, ''), 
		       profile_visibility, created_at
		FROM users 
		WHERE email = ?
	`

	user := &models.User{}
	var visibility string
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Nickname,
		&user.AboutMe,
		&visibility,
		&user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	user.IsPrivate = visibility == "private"
	user.UpdatedAt = user.CreatedAt // Schema doesn't have updated_at
	return user, nil
}

// GetUserByID finds a user by ID
func (r *AuthRepo) GetUserByID(ctx context.Context, id int64) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, date_of_birth, 
		       COALESCE(avatar_path, ''), COALESCE(nickname, ''), COALESCE(about_me, ''), 
		       profile_visibility, created_at
		FROM users 
		WHERE id = ?
	`

	user := &models.User{}
	var visibility string
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.Avatar,
		&user.Nickname,
		&user.AboutMe,
		&visibility,
		&user.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	user.IsPrivate = visibility == "private"
	user.UpdatedAt = user.CreatedAt
	return user, nil
}

// EmailExists checks if an email is already registered
func (r *AuthRepo) EmailExists(ctx context.Context, email string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, email).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}

// UpdateUser updates user profile fields
func (r *AuthRepo) UpdateUser(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users 
		SET first_name = ?, last_name = ?, date_of_birth = ?, 
		    avatar_path = ?, nickname = ?, about_me = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(ctx, query,
		user.FirstName,
		user.LastName,
		user.DateOfBirth,
		user.Avatar,
		user.Nickname,
		user.AboutMe,
		user.ID,
	)
	return err
}

// UpdatePrivacy updates user privacy setting
func (r *AuthRepo) UpdatePrivacy(ctx context.Context, userID int64, isPrivate bool) error {
	visibility := "public"
	if isPrivate {
		visibility = "private"
	}
	query := `UPDATE users SET profile_visibility = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, visibility, userID)
	return err
}
