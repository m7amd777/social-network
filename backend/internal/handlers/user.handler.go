package handlers

import "net/http"

type UserHandler struct{}

func NewUserHandler(_ ...any) *UserHandler {
	return &UserHandler{}
}

func (h *UserHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *UserHandler) GetUserProfile(w http.ResponseWriter, r *http.Request) {
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
