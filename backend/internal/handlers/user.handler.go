package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/services"
)

type UserHandler struct {
	service     *services.UserService
	postService *services.PostService
}

func NewUserHandler(service *services.UserService, postService *services.PostService) *UserHandler {
	return &UserHandler{service: service, postService: postService}
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

// GetUserPosts handles GET /api/users/{userId}/posts
func (h *UserHandler) GetUserPosts(w http.ResponseWriter, r *http.Request) {
	viewerID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	ownerID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || ownerID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	posts, err := h.postService.GetUserPosts(r.Context(), viewerID, ownerID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get posts")
		return
	}

	SuccessResponse(w, http.StatusOK, posts)
}

// GetFollowers handles GET /api/users/{userId}/followers
func (h *UserHandler) GetFollowers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || userID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	followers, err := h.service.GetFollowers(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get followers")
		return
	}

	SuccessResponse(w, http.StatusOK, followers)
}

func (h *UserHandler) GetFollowing(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID, err := strconv.ParseInt(vars["userId"], 10, 64)
	if err != nil || userID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid user id")
		return
	}

	following, err := h.service.GetFollowing(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get following")
		return
	}

	SuccessResponse(w, http.StatusOK, following)
}

func (h *UserHandler) GetRelationship(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
