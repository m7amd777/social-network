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

func (r *GroupRepo) Create(ctx context.Context, creatorID int64, req *models.CreateGroupRequest) (models.GroupData, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return models.GroupData{}, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		`INSERT INTO groups (creator_id, title, description) VALUES (?, ?, ?)`,
		creatorID, req.Title, req.Description,
	)
	if err != nil {
		return models.GroupData{}, err
	}

	groupID, err := result.LastInsertId()
	if err != nil {
		return models.GroupData{}, err
	}

	_, err = tx.ExecContext(ctx,
		`INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`,
		groupID, creatorID,
	)
	if err != nil {
		return models.GroupData{}, err
	}

	if err := tx.Commit(); err != nil {
		return models.GroupData{}, err
	}

	return r.GetGroupDetails(ctx, int(groupID))
}

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

type GroupData struct {
	Id          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedBy   string `json:"createdBy"`
	CreatedAt   string `json:"createdAt"`
	MemberCount string `json:"memberCount"`
}
