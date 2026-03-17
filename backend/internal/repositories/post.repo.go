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

// Create inserts a new post and its custom viewers if privacy is "custom"
func (r *PostRepo) Create(ctx context.Context, userID int64, req *models.CreatePostRequest) (models.PostResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.PostResponse{}, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		`INSERT INTO posts (user_id, content, image_path, privacy) VALUES (?, ?, ?, ?)`,
		userID, req.Content, req.Image, req.Privacy,
	)
	if err != nil {
		return models.PostResponse{}, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return models.PostResponse{}, err
	}

	if req.Privacy == "custom" && len(req.Viewers) > 0 {
		for _, viewerID := range req.Viewers {
			_, err := tx.ExecContext(ctx,
				`INSERT OR IGNORE INTO post_viewers (post_id, user_id) VALUES (?, ?)`,
				postID, viewerID,
			)
			if err != nil {
				return models.PostResponse{}, err
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return models.PostResponse{}, err
	}

	return r.GetByID(ctx, postID)
}

// GetByID fetches a single post with its author, comment count, and like count
func (r *PostRepo) GetByID(ctx context.Context, postID int64) (models.PostResponse, error) {
	return r.GetByIDForViewer(ctx, postID, 0)
}

func (r *PostRepo) GetByIDForViewer(ctx context.Context, postID, viewerID int64) (models.PostResponse, error) {
	var p models.PostResponse
	err := r.db.QueryRowContext(ctx, `
		SELECT p.id, p.content, COALESCE(p.image_path, ''), p.privacy, p.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = ?
	`, viewerID, postID).Scan(
		&p.PostID, &p.Content, &p.Image, &p.Privacy, &p.CreatedAt,
		&p.Author.ID, &p.Author.FirstName, &p.Author.LastName, &p.Author.Nickname, &p.Author.Avatar,
		&p.CommentCount, &p.LikeCount, &p.IsLikedByViewer,
	)
	if err != nil {
		return models.PostResponse{}, err
	}
	return p, nil
}

// GetFeed returns posts visible to viewerID, newest first
func (r *PostRepo) GetFeed(ctx context.Context, viewerID int64) ([]models.PostResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.id, p.content, COALESCE(p.image_path, ''), p.privacy, p.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.group_id IS NULL AND (
		    p.user_id = ?
		    OR p.privacy = 'public'
		    OR (p.privacy = 'followers' AND EXISTS (
		        SELECT 1 FROM followers f WHERE f.follower_id = ? AND f.following_id = p.user_id
		    ))
		    OR (p.privacy = 'custom' AND EXISTS (
		        SELECT 1 FROM post_viewers pv WHERE pv.post_id = p.id AND pv.user_id = ?
		    ))
		)
		ORDER BY p.created_at DESC
		LIMIT 50
	`, viewerID, viewerID, viewerID, viewerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var p models.PostResponse
		if err := rows.Scan(
			&p.PostID, &p.Content, &p.Image, &p.Privacy, &p.CreatedAt,
			&p.Author.ID, &p.Author.FirstName, &p.Author.LastName, &p.Author.Nickname, &p.Author.Avatar,
			&p.CommentCount, &p.LikeCount, &p.IsLikedByViewer,
		); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

// GetByUserID returns posts by ownerID that are visible to viewerID
func (r *PostRepo) GetByUserID(ctx context.Context, viewerID, ownerID int64) ([]models.PostResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT p.id, p.content, COALESCE(p.image_path, ''), p.privacy, p.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id),
		       (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id AND pl.user_id = ?)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.user_id = ? AND p.group_id IS NULL AND (
		    p.user_id = ?
		    OR p.privacy = 'public'
		    OR (p.privacy = 'followers' AND EXISTS (
		        SELECT 1 FROM followers f WHERE f.follower_id = ? AND f.following_id = p.user_id
		    ))
		    OR (p.privacy = 'custom' AND EXISTS (
		        SELECT 1 FROM post_viewers pv WHERE pv.post_id = p.id AND pv.user_id = ?
		    ))
		)
		ORDER BY p.created_at DESC
	`, viewerID, ownerID, viewerID, viewerID, viewerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.PostResponse
	for rows.Next() {
		var p models.PostResponse
		if err := rows.Scan(
			&p.PostID, &p.Content, &p.Image, &p.Privacy, &p.CreatedAt,
			&p.Author.ID, &p.Author.FirstName, &p.Author.LastName, &p.Author.Nickname, &p.Author.Avatar,
			&p.CommentCount, &p.LikeCount, &p.IsLikedByViewer,
		); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

// CreateComment inserts a new comment and returns it with author info
func (r *PostRepo) CreateComment(ctx context.Context, postID, userID int64, req *models.CreateCommentRequest) (models.CommentResponse, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO comments (post_id, user_id, content, image_path) VALUES (?, ?, ?, ?)`,
		postID, userID, req.Content, req.Image,
	)
	if err != nil {
		return models.CommentResponse{}, err
	}

	commentID, err := result.LastInsertId()
	if err != nil {
		return models.CommentResponse{}, err
	}

	var c models.CommentResponse
	err = r.db.QueryRowContext(ctx, `
		SELECT c.id, c.post_id, c.content, COALESCE(c.image_path, ''), c.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, '')
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.id = ?
	`, commentID).Scan(
		&c.CommentID, &c.PostID, &c.Content, &c.Image, &c.CreatedAt,
		&c.Author.ID, &c.Author.FirstName, &c.Author.LastName, &c.Author.Nickname, &c.Author.Avatar,
	)
	return c, err
}

// LikePost adds a like from userID on postID (idempotent)
func (r *PostRepo) LikePost(ctx context.Context, postID, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`,
		postID, userID,
	)
	return err
}

// UnlikePost removes a like from userID on postID (idempotent)
func (r *PostRepo) UnlikePost(ctx context.Context, postID, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`,
		postID, userID,
	)
	return err
}

// GetLikeCount returns the like count and whether the viewer has liked the post
func (r *PostRepo) GetLikeCount(ctx context.Context, postID, viewerID int64) (count int, liked bool, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*) FROM post_likes WHERE post_id = ?),
			(SELECT COUNT(*) FROM post_likes WHERE post_id = ? AND user_id = ?)
	`, postID, postID, viewerID).Scan(&count, &liked)
	return
}

