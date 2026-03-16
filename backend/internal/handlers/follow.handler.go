package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/repositories"
	"social-network/internal/services"
)

type FollowHandler struct {
	service *services.FollowService
}

func NewFollowHandler(service *services.FollowService) *FollowHandler {
	return &FollowHandler{service: service}
}

// SendFollowRequest handles POST /api/users/{userId}/follow-requests
// For public profiles this follows directly; for private profiles it creates a pending request.
func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	followingID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || followingID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	isPending, _, err := h.service.Follow(r.Context(), followerID, followingID)
	if err != nil {
		if err == services.ErrCannotFollowSelf {
			ErrorResponse(w, http.StatusBadRequest, "cannot follow yourself")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to follow user")
		return
	}

	if isPending {
		SuccessResponse(w, http.StatusOK, map[string]string{"status": "pending"})
		return
	}
	SuccessResponse(w, http.StatusOK, map[string]string{"status": "following"})
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

// GetIncomingRequests handles GET /api/follow-requests
func (h *FollowHandler) GetIncomingRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	requests, err := h.service.GetIncomingRequests(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get follow requests")
		return
	}

	SuccessResponse(w, http.StatusOK, requests)
}

// GetSentRequests handles GET /api/follow-requests/sent
func (h *FollowHandler) GetSentRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	requests, err := h.service.GetSentRequests(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get sent requests")
		return
	}

	SuccessResponse(w, http.StatusOK, requests)
}

// AcceptRequest handles POST /api/follow-requests/{requestId}/accept
func (h *FollowHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	requestID, err := strconv.ParseInt(vars["requestId"], 10, 64)
	if err != nil || requestID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}

	if err := h.service.AcceptFollowRequest(r.Context(), requestID, userID); err != nil {
		if err == repositories.ErrFollowRequestNotFound {
			ErrorResponse(w, http.StatusNotFound, "follow request not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to accept follow request")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

// DeclineRequest handles POST /api/follow-requests/{requestId}/decline
func (h *FollowHandler) DeclineRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	requestID, err := strconv.ParseInt(vars["requestId"], 10, 64)
	if err != nil || requestID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}

	if err := h.service.DeclineFollowRequest(r.Context(), requestID, userID); err != nil {
		if err == repositories.ErrFollowRequestNotFound {
			ErrorResponse(w, http.StatusNotFound, "follow request not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to decline follow request")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

// CancelRequest handles DELETE /api/follow-requests/{requestId}
func (h *FollowHandler) CancelRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	requestID, err := strconv.ParseInt(vars["requestId"], 10, 64)
	if err != nil || requestID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}

	if err := h.service.CancelFollowRequest(r.Context(), requestID, userID); err != nil {
		if err == repositories.ErrFollowRequestNotFound {
			ErrorResponse(w, http.StatusNotFound, "follow request not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to cancel follow request")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}
