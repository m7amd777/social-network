package models

import "time"

type Group struct {
	ID          int64     `json:"id"`
	CreatorID   int64     `json:"creatorId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Image       string    `json:"image"`
	CreatedAt   time.Time `json:"createdAt"`
}

type GroupResponse struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Image       string     `json:"image"`
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
	Image       string `json:"image"`
}

type GroupData struct {
	Id          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedBy   string `json:"createdBy"`
	CreatedAt   string `json:"createdAt"`
	MemberCount string `json:"memberCount"`
}

type CreateGroupPostRequest struct {
	Content string `json:"content"`
	Image   string `json:"image"`
}

// ----------- IS THIS THE CORRECT DATA TYPE USGAE???
type CreateEventRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	EventTime   string `json:"eventTime"`
}

type RespondToEventRequest struct {
	Response string `json:"response"`
}

type EventUserResponse struct {
	UserID   int64      `json:"userId"`
	User     PostAuthor `json:"user"`
	Response string     `json:"response"`
}

type EventResponse struct {
	ID          int64               `json:"id"`
	GroupID     int64               `json:"groupId"`
	CreatorID   int64               `json:"creatorId"`
	Creator     PostAuthor          `json:"creator"`
	Title       string              `json:"title"`
	Description string              `json:"description"`
	EventTime   string              `json:"eventTime"`
	CreatedAt   string              `json:"createdAt"`
	Responses   []EventUserResponse `json:"responses"`
}

type GroupInvitation struct {
	ID        int64     `json:"id"`
	GroupID   int64     `json:"groupId"`
	InviterID int64     `json:"inviterId"`
	InviteeID int64     `json:"inviteeId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type JoinRequest struct {
	ID          int64     `json:"id"`
	GroupID     int64     `json:"groupId"`
	RequesterID int64     `json:"requesterId"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}
