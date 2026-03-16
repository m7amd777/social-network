package models

// FollowRequestRow is the raw DB row for a follow request.
type FollowRequestRow struct {
	ID          int64  `json:"id"`
	RequesterID int64  `json:"requesterId"`
	TargetID    int64  `json:"targetId"`
	Status      string `json:"status"`
}

// FollowRequestResponse is the API response for a follow request with requester/target user info.
type FollowRequestResponse struct {
	ID          int64  `json:"id"`
	RequesterID int64  `json:"requesterId"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Nickname    string `json:"nickname"`
	Avatar      string `json:"avatar"`
	CreatedAt   string `json:"createdAt"`
}
