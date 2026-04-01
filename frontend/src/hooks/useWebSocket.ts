import { useEffect, useRef, useCallback } from 'react';

export type WSMessage = {
    type: 'message';
    sender_id: number;
    receiver_id: number;
    content: string;
    created_at: string;
};

export function useWebSocket(onMessage: (msg: WSMessage) => void) {
    const wsRef = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);

    // keep the callback ref current without reconnecting
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://localhost:8081/ws`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const msg: WSMessage = JSON.parse(e.data);
                onMessageRef.current(msg);
            } catch {
                console.error('ws parse error');
            }
        };

        ws.onclose = () => {
            //  reconnect after 2s
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    // trigger re-mount by re-running the effect
                }
            }, 2000);
        };

        return () => ws.close();
    }, []); // only runs once on mount

    const sendMessage = useCallback((msg: Omit<WSMessage, 'sender_id' | 'created_at'>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { sendMessage };
}