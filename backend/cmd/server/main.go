package main

import (
	"log"
	"net/http"

	"social-network/internal/db"
	"social-network/internal/handlers"
	"social-network/internal/repositories"
	"social-network/internal/services"

	"github.com/gorilla/mux"
)

func main() {
	if err := db.Init("./social-network.db", "../internal/db/migrations/sqlite"); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}
	defer db.Close()

	r := mux.NewRouter()

	//example creation. creating a single post repository instance
	postRepo := repositories.NewPostRepo(db.DB)
	postServices := services.NewPostService(postRepo)
	postHandler := handlers.NewPostHandler(postServices)

	
	authHandler := handlers.NewAuthHandler()
	userHandler := handlers.NewUserHandler()

	followHandler := handlers.NewFollowHandler()
	groupHandler := handlers.NewGroupHandler()
	conversationHandler := handlers.NewConversationHandler()
	notificationHandler := handlers.NewNotificationHandler()
	// ===============================
	// AUTH ROUTES
	// ===============================

	// Register new user
	r.HandleFunc("/api/signup", authHandler.Signup).Methods("POST")

	// Login user (create session + cookie)
	r.HandleFunc("/api/login", authHandler.Login).Methods("POST")

	// Logout user (destroy session)
	r.HandleFunc("/api/logout", authHandler.Logout).Methods("POST")

	// Get current logged-in user
	r.HandleFunc("/api/me", authHandler.GetMe).Methods("GET")

	// Update current user profile info (nickname, about, etc.)
	r.HandleFunc("/api/me", authHandler.UpdateMe).Methods("PATCH")

	// Toggle public/private profile
	r.HandleFunc("/api/me/privacy", authHandler.UpdatePrivacy).Methods("PATCH")

	// Upload or replace avatar
	// r.HandleFunc("/api/me/avatar", authHandler.UploadAvatar).Methods("POST")

	// // Delete avatar
	// r.HandleFunc("/api/me/avatar", authHandler.DeleteAvatar).Methods("DELETE")

	// ===============================
	// USERS / PROFILE ROUTES
	// ===============================

	// List/search users
	r.HandleFunc("/api/users", userHandler.ListUsers).Methods("GET")

	// Get specific user profile (respect privacy rules)
	r.HandleFunc("/api/users/{userId}", userHandler.GetUserProfile).Methods("GET")

	// Get posts created by user
	r.HandleFunc("/api/users/{userId}/posts", userHandler.GetUserPosts).Methods("GET")

	// Get followers of user
	r.HandleFunc("/api/users/{userId}/followers", userHandler.GetFollowers).Methods("GET")

	// Get users that this user follows
	r.HandleFunc("/api/users/{userId}/following", userHandler.GetFollowing).Methods("GET")

	// Get relationship between current user and target user
	r.HandleFunc("/api/users/{userId}/relationship", userHandler.GetRelationship).Methods("GET")

	// ===============================
	// FOLLOW SYSTEM ROUTES
	// ===============================

	// Send follow request (auto-follow if profile is public)
	r.HandleFunc("/api/users/{userId}/follow-requests", followHandler.SendFollowRequest).Methods("POST")

	// Get incoming follow requests
	r.HandleFunc("/api/follow-requests", followHandler.GetIncomingRequests).Methods("GET")

	// Get sent follow requests
	r.HandleFunc("/api/follow-requests/sent", followHandler.GetSentRequests).Methods("GET")

	// Accept follow request
	r.HandleFunc("/api/follow-requests/{requestId}/accept", followHandler.AcceptRequest).Methods("POST")

	// Decline follow request
	r.HandleFunc("/api/follow-requests/{requestId}/decline", followHandler.DeclineRequest).Methods("POST")

	// Cancel sent follow request
	r.HandleFunc("/api/follow-requests/{requestId}", followHandler.CancelRequest).Methods("DELETE")

	// Unfollow user
	r.HandleFunc("/api/users/{userId}/follow", followHandler.Unfollow).Methods("DELETE")

	// ===============================
	// FEED + POSTS ROUTES
	// ===============================

	// Get main feed (posts visible to current user)
	r.HandleFunc("/api/feed", postHandler.GetFeed).Methods("GET")

	// Create new post
	r.HandleFunc("/api/posts", postHandler.CreatePost).Methods("POST")

	// Get single post
	r.HandleFunc("/api/posts/{postId}", postHandler.GetPost).Methods("GET")

	// Update post
	r.HandleFunc("/api/posts/{postId}", postHandler.UpdatePost).Methods("PATCH")

	// Delete post
	r.HandleFunc("/api/posts/{postId}", postHandler.DeletePost).Methods("DELETE")

	// Get comments of a post
	r.HandleFunc("/api/posts/{postId}/comments", postHandler.GetComments).Methods("GET")

	// Create comment on post
	r.HandleFunc("/api/posts/{postId}/comments", postHandler.CreateComment).Methods("POST")

	// Update comment
	r.HandleFunc("/api/comments/{commentId}", postHandler.UpdateComment).Methods("PATCH")

	// Delete comment
	r.HandleFunc("/api/comments/{commentId}", postHandler.DeleteComment).Methods("DELETE")

	// ===============================
	// MEDIA ROUTES
	// ===============================

	// Upload media (JPEG, PNG, GIF)
	r.HandleFunc("/api/media", postHandler.UploadMedia).Methods("POST")

	// Retrieve media file
	r.HandleFunc("/api/media/{mediaId}", postHandler.GetMedia).Methods("GET")

	// ===============================
	// GROUP ROUTES
	// ===============================

	// List/browse groups
	r.HandleFunc("/api/groups", groupHandler.ListGroups).Methods("GET")

	// Create new group
	r.HandleFunc("/api/groups", groupHandler.CreateGroup).Methods("POST")

	// Get single group details
	r.HandleFunc("/api/groups/{groupId}", groupHandler.GetGroup).Methods("GET")

	// Update group (creator only)
	r.HandleFunc("/api/groups/{groupId}", groupHandler.UpdateGroup).Methods("PATCH")

	// Delete group (creator only)
	r.HandleFunc("/api/groups/{groupId}", groupHandler.DeleteGroup).Methods("DELETE")

	// ===============================
	// GROUP MEMBERSHIP ROUTES
	// ===============================

	// Get group members
	r.HandleFunc("/api/groups/{groupId}/members", groupHandler.GetMembers).Methods("GET")

	// Leave group
	r.HandleFunc("/api/groups/{groupId}/leave", groupHandler.LeaveGroup).Methods("POST")

	// Remove member (creator/admin only)
	r.HandleFunc("/api/groups/{groupId}/members/{userId}", groupHandler.RemoveMember).Methods("DELETE")

	// ===============================
	// GROUP INVITATION ROUTES
	// ===============================

	// Invite user to group
	r.HandleFunc("/api/groups/{groupId}/invitations", groupHandler.InviteUser).Methods("POST")

	// Get my group invitations
	r.HandleFunc("/api/group-invitations", groupHandler.GetMyInvitations).Methods("GET")

	// Accept group invitation
	r.HandleFunc("/api/group-invitations/{invId}/accept", groupHandler.AcceptInvitation).Methods("POST")

	// Decline group invitation
	r.HandleFunc("/api/group-invitations/{invId}/decline", groupHandler.DeclineInvitation).Methods("POST")

	// Cancel invitation
	r.HandleFunc("/api/groups/{groupId}/invitations/{invId}", groupHandler.CancelInvitation).Methods("DELETE")

	// ===============================
	// GROUP JOIN REQUEST ROUTES
	// ===============================

	// Request to join group
	r.HandleFunc("/api/groups/{groupId}/join-requests", groupHandler.RequestToJoin).Methods("POST")

	// Get pending join requests (creator only)
	r.HandleFunc("/api/groups/{groupId}/join-requests", groupHandler.GetJoinRequests).Methods("GET")

	// Accept join request
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}/accept", groupHandler.AcceptJoinRequest).Methods("POST")

	// Decline join request
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}/decline", groupHandler.DeclineJoinRequest).Methods("POST")

	// Cancel join request
	r.HandleFunc("/api/groups/{groupId}/join-requests/{reqId}", groupHandler.CancelJoinRequest).Methods("DELETE")

	// ===============================
	// GROUP POSTS ROUTES
	// ===============================

	// Get group posts
	r.HandleFunc("/api/groups/{groupId}/posts", groupHandler.GetGroupPosts).Methods("GET")

	// Create group post
	r.HandleFunc("/api/groups/{groupId}/posts", groupHandler.CreateGroupPost).Methods("POST")

	// Get specific group post
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}", groupHandler.GetGroupPost).Methods("GET")

	// Delete group post
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}", groupHandler.DeleteGroupPost).Methods("DELETE")

	// Create comment on group post
	r.HandleFunc("/api/groups/{groupId}/posts/{postId}/comments", groupHandler.CreateGroupComment).Methods("POST")

	// ===============================
	// GROUP EVENT ROUTES
	// ===============================

	// Get group events
	r.HandleFunc("/api/groups/{groupId}/events", groupHandler.GetEvents).Methods("GET")

	// Create group event
	r.HandleFunc("/api/groups/{groupId}/events", groupHandler.CreateEvent).Methods("POST")

	// Get specific event
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}", groupHandler.GetEvent).Methods("GET")

	// Respond to event (Going / Not Going)
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}/respond", groupHandler.RespondToEvent).Methods("POST")

	// Get event responses
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}/responses", groupHandler.GetEventResponses).Methods("GET")

	// Delete event
	r.HandleFunc("/api/groups/{groupId}/events/{eventId}", groupHandler.DeleteEvent).Methods("DELETE")

	// ===============================
	// CONVERSATION (DM) ROUTES
	// ===============================

	// List conversations
	r.HandleFunc("/api/conversations", conversationHandler.ListConversations).Methods("GET")

	// Create conversation
	r.HandleFunc("/api/conversations", conversationHandler.CreateConversation).Methods("POST")

	// Get single conversation
	r.HandleFunc("/api/conversations/{convId}", conversationHandler.GetConversation).Methods("GET")

	// Get messages in conversation
	r.HandleFunc("/api/conversations/{convId}/messages", conversationHandler.GetMessages).Methods("GET")

	// Send message
	r.HandleFunc("/api/conversations/{convId}/messages", conversationHandler.SendMessage).Methods("POST")

	// Mark conversation as read
	r.HandleFunc("/api/conversations/{convId}/read", conversationHandler.MarkAsRead).Methods("POST")

	// Get unread conversation count
	r.HandleFunc("/api/conversations/unread-count", conversationHandler.GetUnreadCount).Methods("GET")

	// ===============================
	// GROUP CHAT ROUTES
	// ===============================

	// Get group chat messages
	r.HandleFunc("/api/groups/{groupId}/chat/messages", conversationHandler.GetGroupMessages).Methods("GET")

	// Send group chat message
	r.HandleFunc("/api/groups/{groupId}/chat/messages", conversationHandler.SendGroupMessage).Methods("POST")

	// ===============================
	// NOTIFICATION ROUTES
	// ===============================

	// Get notifications
	r.HandleFunc("/api/notifications", notificationHandler.GetNotifications).Methods("GET")

	// Mark single notification as read
	r.HandleFunc("/api/notifications/{id}/read", notificationHandler.MarkNotificationRead).Methods("POST")

	// Mark all notifications as read
	r.HandleFunc("/api/notifications/read-all", notificationHandler.MarkAllRead).Methods("POST")

	// Get unread notification count
	r.HandleFunc("/api/notifications/unread-count", notificationHandler.GetUnreadCount).Methods("GET")

	// ===============================
	// WEBSOCKET ROUTE
	// ===============================

	// WebSocket endpoint (DM + Group real-time messaging)
	r.HandleFunc("/ws", conversationHandler.HandleWebSocket)

	// ===============================
	// HEALTH CHECK ROUTE
	// ===============================

	log.Println("server starting on :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
