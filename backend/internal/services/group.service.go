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
	"time"
)

var ErrInvalidGroupTitle = errors.New("group title is required")
var ErrInvalidGroupID = errors.New("invalid group id")
var ErrInvalidUserID = errors.New("invalid user id")
var ErrGroupMembershipRequired = errors.New("group membership required")
var ErrInvalidGroupPostContent = errors.New("post content or image is required")
var ErrInvalidEventID = errors.New("invalid event id")
var ErrEventNotFound = errors.New("event not found")
var ErrInvalidEventPayload = errors.New("invalid event payload")
var ErrInvalidEventResponse = errors.New("invalid event response")

type GroupService struct {
	repo         *repositories.GroupRepo
	notifService *NotificationService
}

func NewGroupService(repo *repositories.GroupRepo, notifService *NotificationService) *GroupService {
	return &GroupService{repo: repo, notifService: notifService}
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

	if ve.HasErrors() {
		return nil, ve
	}

	// Save image to filesystem if provided - SaveImageFromBase64 validates internally
	imagePath := ""
	if image != "" {
		var err error
		imagePath, err = utils.SaveImageFromBase64(image, utils.ImageTypeGroup)
		if err != nil {
			return nil, err
		}
	}

	return s.repo.CreateGroup(ctx, userID, title, description, imagePath)
}
func (s *GroupService) GetSpecificGroup(ctx context.Context, id string, userID int64) (models.GroupResponse, error) {
	groupId, err := strconv.Atoi(id)
	if err != nil {
		return models.GroupResponse{}, err
	}

	if groupId <= 0 {
		return models.GroupResponse{}, ErrInvalidGroupID
	}

	return s.repo.GetGroupDetails(ctx, groupId, userID)
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

	// Handle image upload - SaveImageFromBase64 validates internally
	if strings.TrimSpace(req.Image) != "" {
		imagePath, err := utils.SaveImageFromBase64(req.Image, utils.ImageTypePost)
		if err != nil {
			return models.PostResponse{}, err
		}
		req.Image = imagePath
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

	if strings.TrimSpace(req.Title) == "" || strings.TrimSpace(req.EventTime) == "" || strings.TrimSpace(req.EventDate) == "" {
		return nil, ErrInvalidEventPayload
	}
	layout := "2006-01-02 15:04"
	timeString := req.EventDate + " " + req.EventTime
	t, err := time.Parse(layout, timeString)
	if err != nil {
		return nil, ErrInvalidEventPayload
	}

	event, err := s.repo.CreateEvent(ctx, userID, groupId, req, t)
	if err != nil {
		return nil, err
	}

	memberIDs, err := s.repo.GetMembersID(ctx, int64(groupId))
	if err == nil {
		for _, memberID := range memberIDs {
			if memberID != userID { // don't notify the creator
				_, _ = s.notifService.Create(ctx, memberID, userID, "event_created", event.ID)
			}
		}
	}

	return event, nil
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

	if updatedEvent.CreatorID != userID {
		_, _ = s.notifService.Create(ctx, updatedEvent.CreatorID, userID, "event_rsvp", parsedEventID)
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
	ErrGroupNotFound     = errors.New("group not found")
	ErrAlreadyMember     = errors.New("already a member of this group")
	ErrNotGroupOwner     = errors.New("only group owner can delete group")
	ErrNotGroupAdmin     = errors.New("only group owner can remove members")
	ErrCannotRemoveOwner = errors.New("group owner cannot be removed")
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

func (s *GroupService) LeaveGroup(ctx context.Context, userID int64, groupID string) error {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return ErrInvalidGroupID
	}

	exists, err := s.repo.GroupExists(ctx, int64(groupId))
	if err != nil {
		return err
	}
	if !exists {
		return ErrGroupNotFound
	}

	isMember, err := s.repo.IsMember(ctx, int64(groupId), userID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrGroupMembershipRequired
	}

	isOwner, err := s.repo.IsGroupOwner(ctx, int64(groupId), userID)
	if err != nil {
		return err
	}

	if isOwner {
		newOwnerID, err := s.repo.GetEarliestMemberExcluding(ctx, int64(groupId), userID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return s.repo.DeleteGroup(ctx, int64(groupId))
			}
			return err
		}

		err = s.repo.TransferOwnershipAndRemoveMember(ctx, int64(groupId), userID, newOwnerID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return ErrGroupMembershipRequired
			}
			return err
		}

		return nil
	}

	err = s.repo.RemoveMember(ctx, userID, groupId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrGroupMembershipRequired
		}
		return err
	}

	// notify the group creator that someone left
	if group, err := s.repo.GetGroupByID(ctx, int64(groupId), userID); err == nil && group.CreatorID != userID {
		_, _ = s.notifService.Create(ctx, group.CreatorID, userID, "member_left", int64(groupId))
	}

	return nil
}

func (s *GroupService) DeleteGroup(ctx context.Context, userID int64, groupID string) error {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return ErrInvalidGroupID
	}

	exists, err := s.repo.GroupExists(ctx, int64(groupId))
	if err != nil {
		return err
	}
	if !exists {
		return ErrGroupNotFound
	}

	isOwner, err := s.repo.IsGroupOwner(ctx, int64(groupId), userID)
	if err != nil {
		return err
	}
	if !isOwner {
		return ErrNotGroupOwner
	}

	return s.repo.DeleteGroup(ctx, int64(groupId))
}

