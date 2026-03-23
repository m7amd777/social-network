package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"social-network/internal/middleware"
	"social-network/internal/models"
	"social-network/internal/services"
	"social-network/internal/utils"

	"github.com/gorilla/mux"
)

type GroupHandler struct {
	service *services.GroupService
}

func NewGroupHandler(service *services.GroupService) *GroupHandler {
	return &GroupHandler{service: service}
}

func (h *GroupHandler) ListGroups(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	groups, err := h.service.ListGroups(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to list groups")
		return
	}

	SuccessResponse(w, http.StatusOK, groups)
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreateGroupRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	group, err := h.service.CreateGroup(r.Context(), userID, &req)
	if err != nil {
		if ve, ok := err.(*utils.ValidationError); ok {
			ValidationErrorResponse(w, ve.Fields)
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create group")
		return
	}

	SuccessResponse(w, http.StatusCreated, group)
}

func (h *GroupHandler) RequestToJoin(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupId"], 10, 64)
	if err != nil || groupID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}

	err = h.service.JoinGroup(r.Context(), groupID, userID)
	if err != nil {
		if err == services.ErrGroupNotFound {
			ErrorResponse(w, http.StatusNotFound, "group not found")
			return
		}
		if err == services.ErrAlreadyMember {
			ErrorResponse(w, http.StatusConflict, "already a member of this group")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to join group")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

// ========== STUBS (not yet implemented) ==========

func (h *GroupHandler) GetGroup(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupId := vars["groupId"]

	group, err := h.service.GetSpecificGroup(r.Context(), groupId)
	if err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}
	SuccessResponse(w, http.StatusOK, group)
}

func (h *GroupHandler) UpdateGroup(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) DeleteGroup(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetMembers(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) LeaveGroup(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) RemoveMember(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) InviteUser(w http.ResponseWriter, r *http.Request) {
	inviterID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupId"], 10, 64)
	if err != nil || groupID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}

	var req struct {
		InviteeID int64 `json:"inviteeId"`
	}
	if err := ParseJSON(r, &req); err != nil || req.InviteeID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.service.InviteUser(r.Context(), groupID, inviterID, req.InviteeID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to invite user")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}



func (h *GroupHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	invID, err := strconv.ParseInt(vars["invId"], 10, 64)
	if err != nil || invID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid invitation id")
		return
	}
	if err := h.service.AcceptInvitation(r.Context(), invID, userID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to accept invitation")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

func (h *GroupHandler) DeclineInvitation(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	invID, err := strconv.ParseInt(vars["invId"], 10, 64)
	if err != nil || invID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid invitation id")
		return
	}
	if err := h.service.DeclineInvitation(r.Context(), invID, userID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to decline invitation")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

func (h *GroupHandler) GetMyInvitations(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	invitations, err := h.service.GetInvitationsForUser(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get invitations")
		return
	}
	SuccessResponse(w, http.StatusOK, invitations)
}

func (h *GroupHandler) CancelInvitation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetJoinRequests(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	groupID, err := strconv.ParseInt(vars["groupId"], 10, 64)
	if err != nil || groupID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}
	requests, err := h.service.GetJoinRequests(r.Context(), groupID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get join requests")
		return
	}
	SuccessResponse(w, http.StatusOK, requests)
}

func (h *GroupHandler) AcceptJoinRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reqID, err := strconv.ParseInt(vars["reqId"], 10, 64)
	if err != nil || reqID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}
	if err := h.service.AcceptJoinRequest(r.Context(), reqID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to accept join request")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

func (h *GroupHandler) DeclineJoinRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reqID, err := strconv.ParseInt(vars["reqId"], 10, 64)
	if err != nil || reqID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}
	if err := h.service.DeclineJoinRequest(r.Context(), reqID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to decline join request")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

// AcceptJoinRequestDirect accepts a join request by ID only (no groupId in path).
// Used by the notifications page where only the request ID is known.
func (h *GroupHandler) AcceptJoinRequestDirect(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reqID, err := strconv.ParseInt(vars["reqId"], 10, 64)
	if err != nil || reqID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}
	if err := h.service.AcceptJoinRequest(r.Context(), reqID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to accept join request")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

// DeclineJoinRequestDirect declines a join request by ID only (no groupId in path).
func (h *GroupHandler) DeclineJoinRequestDirect(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	reqID, err := strconv.ParseInt(vars["reqId"], 10, 64)
	if err != nil || reqID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}
	if err := h.service.DeclineJoinRequest(r.Context(), reqID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to decline join request")
		return
	}
	SuccessResponse(w, http.StatusOK, nil)
}

func (h *GroupHandler) CancelJoinRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	groupId := vars["groupId"]

	posts, err := h.service.GetGroupPosts(r.Context(), userID, groupId)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to get group posts")
		return
	}
	if posts == nil {
		posts = []models.PostResponse{}
	}

	SuccessResponse(w, http.StatusOK, posts)
}

func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	groupId := vars["groupId"]

	var req models.CreateGroupPostRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	post, err := h.service.CreateGroupPost(r.Context(), userID, groupId, &req)
	if err != nil {
		if errors.Is(err, utils.ErrImageTooLarge) || errors.Is(err, utils.ErrImageTooSmall) || errors.Is(err, utils.ErrInvalidImageType) || errors.Is(err, utils.ErrInvalidBase64Format) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		if err == services.ErrInvalidGroupPostContent {
			ErrorResponse(w, http.StatusBadRequest, "content or image is required")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create group post")
		return
	}

	SuccessResponse(w, http.StatusCreated, post)
}

func (h *GroupHandler) GetGroupPost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) DeleteGroupPost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CreateGroupComment(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetEvents(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	groupID := vars["groupId"]

	events, err := h.service.GetEvents(r.Context(), userID, groupID)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch events")
		return
	}

	SuccessResponse(w, http.StatusOK, events)
}

func (h *GroupHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	groupID := vars["groupId"]

	var req models.CreateEventRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	event, err := h.service.CreateEvent(r.Context(), userID, groupID, &req)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrInvalidEventPayload {
			ErrorResponse(w, http.StatusBadRequest, "title and eventTime are required")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create event")
		return
	}

	SuccessResponse(w, http.StatusCreated, event)
}

func (h *GroupHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	groupID := vars["groupId"]
	eventID := vars["eventId"]

	event, err := h.service.GetEvent(r.Context(), userID, groupID, eventID)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrInvalidEventID {
			ErrorResponse(w, http.StatusBadRequest, "invalid event id")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		if err == services.ErrEventNotFound {
			ErrorResponse(w, http.StatusNotFound, "event not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch event")
		return
	}

	SuccessResponse(w, http.StatusOK, event)
}

func (h *GroupHandler) RespondToEvent(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	groupID := vars["groupId"]
	eventID := vars["eventId"]

	var req models.RespondToEventRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	event, err := h.service.RespondToEvent(r.Context(), userID, groupID, eventID, &req)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrInvalidEventID {
			ErrorResponse(w, http.StatusBadRequest, "invalid event id")
			return
		}
		if err == services.ErrInvalidEventResponse {
			ErrorResponse(w, http.StatusBadRequest, "response must be 'going' or 'not_going'")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		if err == services.ErrEventNotFound {
			ErrorResponse(w, http.StatusNotFound, "event not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to respond to event")
		return
	}

	SuccessResponse(w, http.StatusOK, event)
}

func (h *GroupHandler) GetEventResponses(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	groupID := vars["groupId"]
	eventID := vars["eventId"]

	responses, err := h.service.GetEventResponses(r.Context(), userID, groupID, eventID)
	if err != nil {
		if err == services.ErrInvalidGroupID {
			ErrorResponse(w, http.StatusBadRequest, "invalid group id")
			return
		}
		if err == services.ErrInvalidEventID {
			ErrorResponse(w, http.StatusBadRequest, "invalid event id")
			return
		}
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		if err == services.ErrEventNotFound {
			ErrorResponse(w, http.StatusNotFound, "event not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to fetch event responses")
		return
	}

	SuccessResponse(w, http.StatusOK, responses)
}

func (h *GroupHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
