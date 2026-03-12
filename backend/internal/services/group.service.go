package services

import (
	"context"
	"errors"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"strconv"
	"strings"
)

var ErrInvalidGroupTitle = errors.New("group title is required")
var ErrInvalidGroupID = errors.New("invalid group id")
var ErrGroupMembershipRequired = errors.New("group membership required")
var ErrInvalidGroupPostContent = errors.New("post content or image is required")

type GroupService struct {
	repo *repositories.GroupRepo
}

func NewGroupService(repo *repositories.GroupRepo) *GroupService {
	return &GroupService{repo: repo}
}

func (s *GroupService) CreateGroup(ctx context.Context, creatorID int64, req *models.CreateGroupRequest) (models.GroupData, error) {
	if strings.TrimSpace(req.Title) == "" {
		return models.GroupData{}, ErrInvalidGroupTitle
	}

	return s.repo.Create(ctx, creatorID, req)
}

func (s *GroupService) GetSpecificGroup(ctx context.Context, id string) (models.GroupData, error) {
	groupId, err := strconv.Atoi(id)
	if err != nil {
		return models.GroupData{}, err
	}

	if groupId <= 0 {
		return models.GroupData{}, ErrInvalidGroupID
	}

	return s.repo.GetGroupDetails(ctx, groupId)
}
func (s *GroupService) GetGroupPosts(ctx context.Context, userID int64, id string) ([]models.PostResponse, error) {

	groupId, err := strconv.Atoi(id)

	if err != nil {
		return []models.PostResponse{}, err
	}

	if groupId <= 0 {
		return []models.PostResponse{}, ErrInvalidGroupID
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return []models.PostResponse{}, err
	}
	if !isMember {
		return []models.PostResponse{}, ErrGroupMembershipRequired
	}

	return s.repo.GetGroupPosts(ctx, groupId)
}

func (s *GroupService) CreateGroupPost(ctx context.Context, userID int64, groupID string, req *models.CreateGroupPostRequest) (models.PostResponse, error) {
	parsedGroupID, err := strconv.Atoi(groupID)
	if err != nil || parsedGroupID <= 0 {
		return models.PostResponse{}, ErrInvalidGroupID
	}

	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.Image) == "" {
		return models.PostResponse{}, ErrInvalidGroupPostContent
	}

	isMember, err := s.repo.IsGroupMember(ctx, parsedGroupID, userID)
	if err != nil {
		return models.PostResponse{}, err
	}
	if !isMember {
		return models.PostResponse{}, ErrGroupMembershipRequired
	}

	return s.repo.CreateGroupPost(ctx, parsedGroupID, userID, req)
}

// ceate event
func (s *GroupService) CreateEvent(ctx context.Context, userID int64, groupID string, req *models.CreateEventRequest) {

	// return s.repo.CreateEvent(ctx)
}
