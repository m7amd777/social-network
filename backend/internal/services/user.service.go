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
