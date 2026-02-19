package handlers

import "net/http"

type NotificationHandler struct{}

func NewNotificationHandler(_ ...any) *NotificationHandler {
	return &NotificationHandler{}
}

func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *NotificationHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
