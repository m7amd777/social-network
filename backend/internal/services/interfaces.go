package services

import (
	"context"
	"social-network/internal/models"
)

type PostRepository interface {
	Create(ctx context.Context, post models.Post) (models.Post, error)
}
