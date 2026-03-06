package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/services"
)

type FollowHandler struct {
	service *services.FollowService
}

func NewFollowHandler(service *services.FollowService) *FollowHandler {
	return &FollowHandler{service: service}
}

// SendFollowRequest handles POST /api/users/{userId}/follow-requests
func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	followingID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || followingID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.service.Follow(r.Context(), followerID, followingID); err != nil {
		if err == services.ErrCannotFollowSelf {
			ErrorResponse(w, http.StatusBadRequest, "cannot follow yourself")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to follow user")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

// Unfollow handles DELETE /api/users/{userId}/follow
func (h *FollowHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	followingID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || followingID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.service.Unfollow(r.Context(), followerID, followingID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to unfollow user")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

func (h *FollowHandler) GetIncomingRequests(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *FollowHandler) GetSentRequests(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *FollowHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *FollowHandler) DeclineRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *FollowHandler) CancelRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
