package models

type Notification struct {
	ID          int64  `json:"id"`
	UserID      int64  `json:"userId"`
	ActorID     int64  `json:"actorId"`
	ActorName   string `json:"actorName"`
	ActorAvatar string `json:"actorAvatar"`
	Type        string `json:"type"`
	ReferenceID int64  `json:"referenceId"`
	IsRead      bool   `json:"isRead"`
	CreatedAt   string `json:"createdAt"`
}
