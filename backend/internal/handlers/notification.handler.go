package handlers

import (
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/services"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{service: service}
}

//gets all notifs for the logged in user
func (h *NotificationHandler) GetNotifications(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	notifications, err := h.service.GetForUser(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get notifications")
		return
	}

	SuccessResponse(w, http.StatusOK, notifications)
}

//marks one notif as read
func (h *NotificationHandler) MarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	notifID, err := strconv.ParseInt(vars["id"], 10, 64)
	if err != nil || notifID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid notification id")
		return
	}

	if err := h.service.MarkRead(r.Context(), notifID, userID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to mark notification as read")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

//marks all notifs as read
func (h *NotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	if err := h.service.MarkAllRead(r.Context(), userID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to mark all notifications as read")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

//gets how many unread notifs the user has
func (h *NotificationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	count, err := h.service.GetUnreadCount(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get unread count")
		return
	}

	SuccessResponse(w, http.StatusOK, map[string]int{"count": count})
}
