package handlers

import "net/http"

type PostHandler struct{}

func NewPostHandler(_ ...any) *PostHandler {
	return &PostHandler{}
}

func (h *PostHandler) GetFeed(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) GetPost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) UpdatePost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) DeletePost(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) GetComments(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) UploadMedia(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *PostHandler) GetMedia(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}
