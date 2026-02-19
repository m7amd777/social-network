package handlers

import "net/http"

type FollowHandler struct{}

func NewFollowHandler(_ ...any) *FollowHandler {
	return &FollowHandler{}
}

func (h *FollowHandler) SendFollowRequest(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
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

func (h *FollowHandler) Unfollow(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
