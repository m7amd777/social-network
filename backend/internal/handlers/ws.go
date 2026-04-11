package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// hub holds a send channel for each connected user, keyed by userID.
var (
	hub   = make(map[int64]chan WSMessage)
	hubMu sync.Mutex
)

type WSMessage struct {
	Type            string `json:"type"`
	SenderID        int64  `json:"sender_id"`
	SenderFirstName string `json:"sender_first_name,omitempty"`
	SenderLastName  string `json:"sender_last_name,omitempty"`
	SenderNickname  string `json:"sender_nickname,omitempty"`
	SenderAvatar    string `json:"sender_avatar,omitempty"`
	ReceiverID      int64  `json:"receiver_id,omitempty"`
	GroupID         int64  `json:"group_id,omitempty"`
	Content         string `json:"content"`
	CreatedAt       string `json:"created_at"`
	// notification fields (type == "notification")
	NotifType   string `json:"notif_type,omitempty"`
	ActorName   string `json:"actor_name,omitempty"`
	ActorAvatar string `json:"actor_avatar,omitempty"`
	GroupName   string `json:"group_name,omitempty"`
}

// registerHub adds the user's send channel to the hub and returns a cleanup func
func registerHub(userID int64, send chan WSMessage) func() {
	hubMu.Lock()
	hub[userID] = send
	hubMu.Unlock()

	return func() {
		hubMu.Lock()
		delete(hub, userID)
		hubMu.Unlock()
	}
}

// delivers a message to a connected user and returns false if offline
func sendToUser(userID int64, msg WSMessage) bool {
	hubMu.Lock()
	ch, ok := hub[userID]
	hubMu.Unlock()
	if !ok {
		return false
	}
	select {
	case ch <- msg:
		return true
	default:
		return false
	}
}

// reads raw frames from conn, parses them, and delivers them on the returned channel.
func readLoop(conn *websocket.Conn) <-chan WSMessage {
	ch := make(chan WSMessage)
	go func() {
		defer close(ch)
		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				break
			}
			var msg WSMessage
			if err := json.Unmarshal(raw, &msg); err != nil {
				log.Println("ws unmarshal error:", err)
				continue
			}
			ch <- msg
		}
	}()
	return ch
}

// writeLoop drains send and writes each message to conn.
func writeLoop(conn *websocket.Conn, send <-chan WSMessage) {
	for msg := range send {
		if err := conn.WriteJSON(msg); err != nil {
			log.Println("ws write error:", err)
			return
		}
	}
}

// upgrades HTTP to ws , returns conn
func upgradeWS(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}
