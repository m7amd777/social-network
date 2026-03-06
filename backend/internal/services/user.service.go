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

// SearchUsers returns users whose first name, last name, or nickname matches the query
func (s *UserService) SearchUsers(ctx context.Context, query string) ([]models.FollowerUser, error) {
	if query == "" {
		return []models.FollowerUser{}, nil
	}
	return s.userRepo.SearchUsers(ctx, query)
}
