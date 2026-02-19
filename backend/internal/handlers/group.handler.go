package handlers

import "net/http"

type GroupHandler struct{}

func NewGroupHandler(_ ...any) *GroupHandler {
	return &GroupHandler{}
}

func (h *GroupHandler) ListGroups(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *GroupHandler) CreateGroup(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

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
