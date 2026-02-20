package repositories

import (
	"context"
	"database/sql"
	"social-network/internal/models"
)

type PostRepo struct {
	db *sql.DB
}

func NewPostRepo(db *sql.DB) *PostRepo {
	return &PostRepo{db}
}

func (r *PostRepo) Create(ctx context.Context, post models.Post) (models.Post, error) {
	// SQL logic
	return post, nil
}
