package services

import (
	"context"
	"social-network/internal/models"
	"social-network/internal/repositories"
)

type NotificationService struct {
	repo *repositories.NotificationRepo
}

func NewNotificationService(repo *repositories.NotificationRepo) *NotificationService {
	return &NotificationService{repo: repo}
}

//creates a notif for a user
func (s *NotificationService) Create(ctx context.Context, userID, actorID int64, notifType string, referenceID int64) (*models.Notification, error) {
	return s.repo.Create(ctx, userID, actorID, notifType, referenceID)
}

//gets all notifs for a user
func (s *NotificationService) GetForUser(ctx context.Context, userID int64) ([]models.Notification, error) {
	notifications, err := s.repo.GetByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if notifications == nil {
		return []models.Notification{}, nil
	}
	return notifications, nil
}

//marks one notif as read
func (s *NotificationService) MarkRead(ctx context.Context, notifID, userID int64) error {
	return s.repo.MarkRead(ctx, notifID, userID)
}

//marks all notifs as read
func (s *NotificationService) MarkAllRead(ctx context.Context, userID int64) error {
	return s.repo.MarkAllRead(ctx, userID)
}

//gets the unread count
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID int64) (int, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

//deletes a notif by reference, used when cancelling a follow request
func (s *NotificationService) DeleteByReference(ctx context.Context, userID int64, notifType string, referenceID int64) error {
	return s.repo.DeleteByReference(ctx, userID, notifType, referenceID)
}
