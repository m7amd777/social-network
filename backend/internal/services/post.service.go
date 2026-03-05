package services

import (
	"context"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"strings"
)

var ErrInvalidPrivacy = errors.New("invalid privacy setting")

type PostService struct {
	repo *repositories.PostRepo
}

func NewPostService(repo *repositories.PostRepo) *PostService {
	return &PostService{repo: repo}
}

func (s *PostService) CreatePost(ctx context.Context, userID int64, req *models.CreatePostRequest) (models.PostResponse, error) {
	if strings.TrimSpace(req.Content) == "" {
		return models.PostResponse{}, errors.New("content required")
	}
	if req.Privacy != "public" && req.Privacy != "followers" && req.Privacy != "custom" {
		return models.PostResponse{}, ErrInvalidPrivacy
	}
	return s.repo.Create(ctx, userID, req)
}

func (s *PostService) GetFeed(ctx context.Context, viewerID int64) ([]models.PostResponse, error) {
	return s.repo.GetFeed(ctx, viewerID)
}

// GetUserPosts returns posts by ownerID that are visible to viewerID
func (s *PostService) GetUserPosts(ctx context.Context, viewerID, ownerID int64) ([]models.PostResponse, error) {
	return s.repo.GetByUserID(ctx, viewerID, ownerID)
}

func (s *PostService) GetComments(ctx context.Context, postID int64) ([]models.CommentResponse, error) {
	return s.repo.GetComments(ctx, postID)
}

func (s *PostService) CreateComment(ctx context.Context, postID, userID int64, req *models.CreateCommentRequest) (models.CommentResponse, error) {
	if strings.TrimSpace(req.Content) == "" {
		return models.CommentResponse{}, errors.New("content required")
	}
	return s.repo.CreateComment(ctx, postID, userID, req)
}
