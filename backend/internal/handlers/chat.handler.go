package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/services"
)

type ConversationHandler struct {
	chatService *services.ChatService
}

func NewConversationHandler(chatService *services.ChatService) *ConversationHandler {
	return &ConversationHandler{chatService: chatService}
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

// GetMessages handles GET /api/conversations/{convId}/messages
// convId is the other user's ID.
func (h *ConversationHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	otherUserID, err := strconv.ParseInt(mux.Vars(r)["convId"], 10, 64)
	if err != nil || otherUserID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid conversation id")
		return
	}

	messages, err := h.chatService.GetMessages(r.Context(), userID, otherUserID)
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

func (h *ConversationHandler) GetGroupMessages(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) SendGroupMessage(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *ConversationHandler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
