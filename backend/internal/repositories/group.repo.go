package repositories

import (
	"context"
	"database/sql"

	"social-network/internal/models"
)

type GroupRepo struct {
	db *sql.DB
}

func NewGroupRepo(db *sql.DB) *GroupRepo {
	return &GroupRepo{db: db}
}

func (r *GroupRepo) ListGroups(ctx context.Context, userID int64) ([]models.GroupResponse, error) {
	query := `
		SELECT
			g.id, g.creator_id, g.title, COALESCE(g.description, ''), COALESCE(g.image_path, ''), g.created_at,
			u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
			(SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
			EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?) AS is_member
		FROM groups g
		JOIN users u ON u.id = g.creator_id
		ORDER BY g.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []models.GroupResponse
	for rows.Next() {
		var g models.GroupResponse
		if err := rows.Scan(
			&g.ID, &g.CreatorID, &g.Title, &g.Description, &g.Image, &g.CreatedAt,
			&g.Creator.ID, &g.Creator.FirstName, &g.Creator.LastName, &g.Creator.Nickname, &g.Creator.Avatar,
			&g.MemberCount, &g.IsMember,
		); err != nil {
			return nil, err
		}
		g.IsOwner = g.CreatorID == userID
		groups = append(groups, g)
	}
	return groups, rows.Err()
}

func (r *GroupRepo) CreateGroup(ctx context.Context, creatorID int64, title, description, image string) (*models.GroupResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		`INSERT INTO groups (creator_id, title, description, image_path) VALUES (?, ?, ?, ?)`,
		creatorID, title, description, image,
	)
	if err != nil {
		return nil, err
	}

	groupID, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	_, err = tx.ExecContext(ctx,
		`INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
		groupID, creatorID,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.GetGroupByID(ctx, groupID, creatorID)
}

func (r *GroupRepo) GetGroupByID(ctx context.Context, groupID, userID int64) (*models.GroupResponse, error) {
	query := `
		SELECT
			g.id, g.creator_id, g.title, COALESCE(g.description, ''), COALESCE(g.image_path, ''), g.created_at,
			u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
			(SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
			EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?) AS is_member
		FROM groups g
		JOIN users u ON u.id = g.creator_id
		WHERE g.id = ?
	`

	var g models.GroupResponse
	err := r.db.QueryRowContext(ctx, query, userID, groupID).Scan(
		&g.ID, &g.CreatorID, &g.Title, &g.Description, &g.Image, &g.CreatedAt,
		&g.Creator.ID, &g.Creator.FirstName, &g.Creator.LastName, &g.Creator.Nickname, &g.Creator.Avatar,
		&g.MemberCount, &g.IsMember,
	)
	if err != nil {
		return nil, err
	}
	g.IsOwner = g.CreatorID == userID
	return &g, nil
}

func (r *GroupRepo) JoinGroup(ctx context.Context, groupID, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO group_members (group_id, user_id) VALUES (?, ?)`,
		groupID, userID,
	)
	return err
}

func (r *GroupRepo) IsMember(ctx context.Context, groupID, userID int64) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?)`,
		groupID, userID,
	).Scan(&exists)
	return exists, err
}

func (r *GroupRepo) GroupExists(ctx context.Context, groupID int64) (bool, error) {
	var exists bool
	err := r.db.QueryRowContext(ctx,
		`SELECT EXISTS(SELECT 1 FROM groups WHERE id = ?)`,
		groupID,
	).Scan(&exists)
	return exists, err
}
