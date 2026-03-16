package services

import (
	"context"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
)

var ErrCannotFollowSelf = errors.New("cannot follow yourself")

type FollowService struct {
	repo         *repositories.FollowRepo
	notifService *NotificationService
}

func NewFollowService(repo *repositories.FollowRepo, notifService *NotificationService) *FollowService {
	return &FollowService{repo: repo, notifService: notifService}
}

// Follow handles a follow action. If the target user is private, creates a follow request
// and a notification. If public, follows directly.
// Returns (isPending bool, requestID int64, err error).
func (s *FollowService) Follow(ctx context.Context, followerID, followingID int64) (isPending bool, requestID int64, err error) {
	if followerID == followingID {
		return false, 0, ErrCannotFollowSelf
	}

	isPrivate, err := s.repo.IsPrivate(ctx, followingID)
	if err != nil {
		return false, 0, err
	}

	if isPrivate {
		reqID, err := s.repo.CreateFollowRequest(ctx, followerID, followingID)
		if err != nil {
			if err == repositories.ErrFollowRequestAlreadyExists {
				return true, reqID, nil
			}
			return false, 0, err
		}
		// Notify the target user about the follow request
		_, _ = s.notifService.Create(ctx, followingID, followerID, "follow_request", reqID)
		return true, reqID, nil
	}

	// Public profile: follow directly
	if err := s.repo.Follow(ctx, followerID, followingID); err != nil {
		return false, 0, err
	}
	return false, 0, nil
}

// Unfollow removes a follow relationship.
func (s *FollowService) Unfollow(ctx context.Context, followerID, followingID int64) error {
	return s.repo.Unfollow(ctx, followerID, followingID)
}

// IsFollowing checks whether followerID follows followingID.
func (s *FollowService) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	return s.repo.IsFollowing(ctx, followerID, followingID)
}

// AcceptFollowRequest accepts a pending follow request targeting userID.
// Creates a "follow_accepted" notification for the requester.
func (s *FollowService) AcceptFollowRequest(ctx context.Context, requestID, userID int64) error {
	req, err := s.repo.AcceptFollowRequest(ctx, requestID, userID)
	if err != nil {
		return err
	}
	// Remove the incoming follow_request notification
	_ = s.notifService.DeleteByReference(ctx, userID, "follow_request", requestID)
	// Notify the requester that their request was accepted
	_, _ = s.notifService.Create(ctx, req.RequesterID, userID, "follow_accepted", requestID)
	return nil
}

// DeclineFollowRequest declines a pending follow request targeting userID.
func (s *FollowService) DeclineFollowRequest(ctx context.Context, requestID, userID int64) error {
	if err := s.repo.DeclineFollowRequest(ctx, requestID, userID); err != nil {
		return err
	}
	// Remove the incoming follow_request notification
	_ = s.notifService.DeleteByReference(ctx, userID, "follow_request", requestID)
	return nil
}

// CancelFollowRequest lets a requester cancel their own pending request.
func (s *FollowService) CancelFollowRequest(ctx context.Context, requestID, requesterID int64) error {
	req, err := s.repo.GetFollowRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if err := s.repo.CancelFollowRequest(ctx, requestID, requesterID); err != nil {
		return err
	}
	// Remove the follow_request notification from the target's notifications
	_ = s.notifService.DeleteByReference(ctx, req.TargetID, "follow_request", requestID)
	return nil
}

// GetIncomingRequests returns pending follow requests for userID.
func (s *FollowService) GetIncomingRequests(ctx context.Context, userID int64) ([]models.FollowRequestResponse, error) {
	reqs, err := s.repo.GetIncomingRequests(ctx, userID)
	if err != nil {
		return nil, err
	}
	if reqs == nil {
		return []models.FollowRequestResponse{}, nil
	}
	return reqs, nil
}

// GetSentRequests returns pending follow requests sent by userID.
func (s *FollowService) GetSentRequests(ctx context.Context, userID int64) ([]models.FollowRequestResponse, error) {
	reqs, err := s.repo.GetSentRequests(ctx, userID)
	if err != nil {
		return nil, err
	}
	if reqs == nil {
		return []models.FollowRequestResponse{}, nil
	}
	return reqs, nil
}
