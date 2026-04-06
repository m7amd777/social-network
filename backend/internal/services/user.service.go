package services

import (
	"context"
	"database/sql"
	"social-network/internal/models"
	"social-network/internal/repositories"
)

type UserService struct {
	userRepo *repositories.UserRepo
}

func NewUserService(userRepo *repositories.UserRepo) *UserService {
	return &UserService{userRepo: userRepo}
}

// GetProfile fetches the full profile for a given user ID
func (s *UserService) GetProfile(ctx context.Context, userID int64) (*models.UserProfile, error) {
	profile, err := s.userRepo.GetProfile(ctx, userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return profile, nil
}

// GetFollowers returns the list of users who follow the given userID
func (s *UserService) GetFollowers(ctx context.Context, userID int64) ([]models.FollowerUser, error) {
	return s.userRepo.GetFollowers(ctx, userID)
}

// GetFollowing returns the list of users that the given userID follows
func (s *UserService) GetFollowing(ctx context.Context, userID int64) ([]models.FollowerUser, error) {
	return s.userRepo.GetFollowing(ctx, userID)
}

// GetSuggestedUsers returns random users the current user is not yet following.
func (s *UserService) GetSuggestedUsers(ctx context.Context, currentUserID int64) ([]models.FollowerUser, error) {
	return s.userRepo.GetSuggestedUsers(ctx, currentUserID, 5)
}

// SearchUsers returns all users whose first name, last name, or nickname matches the query, excluding the caller.
func (s *UserService) SearchUsers(ctx context.Context, query string, excludeID int64) ([]models.FollowerUser, error) {
	if query == "" {
		return []models.FollowerUser{}, nil
	}
	return s.userRepo.SearchUsers(ctx, query, excludeID)
}

// SearchUsersInChat returns only followers/following whose name matches, for use in the chat user picker.
func (s *UserService) SearchUsersInChat(ctx context.Context, query string, excludeID int64) ([]models.FollowerUser, error) {
	if query == "" {
		return []models.FollowerUser{}, nil
	}
	return s.userRepo.SearchUsersInChat(ctx, query, excludeID)
}
