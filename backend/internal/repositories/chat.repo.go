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
