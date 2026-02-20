package services

type PostService struct {
	repo PostRepository
}

func NewPostService(postRepo PostRepository) *PostService {
	return &PostService{repo: postRepo}
}
