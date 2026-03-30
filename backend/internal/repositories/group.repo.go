package repositories

import (
	"context"
	"database/sql"
	"errors"
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

func (r *GroupRepo) CreateEvent(ctx context.Context, userID int64, groupID int, req *models.CreateEventRequest) (*models.EventResponse, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	result, err := tx.ExecContext(ctx,
		`INSERT INTO events (group_id, creator_id, title, description, event_time) VALUES (?, ?, ?, ?, ?)`,
		groupID, userID, req.Title, req.Description, req.EventTime,
	)
	if err != nil {
		return nil, err
	}

	eventId, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	return r.GetEventByID(ctx, int64(groupID), eventId)
}

func (r *GroupRepo) GetEventByID(ctx context.Context, groupID int64, eventID int64) (*models.EventResponse, error) {
	query := `
		SELECT
			e.id,
			e.group_id,
			e.creator_id,
			u.id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			e.title,
			COALESCE(e.description, ''),
			e.event_time,
			e.created_at
		FROM events e
		JOIN users u ON u.id = e.creator_id
		WHERE e.id = ? AND e.group_id = ?
	`

	var event models.EventResponse
	err := r.db.QueryRowContext(ctx, query, eventID, groupID).Scan(
		&event.ID,
		&event.GroupID,
		&event.CreatorID,
		&event.Creator.ID,
		&event.Creator.FirstName,
		&event.Creator.LastName,
		&event.Creator.Nickname,
		&event.Creator.Avatar,
		&event.Title,
		&event.Description,
		&event.EventTime,
		&event.CreatedAt,
	)
	if err != nil {
		return nil, err
	}

	event.Responses, err = r.getEventResponses(ctx, event.ID)
	if err != nil {
		return nil, err
	}

	return &event, nil
}

func (r *GroupRepo) GetGroupEvents(ctx context.Context, groupID int64) ([]models.EventResponse, error) {
	query := `
		SELECT
			e.id,
			e.group_id,
			e.creator_id,
			u.id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			e.title,
			COALESCE(e.description, ''),
			e.event_time,
			e.created_at
		FROM events e
		JOIN users u ON u.id = e.creator_id
		WHERE e.group_id = ?
		ORDER BY e.event_time ASC
	`

	rows, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []models.EventResponse{}
	for rows.Next() {
		var event models.EventResponse
		if err := rows.Scan(
			&event.ID,
			&event.GroupID,
			&event.CreatorID,
			&event.Creator.ID,
			&event.Creator.FirstName,
			&event.Creator.LastName,
			&event.Creator.Nickname,
			&event.Creator.Avatar,
			&event.Title,
			&event.Description,
			&event.EventTime,
			&event.CreatedAt,
		); err != nil {
			return nil, err
		}

		event.Responses, err = r.getEventResponses(ctx, event.ID)
		if err != nil {
			return nil, err
		}

		events = append(events, event)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return events, nil
}

func (r *GroupRepo) getEventResponses(ctx context.Context, eventID int64) ([]models.EventUserResponse, error) {
	query := `
		SELECT
			er.user_id,
			u.id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			er.response
		FROM event_responses er
		JOIN users u ON u.id = er.user_id
		WHERE er.event_id = ?
		ORDER BY er.user_id ASC
	`

	rows, err := r.db.QueryContext(ctx, query, eventID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	responses := []models.EventUserResponse{}
	for rows.Next() {
		var response models.EventUserResponse
		if err := rows.Scan(
			&response.UserID,
			&response.User.ID,
			&response.User.FirstName,
			&response.User.LastName,
			&response.User.Nickname,
			&response.User.Avatar,
			&response.Response,
		); err != nil {
			return nil, err
		}
		responses = append(responses, response)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return responses, nil
}

func (r *GroupRepo) RespondToEvent(ctx context.Context, eventID int64, userID int64, response string) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO event_responses (event_id, user_id, response)
		VALUES (?, ?, ?)
		ON CONFLICT(event_id, user_id) DO UPDATE SET response = excluded.response
	`, eventID, userID, response)
	return err
}

func (r *GroupRepo) GetEventResponsesByEventID(ctx context.Context, eventID int64) ([]models.EventUserResponse, error) {
	return r.getEventResponses(ctx, eventID)
}

func (r *GroupRepo) GetMembersID(ctx context.Context, groupID int64) ([]int64, error) {
	query := `
	SELECT user_id from group_members WHERE group_id=?
	`

	row, err := r.db.QueryContext(ctx, query, groupID)
	if err != nil {
		return nil, err
	}
	defer row.Close()

	var memberIDs []int64
	for row.Next() {
		var id int64
		if err := row.Scan(&id); err != nil {
			return nil, err
		}

		memberIDs = append(memberIDs, id)
	}

	return memberIDs, row.Err()
}

func (r *GroupRepo) CreateInvitation(ctx context.Context, groupID, inviterID, inviteeID int64) (int64, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO group_invitations (group_id, inviter_id, invitee_id, status) VALUES (?, ?, ?, 'pending')`,
		groupID, inviterID, inviteeID,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *GroupRepo) GetInvitationsForUser(ctx context.Context, inviteeID int64) ([]models.GroupInvitation, error) {
	query := `
	SELECT * FROM group_invitations WHERE invitee_id = ? AND status = 'pending'
	`

	rows, err := r.db.QueryContext(ctx, query, inviteeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invitees []models.GroupInvitation
	for rows.Next() {
		var inv models.GroupInvitation
		if err := rows.Scan(&inv.ID, &inv.GroupID, &inv.InviterID, &inv.InviteeID, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}

		invitees = append(invitees, inv)
	}

	return invitees, rows.Err()

}

func (r *GroupRepo) AcceptInvitation(ctx context.Context, invitationID, inviteeID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query1 := `SELECT group_id FROM group_invitations WHERE id = ? AND invitee_id = ? AND status = 'pending'`

	var groupID int64
	err = tx.QueryRowContext(ctx, query1, invitationID, inviteeID).Scan(&groupID)
	if err == sql.ErrNoRows {
		return errors.New("invitation not found")
	}
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE group_invitations SET status = 'accepted' WHERE id = ?`,
		invitationID,
	)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx,
		`INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`,
		groupID, inviteeID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()

}

func (r *GroupRepo) DeclineInvitation(ctx context.Context, invitationID, inviteeID int64) error {
	result, err := r.db.ExecContext(ctx, `UPDATE group_invitations SET status = 'declined' WHERE id = ? AND invitee_id = ? AND status = 'pending'`, invitationID, inviteeID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("invitation not found")
	}
	return nil
}

var ErrJoinRequestAlreadyExists = errors.New("join request already exists")

func (r *GroupRepo) CreateJoinRequest(ctx context.Context, groupID, requesterID int64) (int64, error) {
	var existingID int64
	err := r.db.QueryRowContext(ctx,
		`SELECT id FROM group_join_requests WHERE group_id = ? AND requester_id = ? AND status = 'pending'`,
		groupID, requesterID,
	).Scan(&existingID)
	if err == nil {
		return existingID, ErrJoinRequestAlreadyExists
	}

	result, err := r.db.ExecContext(ctx,
		`INSERT INTO group_join_requests (group_id, requester_id, status) VALUES (?, ?, 'pending')`,
		groupID, requesterID,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *GroupRepo) GetJoinRequests(ctx context.Context, groupID int64) ([]models.JoinRequest, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT id, group_id, requester_id, status, created_at FROM group_join_requests WHERE group_id = ? AND status = 'pending'`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.JoinRequest
	for rows.Next() {
		var req models.JoinRequest
		if err := rows.Scan(&req.ID, &req.GroupID, &req.RequesterID, &req.Status, &req.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}

func (r *GroupRepo) AcceptJoinRequest(ctx context.Context, requestID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var groupID, requesterID int64
	err = tx.QueryRowContext(ctx,
		`SELECT group_id, requester_id FROM group_join_requests WHERE id = ? AND status = 'pending'`,
		requestID,
	).Scan(&groupID, &requesterID)
	if err == sql.ErrNoRows {
		return errors.New("join request not found")
	}
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx,
		`UPDATE group_join_requests SET status = 'accepted' WHERE id = ?`,
		requestID,
	)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx,
		`INSERT OR IGNORE INTO group_members (group_id, user_id) VALUES (?, ?)`,
		groupID, requesterID,
	)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *GroupRepo) DeclineJoinRequest(ctx context.Context, requestID int64) error {
	result, err := r.db.ExecContext(ctx,
		`UPDATE group_join_requests SET status = 'declined' WHERE id = ? AND status = 'pending'`,
		requestID,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("join request not found")
	}
	return nil
}
