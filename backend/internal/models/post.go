package models

import "time"

type Post struct {
	PostID    int64     `json:"postId"`
	UserID    int64     `json:"userId"`
	Content   string    `json:"content"`
	ImagePath string    `json:"imagePath"`
	Privacy   string    `json:"privacy"`
	CreatedAt time.Time `json:"createdAt"`
}

type Comment struct {
	CommentID int64     `json:"commentId"`
	PostID    int64     `json:"postId"`
	UserID    int64     `json:"userId"`
	Content   string    `json:"content"`
	ImagePath string    `json:"imagePath"`
	CreatedAt time.Time `json:"createdAt"`
}

type PostAuthor struct {
	ID        int64  `json:"id"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
}

type PostResponse struct {
	PostID       int64      `json:"postId"`
	Author       PostAuthor `json:"author"`
	Content      string     `json:"content"`
	Image        string     `json:"image,omitempty"`
	Privacy      string     `json:"privacy"`
	CreatedAt    time.Time  `json:"createdAt"`
	CommentCount int        `json:"commentCount"`
}

type CommentResponse struct {
	CommentID int64      `json:"commentId"`
	PostID    int64      `json:"postId"`
	Author    PostAuthor `json:"author"`
	Content   string     `json:"content"`
	Image     string     `json:"image,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

type CreatePostRequest struct {
	Content string  `json:"content"`
	Image   string  `json:"image"`
	Privacy string  `json:"privacy"`
	Viewers []int64 `json:"viewers"`
}

type CreateCommentRequest struct {
	Content string `json:"content"`
	Image   string `json:"image"`
}
