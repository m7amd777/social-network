package services

import (
	"context"
	"errors"
	"strings"

	"social-network/internal/models"
	"social-network/internal/repositories"
	"social-network/internal/utils"
)

type GroupService struct {
	repo *repositories.GroupRepo
}

func NewGroupService(repo *repositories.GroupRepo) *GroupService {
	return &GroupService{repo: repo}
}

var (
	ErrGroupNotFound = errors.New("group not found")
	ErrAlreadyMember = errors.New("already a member of this group")
)

func (s *GroupService) ListGroups(ctx context.Context, userID int64) ([]models.GroupResponse, error) {
	groups, err := s.repo.ListGroups(ctx, userID)
	if err != nil {
		return nil, err
	}
	if groups == nil {
		groups = []models.GroupResponse{}
	}
	return groups, nil
}

func (s *GroupService) CreateGroup(ctx context.Context, userID int64, req *models.CreateGroupRequest) (*models.GroupResponse, error) {
	ve := utils.NewValidationError()

	title := req.Title
	if len(title) == 0 {
		ve.AddError("title", "title is required")
	} else if len(title) > 100 {
		ve.AddError("title", "title must be at most 100 characters")
	}

	description := req.Description
	if len(description) == 0 {
		ve.AddError("description", "description is required")
	} else if len(description) > 500 {
		ve.AddError("description", "description must be at most 500 characters")
	}

	if ve.HasErrors() {
		return nil, ve
	}

	image := strings.TrimSpace(req.Image)

	return s.repo.CreateGroup(ctx, userID, title, description, image)
}

func (s *GroupService) JoinGroup(ctx context.Context, groupID, userID int64) error {
	exists, err := s.repo.GroupExists(ctx, groupID)
	if err != nil {
		return err
	}
	if !exists {
		return ErrGroupNotFound
	}

	isMember, err := s.repo.IsMember(ctx, groupID, userID)
	if err != nil {
		return err
	}
	if isMember {
		return ErrAlreadyMember
	}

	return s.repo.JoinGroup(ctx, groupID, userID)
}
