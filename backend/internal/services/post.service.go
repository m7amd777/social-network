package services

import (
	"context"
	"database/sql"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"social-network/internal/utils"
	"strings"
)

var (
	ErrInvalidPrivacy  = errors.New("invalid privacy setting")
	ErrPostNotFound    = errors.New("post not found")
	ErrCommentNotFound = errors.New("comment not found")
	ErrNotAuthorized   = errors.New("not authorized to perform this action")
)

type PostService struct {
	repo *repositories.PostRepo
}

func NewPostService(repo *repositories.PostRepo) *PostService {
	return &PostService{repo: repo}
}

func (s *PostService) CreatePost(ctx context.Context, userID int64, req *models.CreatePostRequest) (models.PostResponse, error) {
	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.Image) == "" {
		return models.PostResponse{}, errors.New("content or image required")
	}
	if req.Privacy != "public" && req.Privacy != "followers" && req.Privacy != "custom" {
		return models.PostResponse{}, ErrInvalidPrivacy
	}
	
	// Handle image upload - SaveImageFromBase64 validates internally
	if strings.TrimSpace(req.Image) != "" {
		imagePath, err := utils.SaveImageFromBase64(req.Image, utils.ImageTypePost)
		if err != nil {
			return models.PostResponse{}, err
		}
		req.Image = imagePath
	}
	
	return s.repo.Create(ctx, userID, req)
}

func (s *PostService) GetPost(ctx context.Context, postID, viewerID int64) (models.PostResponse, error) {
	post, err := s.repo.GetByIDForViewer(ctx, postID, viewerID)
	if err != nil {
		if err == sql.ErrNoRows {
			return models.PostResponse{}, ErrPostNotFound
		}
		return models.PostResponse{}, err
	}
	canView, err := s.repo.CanViewPost(ctx, postID, viewerID)
	if err != nil {
		return models.PostResponse{}, err
	}
	if !canView {
		return models.PostResponse{}, ErrNotAuthorized
	}
	return post, nil
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
	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.Image) == "" {
		return models.CommentResponse{}, errors.New("content or image required")
	}
	
	// Handle image upload - SaveImageFromBase64 validates internally
	if strings.TrimSpace(req.Image) != "" {
		imagePath, err := utils.SaveImageFromBase64(req.Image, utils.ImageTypeComment)
		if err != nil {
			return models.CommentResponse{}, err
		}
		req.Image = imagePath
	}
	
	return s.repo.CreateComment(ctx, postID, userID, req)
}

func (s *PostService) LikePost(ctx context.Context, postID, userID int64) (int, bool, error) {
	if err := s.repo.LikePost(ctx, postID, userID); err != nil {
		return 0, false, err
	}
	count, liked, err := s.repo.GetLikeCount(ctx, postID, userID)
	return count, liked, err
}

func (s *PostService) UnlikePost(ctx context.Context, postID, userID int64) (int, bool, error) {
	if err := s.repo.UnlikePost(ctx, postID, userID); err != nil {
		return 0, false, err
	}
	count, liked, err := s.repo.GetLikeCount(ctx, postID, userID)
	return count, liked, err
}

// DeletePost deletes a post and cleans up associated images
func (s *PostService) DeletePost(ctx context.Context, postID, userID int64) error {
	// Get post owner and image path for authorization and cleanup
	ownerID, imagePath, err := s.repo.GetPostOwnerAndImage(ctx, postID)
	if err != nil {
		if err == sql.ErrNoRows {
			return ErrPostNotFound
		}
		return err
	}

	// Check authorization - only post owner can delete
	if ownerID != userID {
		return ErrNotAuthorized
	}

	// Get comment images for cleanup before deleting
	commentImages, err := s.repo.GetCommentImagesForPost(ctx, postID)
	if err != nil {
		return err
	}

	// Delete post from database (this also deletes comments, likes, viewers)
	if err := s.repo.DeletePost(ctx, postID); err != nil {
		return err
	}

	// Clean up image files (after successful DB deletion)
	// Post image
	if imagePath != "" {
		_ = utils.DeleteImage(imagePath)
	}
	// Comment images
	for _, img := range commentImages {
		_ = utils.DeleteImage(img)
	}

	return nil
}

// DeleteComment deletes a comment and cleans up its image
func (s *PostService) DeleteComment(ctx context.Context, commentID, userID int64) error {
	// Get comment owner and image path for authorization and cleanup
	ownerID, imagePath, err := s.repo.GetCommentOwnerAndImage(ctx, commentID)
	if err != nil {
		if err == sql.ErrNoRows {
			return ErrCommentNotFound
		}
		return err
	}

	// Check authorization - only comment owner can delete
	if ownerID != userID {
		return ErrNotAuthorized
	}

	// Delete comment from database
	if err := s.repo.DeleteComment(ctx, commentID); err != nil {
		return err
	}

	// Clean up image file (after successful DB deletion)
	if imagePath != "" {
		_ = utils.DeleteImage(imagePath)
	}

	return nil
}
