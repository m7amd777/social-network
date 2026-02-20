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
		Id:      userID,
		Content: content,
	})
}
