package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
)

type ChatRepo struct {
	db *sql.DB
}

func NewChatRepo(db *sql.DB) *ChatRepo {
	return &ChatRepo{db: db}
}

// ListConversations returns all users the given user has exchanged at least one message with,
// ordered by the most recent message. Each entry includes the last message preview and unread count.
func (r *ChatRepo) ListConversations(ctx context.Context, userID int64) ([]models.ConversationPreview, error) {
	query := `
		WITH last_msgs AS (
			SELECT
				CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_user_id,
				MAX(id) AS last_msg_id
			FROM private_messages
			WHERE sender_id = ? OR receiver_id = ?
			GROUP BY other_user_id
		)
		SELECT
			u.id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			pm.content,
			pm.sender_id,
			pm.created_at,
			(SELECT COUNT(*) FROM private_messages
			 WHERE sender_id = u.id AND receiver_id = ? AND read_at IS NULL) AS unread_count
		FROM last_msgs lm
		JOIN users u ON u.id = lm.other_user_id
		JOIN private_messages pm ON pm.id = lm.last_msg_id
		ORDER BY pm.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convos []models.ConversationPreview
	for rows.Next() {
		var c models.ConversationPreview
		if err := rows.Scan(
			&c.UserID,
			&c.FirstName,
			&c.LastName,
			&c.Nickname,
			&c.Avatar,
			&c.LastMessage,
			&c.LastSenderID,
			&c.LastMessageAt,
			&c.UnreadCount,
		); err != nil {
			return nil, err
		}
		convos = append(convos, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if convos == nil {
		convos = []models.ConversationPreview{}
	}

	return convos, nil
}

// GetMessages returns all messages between two users, oldest first.
func (r *ChatRepo) GetMessages(ctx context.Context, userID, otherUserID int64) ([]models.Message, error) {
	query := `
		SELECT id, sender_id, receiver_id, content, created_at
		FROM private_messages
		WHERE (sender_id = ? AND receiver_id = ?)
		   OR (sender_id = ? AND receiver_id = ?)
		ORDER BY created_at ASC, id ASC
	`

	rows, err := r.db.QueryContext(ctx, query, userID, otherUserID, otherUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ID, &m.SenderID, &m.ReceiverID, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if messages == nil {
		messages = []models.Message{}
	}

	return messages, nil
}

func (r *ChatRepo) SendMessage(ctx context.Context, senderID, receiverID int64, content string) (*models.Message, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO private_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)`,
		senderID, receiverID, content,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	var msg models.Message
	err = r.db.QueryRowContext(ctx,
		`SELECT id, sender_id, receiver_id, content, created_at
         FROM private_messages WHERE id = ?`, id,
	).Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &msg.CreatedAt)

	return &msg, err
}

func (r *ChatRepo) MarkAsRead(ctx context.Context, receiverID, senderID int64) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE private_messages SET read_at = CURRENT_TIMESTAMP
         WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL`,
		senderID, receiverID,
	)
	return err
}

// ListGroupConversations returns groups the user is a member of that have at least one message,
// ordered by the most recent message timestamp.
func (r *ChatRepo) ListGroupConversations(ctx context.Context, userID int64) ([]models.GroupConversationPreview, error) {
	query := `
		WITH member_groups AS (
			SELECT group_id
			FROM group_members
			WHERE user_id = ?
		),
		last_group_msgs AS (
			SELECT gm.group_id, MAX(gm.id) AS last_msg_id
			FROM group_messages gm
			JOIN member_groups mg ON mg.group_id = gm.group_id
			GROUP BY gm.group_id
		)
		SELECT
			g.id,
			g.title,
			COALESCE(g.image_path, ''),
			m.content,
			m.sender_id,
			m.created_at
		FROM last_group_msgs lg
		JOIN groups g ON g.id = lg.group_id
		JOIN group_messages m ON m.id = lg.last_msg_id
		ORDER BY m.created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var convos []models.GroupConversationPreview
	for rows.Next() {
		var c models.GroupConversationPreview
		if err := rows.Scan(
			&c.GroupID,
			&c.Title,
			&c.Image,
			&c.LastMessage,
			&c.LastSenderID,
			&c.LastMessageAt,
		); err != nil {
			return nil, err
		}
		convos = append(convos, c)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if convos == nil {
		convos = []models.GroupConversationPreview{}
	}

	return convos, nil
}

// GetGroupMessages returns group messages oldest first, including sender identity.
func (r *ChatRepo) GetGroupMessages(ctx context.Context, groupID int64, limit, offset int) ([]models.GroupMessage, error) {
	query := `
		SELECT
			gm.id,
			gm.group_id,
			gm.sender_id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			gm.content,
			gm.created_at
		FROM group_messages gm
		JOIN users u ON u.id = gm.sender_id
		WHERE gm.group_id = ?
		ORDER BY gm.created_at ASC, gm.id ASC
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.GroupMessage
	for rows.Next() {
		var m models.GroupMessage
		if err := rows.Scan(
			&m.ID,
			&m.GroupID,
			&m.SenderID,
			&m.SenderFirstName,
			&m.SenderLastName,
			&m.SenderNickname,
			&m.SenderAvatar,
			&m.Content,
			&m.CreatedAt,
		); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if messages == nil {
		messages = []models.GroupMessage{}
	}

	return messages, nil
}

func (r *ChatRepo) SendGroupMessage(ctx context.Context, groupID, senderID int64, content string) (*models.GroupMessage, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO group_messages (group_id, sender_id, content) VALUES (?, ?, ?)`,
		groupID, senderID, content,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	var msg models.GroupMessage
	err = r.db.QueryRowContext(ctx, `
		SELECT
			gm.id,
			gm.group_id,
			gm.sender_id,
			u.first_name,
			u.last_name,
			COALESCE(u.nickname, ''),
			COALESCE(u.avatar_path, ''),
			gm.content,
			gm.created_at
		FROM group_messages gm
		JOIN users u ON u.id = gm.sender_id
		WHERE gm.id = ?
	`, id).Scan(
		&msg.ID,
		&msg.GroupID,
		&msg.SenderID,
		&msg.SenderFirstName,
		&msg.SenderLastName,
		&msg.SenderNickname,
		&msg.SenderAvatar,
		&msg.Content,
		&msg.CreatedAt,
	)

	return &msg, err
}

func (r *ChatRepo) GetGroupMemberIDs(ctx context.Context, groupID int64) ([]int64, error) {
	rows, err := r.db.QueryContext(ctx, `SELECT user_id FROM group_members WHERE group_id = ?`, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIDs []int64
	for rows.Next() {
		var userID int64
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		userIDs = append(userIDs, userID)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if userIDs == nil {
		userIDs = []int64{}
	}

	return userIDs, nil
}
