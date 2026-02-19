package handlers

import "net/http"

type ConversationHandler struct{}

func NewConversationHandler(_ ...any) *ConversationHandler {
	return &ConversationHandler{}
}

func (h *ConversationHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
