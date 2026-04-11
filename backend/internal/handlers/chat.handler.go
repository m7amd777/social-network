package handlers

import (
	"log"
	"net/http"
	"strconv"
	"strings"

	"social-network/internal/middleware"
	"social-network/internal/services"

	"github.com/gorilla/mux"
)

type ConversationHandler struct {
	chatService  *services.ChatService
	userService  *services.UserService
	notifService *services.NotificationService
}

func NewConversationHandler(chatService *services.ChatService, userService *services.UserService, notifService *services.NotificationService) *ConversationHandler {
	return &ConversationHandler{chatService: chatService, userService: userService, notifService: notifService}

}

// ListConversations handles GET /api/conversations
// Returns all users the current user has exchanged at least one message with.
func (h *ConversationHandler) ListConversations(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	convos, err := h.chatService.ListConversations(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to list conversations")
		return
	}

	SuccessResponse(w, http.StatusOK, convos)
}

func (h *ConversationHandler) CreateConversation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) GetConversation(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

// GetMessages handles GET /api/conversations/{convId}/messages?limit=10&before_id=0
// convId is the other user's ID.
func (h *ConversationHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	otherUserID, err := strconv.ParseInt(mux.Vars(r)["convId"], 10, 64)
	if err != nil || otherUserID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	limit := 10
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	var beforeID int64
	if raw := strings.TrimSpace(r.URL.Query().Get("before_id")); raw != "" {
		if parsed, err := strconv.ParseInt(raw, 10, 64); err == nil && parsed > 0 {
			beforeID = parsed
		}
	}

	messages, err := h.chatService.GetMessages(r.Context(), userID, otherUserID, limit, beforeID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get messages")
		return
	}

	SuccessResponse(w, http.StatusOK, messages)
}

func (h *ConversationHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	otherUserID, err := strconv.ParseInt(mux.Vars(r)["convId"], 10, 64)
	if err != nil || otherUserID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		ErrorResponse(w, http.StatusBadRequest, "content cannot be empty")
		return
	}

	msg, err := h.chatService.SendMessage(r.Context(), userID, otherUserID, content)
	if err != nil {
		if err == services.ErrMessageTooLong {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to send message")
		return
	}

	SuccessResponse(w, http.StatusCreated, msg)
}
func (h *ConversationHandler) MarkAsRead(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	otherUserID, err := strconv.ParseInt(mux.Vars(r)["convId"], 10, 64)
	if err != nil || otherUserID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	if err := h.chatService.MarkAsRead(r.Context(), userID, otherUserID); err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to mark as read")
		return
	}

	SuccessResponse(w, http.StatusOK, nil)
}

func (h *ConversationHandler) GetUnreadCount(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) SearchUsersInChat(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	currentUserID := middleware.GetUserID(r.Context())

	users, err := h.userService.SearchUsersInChat(r.Context(), q, currentUserID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to search users")
		return
	}

	SuccessResponse(w, http.StatusOK, users)
}

// ListGroupConversations handles GET /api/group-conversations
func (h *ConversationHandler) ListGroupConversations(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	convos, err := h.chatService.ListGroupConversations(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to list group conversations")
		return
	}

	SuccessResponse(w, http.StatusOK, convos)
}

func (h *ConversationHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	groupID, err := strconv.ParseInt(mux.Vars(r)["groupId"], 10, 64)
	if err != nil || groupID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}

	limit := 50
	offset := 0
	if rawLimit := strings.TrimSpace(r.URL.Query().Get("limit")); rawLimit != "" {
		parsed, err := strconv.Atoi(rawLimit)
		if err != nil || parsed <= 0 {
			ErrorResponse(w, http.StatusBadRequest, "invalid limit")
			return
		}
		if parsed > 200 {
			parsed = 200
		}
		limit = parsed
	}
	if rawOffset := strings.TrimSpace(r.URL.Query().Get("offset")); rawOffset != "" {
		parsed, err := strconv.Atoi(rawOffset)
		if err != nil || parsed < 0 {
			ErrorResponse(w, http.StatusBadRequest, "invalid offset")
			return
		}
		offset = parsed
	}

	messages, err := h.chatService.GetGroupMessages(r.Context(), userID, groupID, limit, offset)
	if err != nil {
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to get group messages")
		return
	}

	SuccessResponse(w, http.StatusOK, messages)
}

