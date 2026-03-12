package handlers

import (
	"net/http"
	"social-network/internal/services"
	"strings"

	"social-network/internal/middleware"
	"social-network/internal/models"

	"github.com/gorilla/mux"
)

type GroupHandler struct {
	service *services.GroupService
}

func NewGroupHandler(service *services.GroupService) *GroupHandler {
	return &GroupHandler{service: service}
}

func (h *GroupHandler) ListGroups(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreateGroupRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	validationErrors := map[string]string{}
	if strings.TrimSpace(req.Title) == "" {
		validationErrors["title"] = "title is required"
	}
	if len(req.Title) > 100 {
		validationErrors["title"] = "title must be at most 100 characters"
	}
	if len(req.Description) > 1000 {
		validationErrors["description"] = "description must be at most 1000 characters"
	}
	if len(validationErrors) > 0 {
		ValidationErrorResponse(w, validationErrors)
		return
	}

	group, err := h.service.CreateGroup(r.Context(), userID, &req)
	if err != nil {
		if err == services.ErrInvalidGroupTitle {
			ErrorResponse(w, http.StatusBadRequest, "title is required")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create group")
		return
	}

	SuccessResponse(w, http.StatusCreated, group)
}

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

func (h *GroupHandler) RequestToJoin(w http.ResponseWriter, r *http.Request) {
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
	notImplemented(w, r)
}

func (h *GroupHandler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	// userId := middleware.GetUserID(r.Context())

	// var req models.CreateEventRequest
	// if err := ParseJSON(r, &req); err != nil {
	// 	ErrorResponse(w, http.StatusBadRequest, "Invalid Request Body")
	// 	return
	// }

	//no need for mux we are just creating an event
	// event, err := h.service.CreateEvent(r.Context(), userId,, &req)
	// if err != nil {
	// 	ErrorResponse(w, http.StatusBadRequest, err)
	// 	return
	// }

	// SuccessResponse(w, http.StatusOK, event)
	return

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
