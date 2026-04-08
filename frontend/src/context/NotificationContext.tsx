import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { notificationApi, chatApi } from '../services/api';
import type { WSMessage } from '../hooks/useWebSocket';
import NotificationToast, { type ToastNotif } from '../components/NotificationToast';

type NotificationContextType = {
  unreadCount: number;
  unreadMessages: number;
  refreshCount: () => void;
  refreshMessages: () => void;
  sendWS: (msg: Omit<WSMessage, 'sender_id' | 'created_at'>) => void;
  onWSMessage: (handler: (msg: WSMessage) => void) => () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  unreadMessages: 0,
  refreshCount: () => {},
  refreshMessages: () => {},
  sendWS: () => {},
  onWSMessage: () => () => {},
});

function getToastContent(notifType: string, actorName: string): { icon: string; text: string } {
  switch (notifType) {
    case 'chat_message':
      return { icon: '💬', text: `${actorName} sent you a message` };
    case 'follow_request':
      return { icon: '👤', text: `${actorName} wants to follow you` };
    case 'follow_accepted':
      return { icon: '✅', text: `${actorName} accepted your follow request` };
    case 'group_invitation':
      return { icon: '👥', text: `${actorName} invited you to a group` };
    case 'group_request':
      return { icon: '📨', text: `${actorName} wants to join your group` };
    case 'event_created':
      return { icon: '📅', text: `${actorName} created a new event` };
    case 'event_rsvp':
      return { icon: '🎟️', text: `${actorName} responded to your event` };
    case 'member_left':
      return { icon: '🚪', text: `${actorName} left your group` };
    default:
      return { icon: '🔔', text: `New notification from ${actorName}` };
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [toasts, setToasts] = useState<ToastNotif[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(msg: WSMessage) => void>>(new Set());
  const toastIdRef = useRef(0);
  const setUnreadCountRef = useRef(setUnreadCount);
  const setToastsRef = useRef(setToasts);
  const setUnreadMessagesRef = useRef(setUnreadMessages);

  const refreshCount = useCallback(async () => {
    const res = await notificationApi.getUnreadCount();
    if (res.success && res.data != null) {
      setUnreadCountRef.current((res.data as { count: number }).count);
    }
  }, []);

  const refreshMessages = useCallback(async () => {
    const res = await chatApi.listConversations();
    if (res.success && res.data != null) {
      const total = res.data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
      setUnreadMessagesRef.current(total);
    }
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    refreshCount();
    refreshMessages();
    const interval = setInterval(() => { refreshCount(); refreshMessages(); }, 30_000);
    return () => clearInterval(interval);
  }, [refreshCount, refreshMessages]);

  // WS connection — runs once on mount, never reconnects due to dependency changes
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://localhost:8081/ws`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg: WSMessage = JSON.parse(e.data);

        if (msg.type === 'notification') {
          notificationApi.getUnreadCount().then(res => {
            if (res.success && res.data != null) {
              setUnreadCountRef.current((res.data as { count: number }).count);
            }
          });
          chatApi.listConversations().then(res => {
            if (res.success && res.data != null) {
              const total = res.data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
              setUnreadMessagesRef.current(total);
            }
          });

          const notifType = msg.notif_type ?? 'chat_message';
          const actorName = msg.actor_name ?? 'Someone';
          const { icon, text } = getToastContent(notifType, actorName);
          const id = ++toastIdRef.current;
          setToastsRef.current(prev => [...prev, { id, icon, text, avatar: msg.actor_avatar }]);
        }

        if (msg.type === 'message' || msg.type === 'group_message') {
          chatApi.listConversations().then(res => {
            if (res.success && res.data != null) {
              const total = res.data.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
              setUnreadMessagesRef.current(total);
            }
          });
        }

        listenersRef.current.forEach((fn) => fn(msg));
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []); // empty deps — only runs once

  const sendWS = useCallback(
    (msg: Omit<WSMessage, 'sender_id' | 'created_at'>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      }
    },
    []
  );

  const onWSMessage = useCallback((handler: (msg: WSMessage) => void) => {
    listenersRef.current.add(handler);
    return () => listenersRef.current.delete(handler);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, unreadMessages, refreshCount, refreshMessages, sendWS, onWSMessage }}>
      {children}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
