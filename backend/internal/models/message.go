package models

import "time"

type Message struct {
	ID         int64     `json:"id"`
	SenderID   int64     `json:"senderId"`
	ReceiverID int64     `json:"receiverId"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"createdAt"`
}

type ConversationPreview struct {
	UserID        int64     `json:"userId"`
	FirstName     string    `json:"firstName"`
	LastName      string    `json:"lastName"`
	Nickname      string    `json:"nickname"`
	Avatar        string    `json:"avatar"`
	LastMessage   string    `json:"lastMessage"`
	LastSenderID  int64     `json:"lastSenderId"`
	LastMessageAt time.Time `json:"lastMessageAt"`
	UnreadCount   int       `json:"unreadCount"`
}
