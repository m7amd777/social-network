// WSMessage is the shared type for all WebSocket messages in the app.
// The single WS connection is owned by NotificationContext.
export type WSMessage = {
    type: 'message' | 'group_message' | 'notification';
    sender_id: number;
    sender_first_name?: string;
    sender_last_name?: string;
    sender_nickname?: string;
    sender_avatar?: string;
    receiver_id?: number;
    group_id?: number;
    content: string;
    created_at: string;
    // notification-type fields
    notif_type?: string;
    actor_name?: string;
    actor_avatar?: string;
};
