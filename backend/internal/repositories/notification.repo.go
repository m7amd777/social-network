package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
)

type NotificationRepo struct {
	db *sql.DB
}

func NewNotificationRepo(db *sql.DB) *NotificationRepo {
	return &NotificationRepo{db: db}
}

//inserts the notif stuff
func (r *NotificationRepo) Create(ctx context.Context, userID, actorID int64, notifType string, referenceID int64) (*models.Notification, error) {
	result, err := r.db.ExecContext(ctx,
		`INSERT INTO notifications (user_id, actor_id, type, reference_id) VALUES (?, ?, ?, ?)`,
		userID, actorID, notifType, referenceID,
	)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

//gets notif by id
func (r *NotificationRepo) GetByID(ctx context.Context, id int64) (*models.Notification, error) {
	n := &models.Notification{}
	err := r.db.QueryRowContext(ctx, `
		SELECT
			n.id,
			n.user_id,
			n.actor_id,
			COALESCE(NULLIF(u.nickname, ''), u.first_name || ' ' || u.last_name, ''),
			COALESCE(u.avatar_path, ''),
			n.type,
			COALESCE(n.reference_id, 0),
			n.is_read,
			n.created_at
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_id
		WHERE n.id = ?
	`, id).Scan(
		&n.ID,
		&n.UserID,
		&n.ActorID,
		&n.ActorName,
		&n.ActorAvatar,
		&n.Type,
		&n.ReferenceID,
		&n.IsRead,
		&n.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return n, nil
}

//gets all notifs for a user
func (r *NotificationRepo) GetByUser(ctx context.Context, userID int64) ([]models.Notification, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			n.id,
			n.user_id,
			n.actor_id,
			COALESCE(NULLIF(u.nickname, ''), u.first_name || ' ' || u.last_name, ''),
			COALESCE(u.avatar_path, ''),
			n.type,
			COALESCE(n.reference_id, 0),
			n.is_read,
			n.created_at
		FROM notifications n
		LEFT JOIN users u ON u.id = n.actor_id
		WHERE n.user_id = ?
		ORDER BY n.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []models.Notification
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.ActorID,
			&n.ActorName,
			&n.ActorAvatar,
			&n.Type,
			&n.ReferenceID,
			&n.IsRead,
			&n.CreatedAt,
		); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, rows.Err()
}

//marks one notif as read
func (r *NotificationRepo) MarkRead(ctx context.Context, notifID, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
		notifID, userID,
	)
	return err
}

//marks all notifs as read for a user
func (r *NotificationRepo) MarkAllRead(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
		userID,
	)
	return err
}

//gets how many unread notifs a user has
func (r *NotificationRepo) GetUnreadCount(ctx context.Context, userID int64) (int, error) {
	var count int
	err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0 AND type != 'chat_message'`,
		userID,
	).Scan(&count)
	return count, err
}

func (r *NotificationRepo) DeleteAllRead(ctx context.Context, userID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM notifications WHERE user_id = ? AND is_read = 1`,
		userID,
	)
	return err
}

//deletes a notif by type and reference, used when cancelling a follow request
func (r *NotificationRepo) DeleteByReference(ctx context.Context, userID int64, notifType string, referenceID int64) error {
	_, err := r.db.ExecContext(ctx,
		`DELETE FROM notifications WHERE user_id = ? AND type = ? AND reference_id = ?`,
		userID, notifType, referenceID,
	)
	return err
}
