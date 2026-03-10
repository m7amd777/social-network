package services

import (
	"context"
	"errors"
	"fmt"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"strconv"
	"strings"
)

var ErrInvalidGroupTitle = errors.New("group title is required")

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
		fmt.Println("fi error hna")
		return models.GroupData{}, err
	}

	if groupId < 0 {
		fmt.Println("NOT POSSIBLE ASLAB")
		return models.GroupData{}, err
	}

	return s.repo.GetGroupDetails(ctx, groupId)
}
