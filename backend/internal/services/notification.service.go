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

// Create creates a notification for a user triggered by an actor.
func (s *NotificationService) Create(ctx context.Context, userID, actorID int64, notifType string, referenceID int64) (*models.Notification, error) {
	return s.repo.Create(ctx, userID, actorID, notifType, referenceID)
}

// GetForUser returns all notifications for the given user.
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

// MarkRead marks a single notification as read (only if it belongs to userID).
func (s *NotificationService) MarkRead(ctx context.Context, notifID, userID int64) error {
	return s.repo.MarkRead(ctx, notifID, userID)
}

// MarkAllRead marks all notifications for the user as read.
func (s *NotificationService) MarkAllRead(ctx context.Context, userID int64) error {
	return s.repo.MarkAllRead(ctx, userID)
}

// GetUnreadCount returns the unread notification count for the user.
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID int64) (int, error) {
	return s.repo.GetUnreadCount(ctx, userID)
}

// DeleteByReference removes a notification (e.g. when a follow request is cancelled).
func (s *NotificationService) DeleteByReference(ctx context.Context, userID int64, notifType string, referenceID int64) error {
	return s.repo.DeleteByReference(ctx, userID, notifType, referenceID)
}
