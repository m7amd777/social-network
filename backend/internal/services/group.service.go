package services

import (
	"context"
	"database/sql"
	"errors"
	"regexp"
	"social-network/internal/models"
	"social-network/internal/repositories"
	"social-network/internal/utils"
	"strconv"
	"strings"
)

var ErrInvalidGroupTitle = errors.New("group title is required")
var ErrInvalidGroupID = errors.New("invalid group id")
var ErrGroupMembershipRequired = errors.New("group membership required")
var ErrInvalidGroupPostContent = errors.New("post content or image is required")
var ErrInvalidEventID = errors.New("invalid event id")
var ErrEventNotFound = errors.New("event not found")
var ErrInvalidEventPayload = errors.New("invalid event payload")
var ErrInvalidEventResponse = errors.New("invalid event response")

type GroupService struct {
	repo *repositories.GroupRepo
}

func NewGroupService(repo *repositories.GroupRepo) *GroupService {
	return &GroupService{repo: repo}
}

func (s *GroupService) CreateGroup(ctx context.Context, userID int64, req *models.CreateGroupRequest) (*models.GroupResponse, error) {
	ve := utils.NewValidationError()

	title := strings.TrimSpace(req.Title)
	if len(title) < 3 {
		ve.AddError("title", "title must be at least 3 characters")
	} else if len(title) > 40 {
		ve.AddError("title", "title must be at most 40 characters")
	} else if !regexp.MustCompile(`^[a-zA-Z0-9 ]+$`).MatchString(title) {
		ve.AddError("title", "title must only contain alphanumeric characters and spaces")
	}

	description := strings.TrimSpace(req.Description)
	if len(description) < 10 {
		ve.AddError("description", "description must be at least 10 characters")
	} else if len(description) > 500 {
		ve.AddError("description", "description must be at most 500 characters")
	}

	image := strings.TrimSpace(req.Image)
	if image != "" {
		if err := utils.ValidateImageBase64(image); err != nil {
			ve.AddError("image", err.Error())
		}
	}

	if ve.HasErrors() {
		return nil, ve
	}

	return s.repo.CreateGroup(ctx, userID, title, description, image)
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

	if strings.TrimSpace(req.Image) != "" {
		if err := utils.ValidateImageBase64(req.Image); err != nil {
			return models.PostResponse{}, err
		}
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

func (s *GroupService) CreateEvent(ctx context.Context, userID int64, groupID string, req *models.CreateEventRequest) (*models.EventResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.EventTime) == "" {
		return nil, ErrInvalidEventPayload
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	return s.repo.CreateEvent(ctx, userID, groupId, req)
}

func (s *GroupService) GetEvent(ctx context.Context, userID int64, groupID string, eventID string) (*models.EventResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	parsedEventID, err := strconv.ParseInt(eventID, 10, 64)
	if err != nil || parsedEventID <= 0 {
		return nil, ErrInvalidEventID
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	event, err := s.repo.GetEventByID(ctx, int64(groupId), parsedEventID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	return event, nil
}

func (s *GroupService) GetEvents(ctx context.Context, userID int64, groupID string) ([]models.EventResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	events, err := s.repo.GetGroupEvents(ctx, int64(groupId))
	if err != nil {
		return nil, err
	}
	if events == nil {
		events = []models.EventResponse{}
	}

	return events, nil
}

func (s *GroupService) RespondToEvent(ctx context.Context, userID int64, groupID string, eventID string, req *models.RespondToEventRequest) (*models.EventResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	parsedEventID, err := strconv.ParseInt(eventID, 10, 64)
	if err != nil || parsedEventID <= 0 {
		return nil, ErrInvalidEventID
	}

	response := strings.TrimSpace(req.Response)
	if response != "going" && response != "not_going" {
		return nil, ErrInvalidEventResponse
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	if _, err := s.repo.GetEventByID(ctx, int64(groupId), parsedEventID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	if err := s.repo.RespondToEvent(ctx, parsedEventID, userID, response); err != nil {
		return nil, err
	}

	updatedEvent, err := s.repo.GetEventByID(ctx, int64(groupId), parsedEventID)
	if err != nil {
		return nil, err
	}

	return updatedEvent, nil
}

func (s *GroupService) GetEventResponses(ctx context.Context, userID int64, groupID string, eventID string) ([]models.EventUserResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	parsedEventID, err := strconv.ParseInt(eventID, 10, 64)
	if err != nil || parsedEventID <= 0 {
		return nil, ErrInvalidEventID
	}

	isMember, err := s.repo.IsGroupMember(ctx, groupId, userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	if _, err := s.repo.GetEventByID(ctx, int64(groupId), parsedEventID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, err
	}

	responses, err := s.repo.GetEventResponsesByEventID(ctx, parsedEventID)
	if err != nil {
		return nil, err
	}
	if responses == nil {
		responses = []models.EventUserResponse{}
	}

	return responses, nil
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
