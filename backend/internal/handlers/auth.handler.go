package handlers

import (
	"net/http"
)

type AuthHandler struct {
}

func NewAuthHandler(_ ...any) *AuthHandler {
	return &AuthHandler{}
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

func (h *AuthHandler) UpdatePrivacy(w http.ResponseWriter, r *http.Request) {
	notImplemented(w, r)
}

// func (h *AuthHandler) UploadAvatar(w http.ResponseWriter, r *http.Request) {
// 	notImplemented(w, r)
// }

// func (h *AuthHandler) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
// 	notImplemented(w, r)
// }
