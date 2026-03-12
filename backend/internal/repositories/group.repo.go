package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"social-network/internal/models"
)

type GroupRepo struct {
	db *sql.DB
}

func NewGroupRepo(db *sql.DB) *GroupRepo {
	return &GroupRepo{db}
}

// func (r *GroupRepo) Create(ctx context.Context, creatorID int64, req *models.CreateGroupRequest) (models.GroupData, error) {
// 	tx, err := r.db.BeginTx(ctx, nil)
// 	if err != nil {
// 		return models.GroupData{}, err
// 	}
// 	defer tx.Rollback()

// 	result, err := tx.ExecContext(ctx,
// 		`INSERT INTO groups (creator_id, title, description) VALUES (?, ?, ?)`,
// 		creatorID, req.Title, req.Description,
// 	)
// 	if err != nil {
// 		return models.GroupData{}, err
// 	}

// 	groupID, err := result.LastInsertId()
// 	if err != nil {
// 		return models.GroupData{}, err
// 	}

// 	_, err = tx.ExecContext(ctx,
// 		`INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`,
// 		groupID, creatorID,
// 	)
// 	if err != nil {
// 		return models.GroupData{}, err
// 	}

// 	if err := tx.Commit(); err != nil {
// 		return models.GroupData{}, err
// 	}

// 	return r.GetGroupDetails(ctx, int(groupID))
// }

func (r *GroupRepo) GetGroupDetails(ctx context.Context, id int) (models.GroupData, error) {

	var g models.GroupData

	err := r.db.QueryRowContext(ctx, `
		SELECT g.id, g.creator_id, g.title, g.description, g.created_at,
			COUNT(gm.user_id) AS member_count
		FROM groups g
		LEFT JOIN group_members gm on gm.group_id = g.id
		WHERE g.id = ?
		GROUP BY g.id, g.creator_id, g.title, g.description, g.created_at
	`, id).Scan(&g.Id, &g.CreatedBy, &g.Title, &g.Description, &g.CreatedAt, &g.MemberCount)

	if err != nil {
		fmt.Println("the query has failed", err)
		return models.GroupData{}, err
	}

	return g, nil
}

// this is for fetching the feed for the group posts
func (r *GroupRepo) GetGroupPosts(ctx context.Context, id int) ([]models.PostResponse, error) {

	rows, err := r.db.QueryContext(ctx, `
		SELECT p.id, p.content, COALESCE(p.image_path, ''), p.privacy, p.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.group_id = ?
		ORDER BY p.created_at DESC
		LIMIT 50
	`, id)
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
			&p.CommentCount,
		); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()

}

func (r *GroupRepo) IsGroupMember(ctx context.Context, groupID int, userID int64) (bool, error) {
	var isMember bool
	err := r.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM group_members
			WHERE group_id = ? AND user_id = ?
		)
	`, groupID, userID).Scan(&isMember)
	if err != nil {
		return false, err
	}

	return isMember, nil
}

func (r *GroupRepo) CreateGroupPost(ctx context.Context, groupID int, userID int64, req *models.CreateGroupPostRequest) (models.PostResponse, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO posts (user_id, group_id, content, image_path, privacy) VALUES (?, ?, ?, ?, 'public')`,
		userID, groupID, req.Content, req.Image,
	)
	if err != nil {
		return models.PostResponse{}, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return models.PostResponse{}, err
	}

	return r.GetGroupPostByID(ctx, groupID, postID)
}

func (r *GroupRepo) GetGroupPostByID(ctx context.Context, groupID int, postID int64) (models.PostResponse, error) {
	var p models.PostResponse
	err := r.db.QueryRowContext(ctx, `
		SELECT p.id, p.content, COALESCE(p.image_path, ''), p.privacy, p.created_at,
		       u.id, u.first_name, u.last_name, COALESCE(u.nickname, ''), COALESCE(u.avatar_path, ''),
		       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id)
		FROM posts p
		JOIN users u ON p.user_id = u.id
		WHERE p.id = ? AND p.group_id = ?
	`, postID, groupID).Scan(
		&p.PostID, &p.Content, &p.Image, &p.Privacy, &p.CreatedAt,
		&p.Author.ID, &p.Author.FirstName, &p.Author.LastName, &p.Author.Nickname, &p.Author.Avatar,
		&p.CommentCount,
	)
	if err != nil {
		return models.PostResponse{}, err
	}

	return p, nil
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
