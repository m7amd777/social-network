package repositories

import (
	"context"
	"database/sql"
	"errors"
	"social-network/internal/models"
)

var ErrFollowRequestAlreadyExists = errors.New("follow request already exists")
var ErrFollowRequestNotFound = errors.New("follow request not found")

type FollowRepo struct {
	db *sql.DB
}

func NewFollowRepo(db *sql.DB) *FollowRepo {
	return &FollowRepo{db: db}
}

//checks if a user has a private profile
func (r *FollowRepo) IsPrivate(ctx context.Context, userID int64) (bool, error) {
	var visibility string
	err := r.db.QueryRowContext(ctx,
		`SELECT profile_visibility FROM users WHERE id = ?`,
		userID,
	).Scan(&visibility)
	if err != nil {
		return false, err
	}
	return visibility == "private", nil
}

//adds a follower relationship directly, used for public profiles
func (r *FollowRepo) Follow(ctx context.Context, followerID, followingID int64) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)`,
		followerID, followingID,
	)
	return err
}

//removes a follower relationship
func (r *FollowRepo) Unfollow(ctx context.Context, followerID, followingID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM followers WHERE follower_id = ? AND following_id = ?`,
		followerID, followingID,
	)
	return err
}

//checks if followerID is following followingID
func (r *FollowRepo) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)`,
		followerID, followingID,
	).Scan(&exists)
	return exists, err
}

//creates a pending follow request and returns its id
func (r *FollowRepo) CreateFollowRequest(ctx context.Context, requesterID, targetID int64) (int64, error) {
	var existingID int64
	err := r.db.QueryRowContext(ctx,
		`SELECT id FROM follow_requests WHERE requester_id = ? AND target_id = ? AND status = 'pending'`,
		requesterID, targetID,
	).Scan(&existingID)
	if err == nil {
		return existingID, ErrFollowRequestAlreadyExists
	}

	result, err := r.db.ExecContext(ctx,
		`INSERT INTO follow_requests (requester_id, target_id, status) VALUES (?, ?, 'pending')
		 ON CONFLICT(requester_id, target_id) DO UPDATE SET status = 'pending'`,
		requesterID, targetID,
	)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

//gets a follow request by id
func (r *FollowRepo) GetFollowRequest(ctx context.Context, requestID int64) (*models.FollowRequestRow, error) {
	row := &models.FollowRequestRow{}
	err := r.db.QueryRowContext(ctx,
		`SELECT id, requester_id, target_id, status FROM follow_requests WHERE id = ?`,
		requestID,
	).Scan(&row.ID, &row.RequesterID, &row.TargetID, &row.Status)
	if err == sql.ErrNoRows {
		return nil, ErrFollowRequestNotFound
	}
	return row, err
}

//accepts a follow request and adds the follower relationship in a transaction
func (r *FollowRepo) AcceptFollowRequest(ctx context.Context, requestID, targetID int64) (*models.FollowRequestRow, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var req models.FollowRequestRow
	err = tx.QueryRowContext(ctx,
		`SELECT id, requester_id, target_id, status FROM follow_requests WHERE id = ? AND target_id = ? AND status = 'pending'`,
		requestID, targetID,
	).Scan(&req.ID, &req.RequesterID, &req.TargetID, &req.Status)
	if err == sql.ErrNoRows {
		return nil, ErrFollowRequestNotFound
	}
	if err != nil {
		return nil, err
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE follow_requests SET status = 'accepted' WHERE id = ?`,
		requestID,
	)
	if err != nil {
		return nil, err
	}

	_, err = tx.ExecContext(ctx,
		`INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)`,
		req.RequesterID, req.TargetID,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	req.Status = "accepted"
	return &req, nil
}

//declines a follow request
func (r *FollowRepo) DeclineFollowRequest(ctx context.Context, requestID, targetID int64) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE follow_requests SET status = 'declined' WHERE id = ? AND target_id = ? AND status = 'pending'`,
		requestID, targetID,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrFollowRequestNotFound
	}
	return nil
}

//cancels a follow request, only the requester can do this
func (r *FollowRepo) CancelFollowRequest(ctx context.Context, requestID, requesterID int64) error {
	result, err := r.db.ExecContext(ctx,
		`DELETE FROM follow_requests WHERE id = ? AND requester_id = ? AND status = 'pending'`,
		requestID, requesterID,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return ErrFollowRequestNotFound
	}
	return nil
}

//gets all incoming pending follow requests for a user
func (r *FollowRepo) GetIncomingRequests(ctx context.Context, userID int64) ([]models.FollowRequestResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT fr.id, u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''), fr.created_at
		FROM follow_requests fr
		JOIN users u ON u.id = fr.requester_id
		WHERE fr.target_id = ? AND fr.status = 'pending'
		ORDER BY fr.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.FollowRequestResponse
	for rows.Next() {
		var req models.FollowRequestResponse
		if err := rows.Scan(&req.ID, &req.RequesterID, &req.FirstName, &req.LastName, &req.Nickname, &req.Avatar, &req.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}

//gets all pending follow requests sent by a user
func (r *FollowRepo) GetSentRequests(ctx context.Context, requesterID int64) ([]models.FollowRequestResponse, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT fr.id, u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''), fr.created_at
		FROM follow_requests fr
		JOIN users u ON u.id = fr.target_id
		WHERE fr.requester_id = ? AND fr.status = 'pending'
		ORDER BY fr.created_at DESC
	`, requesterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.FollowRequestResponse
	for rows.Next() {
		var req models.FollowRequestResponse
		if err := rows.Scan(&req.ID, &req.RequesterID, &req.FirstName, &req.LastName, &req.Nickname, &req.Avatar, &req.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}
