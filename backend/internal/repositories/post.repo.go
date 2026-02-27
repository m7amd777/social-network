package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
)

type PostRepo struct {
	db *sql.DB
}

func NewPostRepo(db *sql.DB) *PostRepo {
	return &PostRepo{db}
}

func (r *PostRepo) Create(ctx context.Context, post models.Post) (models.Post, error) {
	// SQL logic
	return post, nil
}

// GetByUserID fetches all posts by a user, newest first
func (r *PostRepo) GetByUserID(ctx context.Context, userID int64) ([]models.Post, error) {
	query := `
		SELECT id, user_id, COALESCE(content, ''), COALESCE(image_path, ''), privacy, created_at
		FROM posts
		WHERE user_id = ?
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		var p models.Post
		if err := rows.Scan(
			&p.PostID,
			&p.UserID,
			&p.Content,
			&p.ImagePath,
			&p.Privacy,
			&p.CreatedAt,
		); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}
