package models

import "time"

type Group struct {
	ID          int64     `json:"id"`
	CreatorID   int64     `json:"creatorId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
}

type GroupResponse struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	CreatorID   int64      `json:"creatorId"`
	Creator     PostAuthor `json:"creator"`
	MemberCount int        `json:"memberCount"`
	IsMember    bool       `json:"isMember"`
	IsOwner     bool       `json:"isOwner"`
	CreatedAt   time.Time  `json:"createdAt"`
}

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}
