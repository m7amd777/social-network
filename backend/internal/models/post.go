package models

import(
	"time"
)

type Post struct {
	PostID      int64 `json:"postId"`
	UserID int64		`json:"userId"`
	ImagePath 	string `json:"imagePath"`
	Content string		`json:"content"`
	CreatdAt time.Time 		`json:"createdAt"`
}
