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

//follows a user, returns pending if the target is private
func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	followerID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	followingID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || followingID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	isPending, requestID, notif, err := h.service.Follow(r.Context(), followerID, followingID)
	if err != nil {
		if err == services.ErrCannotFollowSelf {
			ErrorResponse(w, http.StatusBadRequest, "cannot follow yourself")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to follow user")
		return
	}

	if isPending {
		if notif != nil {
			sendToUser(notif.UserID, WSMessage{
				Type:        "notification",
				NotifType:   "follow_request",
				ActorName:   notif.ActorName,
				ActorAvatar: notif.ActorAvatar,
			})
		}
		SuccessResponse(w, http.StatusOK, map[string]interface{}{"status": "pending", "id": requestID})
		return
	}
	SuccessResponse(w, http.StatusOK, map[string]string{"status": "following"})
}

//unfollows a user
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

//gets all incoming follow requests for the logged in user
func (h *FollowHandler) GetIncomingRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	requests, err := h.service.GetIncomingRequests(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get follow requests")
		return
	}

	SuccessResponse(w, http.StatusOK, requests)
}

//gets all follow requests the logged in user has sent
func (h *FollowHandler) GetSentRequests(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	requests, err := h.service.GetSentRequests(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get sent requests")
		return
	}

	SuccessResponse(w, http.StatusOK, requests)
}

//accepts a follow request
func (h *FollowHandler) AcceptRequest(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	requestID, err := strconv.ParseInt(vars["requestId"], 10, 64)
	if err != nil || requestID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid request id")
		return
	}

	notif, err := h.service.AcceptFollowRequest(r.Context(), requestID, userID)
	if err != nil {
		if err == repositories.ErrFollowRequestNotFound {
			ErrorResponse(w, http.StatusNotFound, "follow request not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to accept follow request")
		return
	}

	if notif != nil {
		sendToUser(notif.UserID, WSMessage{
			Type:        "notification",
			NotifType:   "follow_accepted",
			ActorName:   notif.ActorName,
			ActorAvatar: notif.ActorAvatar,
		})
	}

	SuccessResponse(w, http.StatusOK, nil)
}

//declines a follow request
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

//cancels a follow request the user sent
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