func (h *ConversationHandler) SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	groupID, err := strconv.ParseInt(mux.Vars(r)["groupId"], 10, 64)
	if err != nil || groupID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid group id")
		return
	}

	var req struct {
		Content string `json:"content"`
	}
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	content := strings.TrimSpace(req.Content)
	if content == "" {
		ErrorResponse(w, http.StatusBadRequest, "content cannot be empty")
		return
	}

	msg, err := h.chatService.SendGroupMessage(r.Context(), userID, groupID, content)
	if err != nil {
		if err == services.ErrGroupMembershipRequired {
			ErrorResponse(w, http.StatusForbidden, "you must be a group member")
			return
		}
		if err == services.ErrMessageTooLong {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to send group message")
		return
	}

	SuccessResponse(w, http.StatusCreated, msg)
}

func (h *ConversationHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// make sure user is authenticated
	userID := middleware.GetUserID(r.Context())
	if userID == 0 {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	// use upgrader
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("ws upgrade error:", err)
		return
	}
	defer conn.Close()

	send := make(chan WSMessage, 32)
	deregister := registerHub(userID, send)
	defer deregister()
	defer close(send)

	go writeLoop(conn, send)

	for msg := range readLoop(conn) {
		msg.SenderID = userID

		if msg.Type == "read" {
			if msg.ReceiverID <= 0 {
				continue
			}

			if err := h.chatService.MarkAsRead(r.Context(), userID, msg.ReceiverID); err != nil {
				log.Println("ws mark as read error:", err)
			}
			continue
		}

		msg.Content = strings.TrimSpace(msg.Content)
		if msg.Content == "" {
			continue
		}

		if msg.Type == "group_message" {
			if msg.GroupID <= 0 {
				continue
			}

			saved, err := h.chatService.SendGroupMessage(r.Context(), userID, msg.GroupID, msg.Content)
			if err != nil {
				log.Println("ws save group message error:", err)
				continue
			}

			msg.CreatedAt = saved.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
			msg.SenderFirstName = saved.SenderFirstName
			msg.SenderLastName = saved.SenderLastName
			msg.SenderNickname = saved.SenderNickname
			msg.SenderAvatar = saved.SenderAvatar
			group, err := h.chatService.GetGroupDetails(r.Context(), userID, msg.GroupID)
			if err != nil {
				log.Println("ws group details error:", err)
				continue
			}
			memberIDs, err := h.chatService.GetGroupMemberIDs(r.Context(), userID, msg.GroupID)
			if err != nil {
				log.Println("ws group members error:", err)
				continue
			}

			for _, memberID := range memberIDs {
				if memberID == userID {
					continue
				}
				sendToUser(memberID, msg)

				// create notification and ping the member via WS
				if notif, err := h.notifService.Create(r.Context(), memberID, userID, "chat_message", saved.ID); err != nil {
					log.Println("ws group notif create error:", err)
				} else {
					sendToUser(memberID, WSMessage{
						Type:        "notification",
						NotifType:   "group_message",
						ActorName:   notif.ActorName,
						ActorAvatar: notif.ActorAvatar,
						GroupName:   group.Title,
					})
				}
			}
			send <- msg // echo back to sender
			continue
		}

		saved, err := h.chatService.SendMessage(r.Context(), userID, msg.ReceiverID, msg.Content)
		if err != nil {
			log.Println("ws save message error:", err)
			continue
		}
		msg.CreatedAt = saved.CreatedAt.Format("2006-01-02T15:04:05Z07:00")

		sendToUser(msg.ReceiverID, msg)

		// create notification for the receiver and ping them via WS
		if notif, err := h.notifService.Create(r.Context(), msg.ReceiverID, userID, "chat_message", saved.ID); err != nil {
			log.Println("ws notif create error:", err)
		} else {
			sendToUser(msg.ReceiverID, WSMessage{
				Type:        "notification",
				NotifType:   "chat_message",
				ActorName:   notif.ActorName,
				ActorAvatar: notif.ActorAvatar,
			})
		}

		send <- msg // echo back to sender
	}
}
