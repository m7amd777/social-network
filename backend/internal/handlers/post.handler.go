package handlers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"social-network/internal/middleware"
	"social-network/internal/models"
	"social-network/internal/services"
	"social-network/internal/utils"
)

type PostHandler struct {
	service *services.PostService
}

func NewPostHandler(postService *services.PostService) *PostHandler {
	return &PostHandler{service: postService}
}

func (h *PostHandler) GetFeed(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	posts, err := h.service.GetFeed(r.Context(), userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get feed")
		return
	}
	if posts == nil {
		posts = []models.PostResponse{}
	}
	SuccessResponse(w, http.StatusOK, posts)
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req models.CreatePostRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	post, err := h.service.CreatePost(r.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, utils.ErrImageTooLarge) || errors.Is(err, utils.ErrImageTooSmall) || errors.Is(err, utils.ErrInvalidImageType) || errors.Is(err, utils.ErrInvalidBase64Format) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		if err == services.ErrInvalidPrivacy {
			ErrorResponse(w, http.StatusBadRequest, "invalid privacy setting")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create post")
		return
	}
	SuccessResponse(w, http.StatusCreated, post)
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
	vars := mux.Vars(r)
	postID, err := strconv.ParseInt(vars["postId"], 10, 64)
	if err != nil || postID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid post id")
		return
	}

	comments, err := h.service.GetComments(r.Context(), postID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to get comments")
		return
	}
	if comments == nil {
		comments = []models.CommentResponse{}
	}
	SuccessResponse(w, http.StatusOK, comments)
}

func (h *PostHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	vars := mux.Vars(r)
	postID, err := strconv.ParseInt(vars["postId"], 10, 64)
	if err != nil || postID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid post id")
		return
	}

	var req models.CreateCommentRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	comment, err := h.service.CreateComment(r.Context(), postID, userID, &req)
	if err != nil {
		if errors.Is(err, utils.ErrImageTooLarge) || errors.Is(err, utils.ErrImageTooSmall) || errors.Is(err, utils.ErrInvalidImageType) || errors.Is(err, utils.ErrInvalidBase64Format) {
			ErrorResponse(w, http.StatusBadRequest, err.Error())
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to create comment")
		return
	}
	SuccessResponse(w, http.StatusCreated, comment)
}

func (h *PostHandler) LikePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	postID, err := strconv.ParseInt(vars["postId"], 10, 64)
	if err != nil || postID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid post id")
		return
	}
	count, liked, err := h.service.LikePost(r.Context(), postID, userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to like post")
		return
	}
	SuccessResponse(w, http.StatusOK, map[string]interface{}{"likeCount": count, "isLikedByViewer": liked})
}

func (h *PostHandler) UnlikePost(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	vars := mux.Vars(r)
	postID, err := strconv.ParseInt(vars["postId"], 10, 64)
	if err != nil || postID <= 0 {
		ErrorResponse(w, http.StatusBadRequest, "invalid post id")
		return
	}
	count, liked, err := h.service.UnlikePost(r.Context(), postID, userID)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to unlike post")
		return
	}
	SuccessResponse(w, http.StatusOK, map[string]interface{}{"likeCount": count, "isLikedByViewer": liked})
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