func (s *GroupService) GetMembers(ctx context.Context, userID int64, groupID string) ([]models.FollowerUser, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	exists, err := s.repo.GroupExists(ctx, int64(groupId))
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrGroupNotFound
	}

	isMember, err := s.repo.IsMember(ctx, int64(groupId), userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	members, err := s.repo.GetMembers(ctx, int64(groupId))
	if err != nil {
		return nil, err
	}
	if members == nil {
		members = []models.FollowerUser{}
	}

	return members, nil
}

func (s *GroupService) RemoveMember(ctx context.Context, requesterID int64, groupID string, targetUserID string) error {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return ErrInvalidGroupID
	}

	targetID, err := strconv.ParseInt(targetUserID, 10, 64)
	if err != nil || targetID <= 0 {
		return ErrInvalidUserID
	}

	exists, err := s.repo.GroupExists(ctx, int64(groupId))
	if err != nil {
		return err
	}
	if !exists {
		return ErrGroupNotFound
	}

	isOwner, err := s.repo.IsGroupOwner(ctx, int64(groupId), requesterID)
	if err != nil {
		return err
	}
	if !isOwner {
		return ErrNotGroupAdmin
	}

	isTargetOwner, err := s.repo.IsGroupOwner(ctx, int64(groupId), targetID)
	if err != nil {
		return err
	}
	if isTargetOwner {
		return ErrCannotRemoveOwner
	}

	isMember, err := s.repo.IsMember(ctx, int64(groupId), targetID)
	if err != nil {
		return err
	}
	if !isMember {
		return ErrGroupMembershipRequired
	}

	err = s.repo.RemoveMember(ctx, targetID, groupId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrGroupMembershipRequired
		}
		return err
	}

	return nil
}

func (s *GroupService) UpdateGroup(ctx context.Context, userID int64, groupID string, req *models.CreateGroupRequest) (*models.GroupResponse, error) {
	groupId, err := strconv.Atoi(groupID)
	if err != nil || groupId <= 0 {
		return nil, ErrInvalidGroupID
	}

	exists, err := s.repo.GroupExists(ctx, int64(groupId))
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrGroupNotFound
	}

	isOwner, err := s.repo.IsGroupOwner(ctx, int64(groupId), userID)
	if err != nil {
		return nil, err
	}
	if !isOwner {
		return nil, ErrNotGroupOwner
	}

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

	if ve.HasErrors() {
		return nil, ve
	}

	image := strings.TrimSpace(req.Image)
	if image != "" && image != "delete" {
		image, err = utils.SaveImageFromBase64(image, utils.ImageTypeGroup)
		if err != nil {
			return nil, err
		}
	}

	return s.repo.UpdateGroup(ctx, int64(groupId), userID, title, description, image)
}

func (s *GroupService) InviteUser(ctx context.Context, groupID, inviterID, inviteeID int64) error {
	invitationID, err := s.repo.CreateInvitation(ctx, groupID, inviterID, inviteeID)
	if err != nil {
		return err
	}
	_, _ = s.notifService.Create(ctx, inviteeID, inviterID, "group_invitation", invitationID)
	return nil
}

func (s *GroupService) AcceptInvitation(ctx context.Context, invitationID, inviteeID int64) error {
	return s.repo.AcceptInvitation(ctx, invitationID, inviteeID)
}

func (s *GroupService) DeclineInvitation(ctx context.Context, invitationID, inviteeID int64) error {
	return s.repo.DeclineInvitation(ctx, invitationID, inviteeID)
}

var ErrJoinRequestAlreadyPending = repositories.ErrJoinRequestAlreadyExists

func (s *GroupService) RequestToJoin(ctx context.Context, groupID, requesterID int64) error {
	requestID, err := s.repo.CreateJoinRequest(ctx, groupID, requesterID)
	if err != nil {
		if err == repositories.ErrJoinRequestAlreadyExists {
			return ErrJoinRequestAlreadyPending
		}
		return err
	}
	group, err := s.repo.GetGroupByID(ctx, groupID, requesterID)
	if err != nil {
		return err
	}
	_, _ = s.notifService.Create(ctx, group.CreatorID, requesterID, "group_request", requestID)
	return nil
}

func (s *GroupService) AcceptJoinRequest(ctx context.Context, requestID int64) error {
	return s.repo.AcceptJoinRequest(ctx, requestID)
}

func (s *GroupService) DeclineJoinRequest(ctx context.Context, requestID int64) error {
	return s.repo.DeclineJoinRequest(ctx, requestID)
}

func (s *GroupService) GetInvitationsForUser(ctx context.Context, userID int64) ([]models.GroupInvitation, error) {
	invitations, err := s.repo.GetInvitationsForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	if invitations == nil {
		return []models.GroupInvitation{}, nil
	}
	return invitations, nil
}

func (s *GroupService) GetJoinRequests(ctx context.Context, groupID int64) ([]models.JoinRequest, error) {
	requests, err := s.repo.GetJoinRequests(ctx, groupID)
	if err != nil {
		return nil, err
	}
	if requests == nil {
		return []models.JoinRequest{}, nil
	}
	return requests, nil
}
