package repositories

import (
	"context"
	"database/sql"
)

type FollowRepo struct {
	db *sql.DB
}

func NewFollowRepo(db *sql.DB) *FollowRepo {
	return &FollowRepo{db: db}
}

func (r *FollowRepo) Follow(ctx context.Context, followerID, followingID int64) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT OR IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)`,
		followerID, followingID,
	)
	return err
}

func (r *FollowRepo) Unfollow(ctx context.Context, followerID, followingID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM followers WHERE follower_id = ? AND following_id = ?`,
		followerID, followingID,
	)
	return err
}

func (r *FollowRepo) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)`,
		followerID, followingID,
	).Scan(&exists)
	return exists, err
}
