package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/services"
)

type UserHandler struct {
	service *services.UserService
}

func NewUserHandler(service *services.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GetUserProfile handles GET /api/users/{id}
func (h *UserHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || userID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	profile, err := h.service.GetProfile(r.Context(), userID)
	if err != nil {
		if err == services.ErrUserNotFound {
			ErrorResponse(w, http.StatusNotFound, "user not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to get profile")
		return
	}

	SuccessResponse(w, http.StatusOK, profile)
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *UserHandler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *UserHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *UserHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *UserHandler) GetRelationship(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
