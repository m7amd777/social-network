package services

import (
	"context"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"strings"
)

type PostService struct {
	repo *repositories.PostRepo
}

func NewPostService(repo *repositories.PostRepo) *PostService {
	return &PostService{repo: repo}
}

func (s *PostService) CreatePost(ctx context.Context, userID int64, content string) (models.Post, error) {

	if strings.TrimSpace(content) == "" {
		return models.Post{}, errors.New("content required")
	}

	// business rule example
	if len(content) > 500 {
		return models.Post{}, errors.New("post too long")
	}

	return s.repo.Create(ctx, models.Post{
		UserID:  userID,
		Content: content,
	})
}

// GetUserPosts returns all posts for a given user
func (s *PostService) GetUserPosts(ctx context.Context, userID int64) ([]models.Post, error) {
	return s.repo.GetByUserID(ctx, userID)
}
