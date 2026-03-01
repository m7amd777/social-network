package models

import "time"

// User represents a user in the database
type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	FirstName    string    `json:"firstName"`
	LastName     string    `json:"lastName"`
	DateOfBirth  string    `json:"dateOfBirth"`
	Avatar       string    `json:"avatar"`
	Nickname     string    `json:"nickname"`
	AboutMe      string    `json:"aboutMe"`
	IsPrivate    bool      `json:"isPrivate"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// UserResponse is the safe response without password hash
type UserResponse struct {
	ID          int64     `json:"id"`
	Email       string    `json:"email"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	DateOfBirth string    `json:"dateOfBirth"`
	Avatar      string    `json:"avatar"`
	Nickname    string    `json:"nickname"`
	AboutMe     string    `json:"aboutMe"`
	IsPrivate   bool      `json:"isPrivate"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ToResponse converts User to UserResponse (excludes password)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:          u.ID,
		Email:       u.Email,
		FirstName:   u.FirstName,
		LastName:    u.LastName,
		DateOfBirth: u.DateOfBirth,
		Avatar:      u.Avatar,
		Nickname:    u.Nickname,
		AboutMe:     u.AboutMe,
		IsPrivate:   u.IsPrivate,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}

// RegisterRequest is the payload for user registration
type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	DateOfBirth string `json:"dateOfBirth"`
	Avatar      string `json:"avatar"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"aboutMe"`
}

// LoginRequest is the payload for user login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// UpdateProfileRequest is the payload for updating profile
type UpdateProfileRequest struct {
	FirstName   *string `json:"firstName"`
	LastName    *string `json:"lastName"`
	DateOfBirth *string `json:"dateOfBirth"`
	Avatar      *string `json:"avatar"`
	Nickname    *string `json:"nickname"`
	AboutMe     *string `json:"aboutMe"`
}

// UpdatePrivacyRequest is the payload for updating privacy setting
type UpdatePrivacyRequest struct {
	IsPrivate bool `json:"isPrivate"`
}

// for the profile
type UserProfile struct {
	ID             int64     `json:"id"`
	FirstName      string    `json:"firstName"`
	LastName       string    `json:"lastName"`
	Nickname       string    `json:"nickname"`
	AboutMe        string    `json:"aboutMe"`
	Avatar         string    `json:"avatar"`
	IsPrivate      bool      `json:"isPrivate"`
	CreatedAt      time.Time `json:"createdAt"`
	FollowerCount  int       `json:"followerCount"`
	FollowingCount int       `json:"followingCount"`
	PostCount      int       `json:"postCount"`
}

// FollowerUser is a slim user representation used in follower/following lists
type FollowerUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
}
