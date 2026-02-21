package handlers

import (
	"net/http"
	"social-network/internal/middleware"
	"social-network/internal/models"
	"social-network/internal/services"
	"social-network/internal/utils"
)

const (
	SessionCookieName = "session_id"
	SessionMaxAge     = 60 * 60 * 24 // 1 day in seconds
)

type AuthHandler struct {
	service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{service: service}
}

// Signup handles POST /api/signup
func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.service.Register(r.Context(), &req)
	if err != nil {
		if ve, ok := err.(*utils.ValidationError); ok {
			ValidationErrorResponse(w, ve.Fields)
			return
		}

		if err == services.ErrEmailTaken {
			ErrorResponse(w, http.StatusConflict, "email is already registered")
			return
		}

		ErrorResponse(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	SuccessResponse(w, http.StatusCreated, user.ToResponse())
}

// Login handles POST /api/login
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, session, err := h.service.Login(r.Context(), &req)
	if err != nil {
		if ve, ok := err.(*utils.ValidationError); ok {
			ValidationErrorResponse(w, ve.Fields)
			return
		}

		if err == services.ErrInvalidCredentials {
			ErrorResponse(w, http.StatusUnauthorized, "invalid email or password")
			return
		}

		ErrorResponse(w, http.StatusInternalServerError, "login failed")
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    session.ID,
		Path:     "/",
		MaxAge:   SessionMaxAge,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})

	SuccessResponse(w, http.StatusOK, user.ToResponse())
}

// Logout handles POST /api/logout
func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie(SessionCookieName)
	if err == nil && cookie.Value != "" {
		_ = h.service.Logout(r.Context(), cookie.Value)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     SessionCookieName,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})

	SuccessResponse(w, http.StatusOK, map[string]string{"message": "logged out"})
}

// GetMe handles GET /api/me
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == 0 {
		ErrorResponse(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	user, err := h.service.GetUserByID(r.Context(), userID)
	if err != nil {
		if err == services.ErrUserNotFound {
			ErrorResponse(w, http.StatusNotFound, "user not found")
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to get user")
		return
	}

	SuccessResponse(w, http.StatusOK, user.ToResponse())
}

// UpdateMe handles PATCH /api/me
func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == 0 {
		ErrorResponse(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req models.UpdateProfileRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.service.UpdateProfile(r.Context(), userID, &req)
	if err != nil {
		if ve, ok := err.(*utils.ValidationError); ok {
			ValidationErrorResponse(w, ve.Fields)
			return
		}
		ErrorResponse(w, http.StatusInternalServerError, "failed to update profile")
		return
	}

	SuccessResponse(w, http.StatusOK, user.ToResponse())
}

// UpdatePrivacy handles PATCH /api/me/privacy
func (h *AuthHandler) UpdatePrivacy(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == 0 {
		ErrorResponse(w, http.StatusUnauthorized, "not authenticated")
		return
	}

	var req models.UpdatePrivacyRequest
	if err := ParseJSON(r, &req); err != nil {
		ErrorResponse(w, http.StatusBadRequest, "invalid request body")
		return
	}

	err := h.service.UpdatePrivacy(r.Context(), userID, req.IsPrivate)
	if err != nil {
		ErrorResponse(w, http.StatusInternalServerError, "failed to update privacy")
		return
	}

	SuccessResponse(w, http.StatusOK, map[string]bool{"isPrivate": req.IsPrivate})
}
