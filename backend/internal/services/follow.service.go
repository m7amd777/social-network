package services

import (
	"context"
	"errors"
	"social-network/internal/repositories"
)

var ErrCannotFollowSelf = errors.New("cannot follow yourself")

type FollowService struct {
	repo *repositories.FollowRepo
}

func NewFollowService(repo *repositories.FollowRepo) *FollowService {
	return &FollowService{repo: repo}
}

func (s *FollowService) Follow(ctx context.Context, followerID, followingID int64) error {
	if followerID == followingID {
		return ErrCannotFollowSelf
	}
	return s.repo.Follow(ctx, followerID, followingID)
}

func (s *FollowService) Unfollow(ctx context.Context, followerID, followingID int64) error {
	return s.repo.Unfollow(ctx, followerID, followingID)
}

func (s *FollowService) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	return s.repo.IsFollowing(ctx, followerID, followingID)
}
