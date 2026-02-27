package models

import(
	"time"
)

type Post struct {
	PostID    int64     `json:"postId"`
	UserID    int64     `json:"userId"`
	Content   string    `json:"content"`
	ImagePath string    `json:"imagePath"`
	Privacy   string    `json:"privacy"`
	CreatedAt time.Time `json:"createdAt"`
}
