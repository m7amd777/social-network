package main

import (
	"log"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"social-network/internal/db"
	"social-network/internal/handlers"
	"social-network/internal/middleware"
	"social-network/internal/repositories"
	"social-network/internal/services"
	"social-network/internal/utils"

	"github.com/gorilla/mux"
)

func main() {
	// ===============================
	// DATABASE INITIALIZATION
	// ===============================
	if err := db.Init("./social-network.db", "../../internal/db/migrations/sqlite"); err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}
	defer db.Close()

	// ===============================
	// DEPENDENCY INJECTION
	// ===============================

	// Repositories
	authRepo := repositories.NewAuthRepo(db.DB)
	sessionRepo := repositories.NewSessionRepo(db.DB)
	postRepo := repositories.NewPostRepo(db.DB)
	userRepo := repositories.NewUserRepo(db.DB)
	followRepo := repositories.NewFollowRepo(db.DB)
	notifRepo := repositories.NewNotificationRepo(db.DB)
	groupRepo := repositories.NewGroupRepo(db.DB)
	chatRepo := repositories.NewChatRepo(db.DB)

	// Services
	authService := services.NewAuthService(authRepo, sessionRepo)
	postService := services.NewPostService(postRepo)
	userService := services.NewUserService(userRepo)
	notifService := services.NewNotificationService(notifRepo)
	followService := services.NewFollowService(followRepo, notifService)
	groupService := services.NewGroupService(groupRepo, notifService)
	chatService := services.NewChatService(chatRepo, groupRepo)

	// Handlers
	authHandler := handlers.NewAuthHandler(authService)
	postHandler := handlers.NewPostHandler(postService)
	userHandler := handlers.NewUserHandler(userService, postService, followService)
	followHandler := handlers.NewFollowHandler(followService)
	groupHandler := handlers.NewGroupHandler(groupService)
	conversationHandler := handlers.NewConversationHandler(chatService)
	notificationHandler := handlers.NewNotificationHandler(notifService)

	// ===============================
	// ROUTER SETUP
	// ===============================
	r := mux.NewRouter()

	// Apply global middleware
	r.Use(middleware.CORSMiddleware)
	r.Use(middleware.SessionMiddleware(sessionRepo))

	// ===============================
	// PUBLIC ROUTES (No auth required)
	// ===============================
	r.HandleFunc("/api/signup", authHandler.Signup).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/login", authHandler.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/logout", authHandler.Logout).Methods("POST", "OPTIONS")

	// ===============================
	// PROTECTED ROUTES (Auth required)
	// ===============================

	// Auth routes
	r.HandleFunc("/api/me", middleware.RequireAuthFunc(authHandler.GetMe)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/me", middleware.RequireAuthFunc(authHandler.UpdateMe)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/me/privacy", middleware.RequireAuthFunc(authHandler.UpdatePrivacy)).Methods("PATCH", "OPTIONS")

	// User routes
	r.HandleFunc("/api/users", middleware.RequireAuthFunc(userHandler.ListUsers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/suggested", middleware.RequireAuthFunc(userHandler.GetSuggestedUsers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{userId}", middleware.RequireAuthFunc(userHandler.GetUserProfile)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{userId}/posts", middleware.RequireAuthFunc(userHandler.GetUserPosts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{userId}/followers", middleware.RequireAuthFunc(userHandler.GetFollowers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{userId}/following", middleware.RequireAuthFunc(userHandler.GetFollowing)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/users/{userId}/relationship", middleware.RequireAuthFunc(userHandler.GetRelationship)).Methods("GET", "OPTIONS")

	// Follow routes
	r.HandleFunc("/api/users/{userId}/follow-requests", middleware.RequireAuthFunc(followHandler.SendFollowRequest)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/follow-requests", middleware.RequireAuthFunc(followHandler.GetIncomingRequests)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/follow-requests/sent", middleware.RequireAuthFunc(followHandler.GetSentRequests)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/follow-requests/{requestId}/accept", middleware.RequireAuthFunc(followHandler.AcceptRequest)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/follow-requests/{requestId}/decline", middleware.RequireAuthFunc(followHandler.DeclineRequest)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/follow-requests/{requestId}", middleware.RequireAuthFunc(followHandler.CancelRequest)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/users/{userId}/follow", middleware.RequireAuthFunc(followHandler.Unfollow)).Methods("DELETE", "OPTIONS")

	// Post routes
	r.HandleFunc("/api/feed", middleware.RequireAuthFunc(postHandler.GetFeed)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/posts", middleware.RequireAuthFunc(postHandler.CreatePost)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}", middleware.RequireAuthFunc(postHandler.GetPost)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}", middleware.RequireAuthFunc(postHandler.UpdatePost)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}", middleware.RequireAuthFunc(postHandler.DeletePost)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}/comments", middleware.RequireAuthFunc(postHandler.GetComments)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}/comments", middleware.RequireAuthFunc(postHandler.CreateComment)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}/like", middleware.RequireAuthFunc(postHandler.LikePost)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/posts/{postId}/like", middleware.RequireAuthFunc(postHandler.UnlikePost)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/comments/{commentId}", middleware.RequireAuthFunc(postHandler.UpdateComment)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/comments/{commentId}", middleware.RequireAuthFunc(postHandler.DeleteComment)).Methods("DELETE", "OPTIONS")

	// Media routes
	r.HandleFunc("/api/media", middleware.RequireAuthFunc(postHandler.UploadMedia)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/media/{mediaId}", middleware.RequireAuthFunc(postHandler.GetMedia)).Methods("GET", "OPTIONS")

	// Group routes
	r.HandleFunc("/api/groups", middleware.RequireAuthFunc(groupHandler.ListGroups)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups", middleware.RequireAuthFunc(groupHandler.CreateGroup)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}", middleware.RequireAuthFunc(groupHandler.GetGroup)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}", middleware.RequireAuthFunc(groupHandler.UpdateGroup)).Methods("PATCH", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}", middleware.RequireAuthFunc(groupHandler.DeleteGroup)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/members", middleware.RequireAuthFunc(groupHandler.GetMembers)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/leave", middleware.RequireAuthFunc(groupHandler.LeaveGroup)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/members/{userId}", middleware.RequireAuthFunc(groupHandler.RemoveMember)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/invitations", middleware.RequireAuthFunc(groupHandler.InviteUser)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/group-invitations", middleware.RequireAuthFunc(groupHandler.GetMyInvitations)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/group-invitations/{invId}/accept", middleware.RequireAuthFunc(groupHandler.AcceptInvitation)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/group-invitations/{invId}/decline", middleware.RequireAuthFunc(groupHandler.DeclineInvitation)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/invitations/{invId}", middleware.RequireAuthFunc(groupHandler.CancelInvitation)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/join-requests", middleware.RequireAuthFunc(groupHandler.RequestToJoin)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/join-requests", middleware.RequireAuthFunc(groupHandler.GetJoinRequests)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}/accept", middleware.RequireAuthFunc(groupHandler.AcceptJoinRequest)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}/decline", middleware.RequireAuthFunc(groupHandler.DeclineJoinRequest)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}", middleware.RequireAuthFunc(groupHandler.CancelJoinRequest)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/join-requests/{reqId}/accept", middleware.RequireAuthFunc(groupHandler.AcceptJoinRequestDirect)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/join-requests/{reqId}/decline", middleware.RequireAuthFunc(groupHandler.DeclineJoinRequestDirect)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/posts", middleware.RequireAuthFunc(groupHandler.GetGroupPosts)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/posts", middleware.RequireAuthFunc(groupHandler.CreateGroupPost)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}", middleware.RequireAuthFunc(groupHandler.GetGroupPost)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}", middleware.RequireAuthFunc(groupHandler.DeleteGroupPost)).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}/comments", middleware.RequireAuthFunc(groupHandler.CreateGroupComment)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events", middleware.RequireAuthFunc(groupHandler.GetEvents)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events", middleware.RequireAuthFunc(groupHandler.CreateEvent)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}", middleware.RequireAuthFunc(groupHandler.GetEvent)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}/respond", middleware.RequireAuthFunc(groupHandler.RespondToEvent)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}/responses", middleware.RequireAuthFunc(groupHandler.GetEventResponses)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}", middleware.RequireAuthFunc(groupHandler.DeleteEvent)).Methods("DELETE", "OPTIONS")

	// Conversation routes
	r.HandleFunc("/api/conversations", middleware.RequireAuthFunc(conversationHandler.ListConversations)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/conversations", middleware.RequireAuthFunc(conversationHandler.CreateConversation)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/conversations/{convId}", middleware.RequireAuthFunc(conversationHandler.GetConversation)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/conversations/{convId}/messages", middleware.RequireAuthFunc(conversationHandler.GetMessages)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/conversations/{convId}/messages", middleware.RequireAuthFunc(conversationHandler.SendMessage)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/conversations/{convId}/read", middleware.RequireAuthFunc(conversationHandler.MarkAsRead)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/conversations/unread-count", middleware.RequireAuthFunc(conversationHandler.GetUnreadCount)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/group-conversations", middleware.RequireAuthFunc(conversationHandler.ListGroupConversations)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/chat/messages", middleware.RequireAuthFunc(conversationHandler.GetGroupMessages)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/groups/{groupId}/chat/messages", middleware.RequireAuthFunc(conversationHandler.SendGroupMessage)).Methods("POST", "OPTIONS")

	// Notification routes
	r.HandleFunc("/api/notifications", middleware.RequireAuthFunc(notificationHandler.GetNotifications)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/notifications/{id}/read", middleware.RequireAuthFunc(notificationHandler.MarkNotificationRead)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/notifications/read-all", middleware.RequireAuthFunc(notificationHandler.MarkAllRead)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/notifications/unread-count", middleware.RequireAuthFunc(notificationHandler.GetUnreadCount)).Methods("GET", "OPTIONS")

	// WebSocket (needs auth check inside handler)
	r.HandleFunc("/ws", conversationHandler.HandleWebSocket)

	// ===============================
	// STATIC FILE SERVING (Uploads)
	// ===============================
	// Serve uploaded images from /uploads directory with caching headers
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", cachedFileServer(http.Dir("./uploads"))))

	// ===============================
	// START SERVER
	// ===============================
	// cleaning up old events
	log.Println("cleanin up events")
	utils.StartEventCleanup(groupRepo, 1*time.Hour)

	log.Println("Server starting on :8081")
	if err := http.ListenAndServe(":8081", r); err != nil {
		log.Fatalf("server error: %v", err)
	}

}

// cachedFileServer wraps http.FileServer to add caching headers for immutable uploaded files
func cachedFileServer(root http.FileSystem) http.Handler {
	fileServer := http.FileServer(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers for uploads (needed for cross-origin image requests)
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Set cache headers - images are immutable (UUID filenames)
		// Cache for 1 year (31536000 seconds)
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")

		// Set Content-Type based on file extension
		ext := strings.ToLower(filepath.Ext(r.URL.Path))
		switch ext {
		case ".jpg", ".jpeg":
			w.Header().Set("Content-Type", "image/jpeg")
		case ".png":
			w.Header().Set("Content-Type", "image/png")
		case ".gif":
			w.Header().Set("Content-Type", "image/gif")
		}

		fileServer.ServeHTTP(w, r)
	})
}
