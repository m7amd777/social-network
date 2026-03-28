package services

import (
	"context"
	"social-network/internal/models"
	"social-network/internal/repositories"
)

type ChatService struct {
	repo *repositories.ChatRepo
}

func NewChatService(repo *repositories.ChatRepo) *ChatService {
	return &ChatService{repo: repo}
}

func (s *ChatService) ListConversations(ctx context.Context, userID int64) ([]models.ConversationPreview, error) {
	return s.repo.ListConversations(ctx, userID)
}

func (s *ChatService) GetMessages(ctx context.Context, userID, otherUserID int64) ([]models.Message, error) {
	return s.repo.GetMessages(ctx, userID, otherUserID)
}


func (s *ChatService) SendMessage(ctx context.Context, senderID, receiverID int64, content string) (*models.Message, error) {
    return s.repo.SendMessage(ctx, senderID, receiverID, content)
}

func (s *ChatService) MarkAsRead(ctx context.Context, receiverID, senderID int64) error {
    return s.repo.MarkAsRead(ctx, receiverID, senderID)
}