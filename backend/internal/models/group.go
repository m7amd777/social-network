package models

type GroupData struct {
	Id          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	CreatedBy   string `json:"createdBy"`
	CreatedAt   string `json:"createdAt"`
	MemberCount string `json:"memberCount"`
}

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
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
