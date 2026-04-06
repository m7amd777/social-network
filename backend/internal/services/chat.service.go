package services

import (
	"context"
	"social-network/internal/models"
	"social-network/internal/repositories"
)

type ChatService struct {
	repo      *repositories.ChatRepo
	groupRepo *repositories.GroupRepo
}

func NewChatService(repo *repositories.ChatRepo, groupRepo *repositories.GroupRepo) *ChatService {
	return &ChatService{repo: repo, groupRepo: groupRepo}
}

func (s *ChatService) ListConversations(ctx context.Context, userID int64) ([]models.ConversationPreview, error) {
	return s.repo.ListConversations(ctx, userID)
}

func (s *ChatService) GetMessages(ctx context.Context, userID, otherUserID int64, limit int, beforeID int64) ([]models.Message, error) {
	return s.repo.GetMessages(ctx, userID, otherUserID, limit, beforeID)
}

func (s *ChatService) SendMessage(ctx context.Context, senderID, receiverID int64, content string) (*models.Message, error) {
	return s.repo.SendMessage(ctx, senderID, receiverID, content)
}

func (s *ChatService) MarkAsRead(ctx context.Context, receiverID, senderID int64) error {
	return s.repo.MarkAsRead(ctx, receiverID, senderID)
}

func (s *ChatService) ListGroupConversations(ctx context.Context, userID int64) ([]models.GroupConversationPreview, error) {
	return s.repo.ListGroupConversations(ctx, userID)
}

func (s *ChatService) GetGroupMessages(ctx context.Context, userID int64, groupID int64, limit, offset int) ([]models.GroupMessage, error) {
	isMember, err := s.groupRepo.IsGroupMember(ctx, int(groupID), userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	return s.repo.GetGroupMessages(ctx, groupID, limit, offset)
}

func (s *ChatService) SendGroupMessage(ctx context.Context, userID int64, groupID int64, content string) (*models.GroupMessage, error) {
	isMember, err := s.groupRepo.IsGroupMember(ctx, int(groupID), userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	return s.repo.SendGroupMessage(ctx, groupID, userID, content)
}

func (s *ChatService) GetGroupMemberIDs(ctx context.Context, userID int64, groupID int64) ([]int64, error) {
	isMember, err := s.groupRepo.IsGroupMember(ctx, int(groupID), userID)
	if err != nil {
		return nil, err
	}
	if !isMember {
		return nil, ErrGroupMembershipRequired
	}

	return s.repo.GetGroupMemberIDs(ctx, groupID)
}
