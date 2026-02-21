package middleware

import (
	"context"
	"net/http"
	"social-network/internal/repositories"
)

// ContextKey type for context keys
type ContextKey string

const (
	UserIDKey         ContextKey = "userID"
	SessionCookieName            = "session_id"
)

// SessionMiddleware creates middleware that extracts user from session cookie
func SessionMiddleware(sessionRepo *repositories.SessionRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(SessionCookieName)
			if err != nil || cookie.Value == "" {
				next.ServeHTTP(w, r)
				return
			}

			session, err := sessionRepo.GetSession(r.Context(), cookie.Value)
			if err != nil {
				http.SetCookie(w, &http.Cookie{
					Name:     SessionCookieName,
					Value:    "",
					Path:     "/",
					MaxAge:   -1,
					HttpOnly: true,
				})
				next.ServeHTTP(w, r)
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, session.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAuth creates middleware that blocks unauthenticated requests
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserID(r.Context())
		if userID == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"success":false,"error":"authentication required"}`))
			return
		}
		next.ServeHTTP(w, r)
	})
}

// RequireAuthFunc is like RequireAuth but for http.HandlerFunc
func RequireAuthFunc(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID := GetUserID(r.Context())
		if userID == 0 {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"success":false,"error":"authentication required"}`))
			return
		}
		next(w, r)
	}
}

// GetUserID retrieves user ID from context
func GetUserID(ctx context.Context) int64 {
	userID, ok := ctx.Value(UserIDKey).(int64)
	if !ok {
		return 0
	}
	return userID
}

// IsAuthenticated checks if request has valid authentication
func IsAuthenticated(ctx context.Context) bool {
	return GetUserID(ctx) != 0
}