// GetComments returns all comments for a post, oldest first
func (r *PostRepo) GetComments(ctx context.Context, postID int64) ([]models.CommentResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.id, c.post_id, c.content, COALESCE(c.image_path, ''), c.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, '')
		FROM comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.CommentResponse
	for rows.Next() {
		var c models.CommentResponse
		if err := rows.Scan(
			&c.CommentID, &c.PostID, &c.Content, &c.Image, &c.CreatedAt,
			&c.Author.ID, &c.Author.FirstName, &c.Author.LastName, &c.Author.Nickname, &c.Author.Avatar,
		); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

// GetPostOwnerAndImage returns the post owner ID and image path for authorization and cleanup
func (r *PostRepo) GetPostOwnerAndImage(ctx context.Context, postID int64) (ownerID int64, imagePath string, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT user_id, COALESCE(image_path, '') FROM posts WHERE id = ?
	`, postID).Scan(&ownerID, &imagePath)
	return
}

// GetCommentImagesForPost returns all image paths for comments on a post (for cleanup)
func (r *PostRepo) GetCommentImagesForPost(ctx context.Context, postID int64) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT COALESCE(image_path, '') FROM comments WHERE post_id = ? AND image_path IS NOT NULL AND image_path != ''
	`, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []string
	for rows.Next() {
		var img string
		if err := rows.Scan(&img); err != nil {
			return nil, err
		}
		if img != "" {
			images = append(images, img)
		}
	}
	return images, rows.Err()
}

// DeletePost removes a post and its associated data (comments, likes, viewers)
func (r *PostRepo) DeletePost(ctx context.Context, postID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete associated data first (foreign key constraints)
	if _, err := tx.ExecContext(ctx, `DELETE FROM comments WHERE post_id = ?`, postID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM post_likes WHERE post_id = ?`, postID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM post_viewers WHERE post_id = ?`, postID); err != nil {
		return err
	}

	// Delete the post
	result, err := tx.ExecContext(ctx, `DELETE FROM posts WHERE id = ?`, postID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return tx.Commit()
}

// GetCommentOwnerAndImage returns the comment owner ID and image path for authorization and cleanup
func (r *PostRepo) GetCommentOwnerAndImage(ctx context.Context, commentID int64) (ownerID int64, imagePath string, err error) {
	err = r.db.QueryRowContext(ctx, `
		SELECT user_id, COALESCE(image_path, '') FROM comments WHERE id = ?
	`, commentID).Scan(&ownerID, &imagePath)
	return
}

// DeleteComment removes a comment
func (r *PostRepo) DeleteComment(ctx context.Context, commentID int64) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM comments WHERE id = ?`, commentID)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}
