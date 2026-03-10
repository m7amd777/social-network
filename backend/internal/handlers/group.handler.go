package handlers

import (
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
	notImplemented(w, r)
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
	notImplemented(w, r)
}

func (h *GroupHandler) GetMyInvitations(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) DeclineInvitation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CancelInvitation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetJoinRequests(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) AcceptJoinRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) DeclineJoinRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CancelJoinRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetGroupPosts(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
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
	notImplemented(w, r)
}

func (h *GroupHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetEvent(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) RespondToEvent(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) GetEventResponses(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) DeleteEvent(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
