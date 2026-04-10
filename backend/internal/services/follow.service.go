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

//follows a user, if the target is private it creates a follow request instead
func (s *FollowService) Follow(ctx context.Context, followerID, followingID int64) (isPending bool, requestID int64, notif *models.Notification, err error) {
	if followerID == followingID {
		return false, 0, nil, ErrCannotFollowSelf
	}

	isPrivate, err := s.repo.IsPrivate(ctx, followingID)
	if err != nil {
		return false, 0, nil, err
	}

	if isPrivate {
		reqID, err := s.repo.CreateFollowRequest(ctx, followerID, followingID)
		if err != nil {
			if err == repositories.ErrFollowRequestAlreadyExists {
				return true, reqID, nil, nil
			}
			return false, 0, nil, err
		}
		//send a notif to the target user
		n, _ := s.notifService.Create(ctx, followingID, followerID, "follow_request", reqID)
		return true, reqID, n, nil
	}

	//public profile so just follow directly
	if err := s.repo.Follow(ctx, followerID, followingID); err != nil {
		return false, 0, nil, err
	}
	return false, 0, nil, nil
}

//removes the follow relationship
func (s *FollowService) Unfollow(ctx context.Context, followerID, followingID int64) error {
	return s.repo.Unfollow(ctx, followerID, followingID)
}

//checks if followerID is following followingID
func (s *FollowService) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	return s.repo.IsFollowing(ctx, followerID, followingID)
}

//checks if followerID has a pending follow request to followingID
func (s *FollowService) HasPendingRequest(ctx context.Context, followerID, followingID int64) (bool, error) {
	return s.repo.HasPendingRequest(ctx, followerID, followingID)
}

func (s *FollowService) GetPendingRequestID(ctx context.Context, followerID, followingID int64) (int64, error) {
	return s.repo.GetPendingRequestID(ctx, followerID, followingID)
}

//accepts a follow request and notifies the requester
func (s *FollowService) AcceptFollowRequest(ctx context.Context, requestID, userID int64) (*models.Notification, error) {
	req, err := s.repo.AcceptFollowRequest(ctx, requestID, userID)
	if err != nil {
		return nil, err
	}
	//clean up the incoming follow_request notif
	_ = s.notifService.DeleteByReference(ctx, userID, "follow_request", requestID)
	//let the requester know they were accepted
	n, _ := s.notifService.Create(ctx, req.RequesterID, userID, "follow_accepted", requestID)
	return n, nil
}

//declines a follow request and cleans up the notif
func (s *FollowService) DeclineFollowRequest(ctx context.Context, requestID, userID int64) error {
	if err := s.repo.DeclineFollowRequest(ctx, requestID, userID); err != nil {
		return err
	}
	_ = s.notifService.DeleteByReference(ctx, userID, "follow_request", requestID)
	return nil
}

//cancels a follow request and removes the notif from the target
func (s *FollowService) CancelFollowRequest(ctx context.Context, requestID, requesterID int64) error {
	req, err := s.repo.GetFollowRequest(ctx, requestID)
	if err != nil {
		return err
	}
	if err := s.repo.CancelFollowRequest(ctx, requestID, requesterID); err != nil {
		return err
	}
	_ = s.notifService.DeleteByReference(ctx, req.TargetID, "follow_request", requestID)
	return nil
}

//gets all incoming pending follow requests for a user
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

//gets all pending follow requests sent by a user
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
