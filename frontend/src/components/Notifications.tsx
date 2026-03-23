import { useState, useEffect, useCallback } from 'react';
import { notificationApi, followApi, groupInvitationApi, joinRequestApi } from '../services/api';
import type { NotificationResponse } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await notificationApi.getAll();
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: number) => {
    await notificationApi.markRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllRead = async () => {
    await notificationApi.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleAccept = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await followApi.accept(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const handleDecline = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await followApi.decline(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const handleAcceptGroupInvitation = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await groupInvitationApi.accept(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const handleDeclineGroupInvitation = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await groupInvitationApi.decline(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const handleAcceptJoinRequest = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await joinRequestApi.accept(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const handleDeclineJoinRequest = async (notif: NotificationResponse) => {
    setActioning(notif.id);
    await joinRequestApi.decline(notif.referenceId);
    await markRead(notif.id);
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setActioning(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request': return '👤';
      case 'follow_accepted': return '✅';
      case 'group_invitation': return '👥';
      case 'group_request': return '📨';
      case 'event_created': return '📅';
      case 'event_rsvp': return '🎟️';
      default: return '🔔';
    }
  };

  const getNotificationText = (notif: NotificationResponse) => {
    switch (notif.type) {
      case 'follow_request':
        return `${notif.actorName} wants to follow you`;
      case 'follow_accepted':
        return `${notif.actorName} accepted your follow request`;
      case 'group_invitation':
        return `${notif.actorName} invited you to a group`;
      case 'group_request':
        return `${notif.actorName} wants to join your group`;
      case 'event_created':
        return `${notif.actorName} created a new event`;
      case 'event_rsvp':
        return `${notif.actorName} responded to your event`;
      default:
        return `New notification from ${notif.actorName}`;
    }
  };

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        Loading notifications...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>Notifications</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              {unread.length} unread notification{unread.length !== 1 ? 's' : ''}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Unread */}
      {unread.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>New</h3>
          </div>
          {unread.map(notif => (
            <div
              key={notif.id}
              style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  fontSize: '24px', width: '40px', height: '40px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)', borderRadius: '50%',
                  flexShrink: 0,
                }}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', marginBottom: '4px' }}>
                    {getNotificationText(notif)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formatDate(notif.createdAt)}
                  </div>

                  {/* Action buttons for actionable notification types */}
                  {(notif.type === 'follow_request' || notif.type === 'group_invitation' || notif.type === 'group_request') && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button
                        disabled={actioning === notif.id}
                        onClick={() => {
                          if (notif.type === 'follow_request') handleAccept(notif);
                          else if (notif.type === 'group_invitation') handleAcceptGroupInvitation(notif);
                          else handleAcceptJoinRequest(notif);
                        }}
                        style={{
                          padding: '6px 16px', borderRadius: '8px', border: 'none',
                          background: 'var(--accent-color, #3b82f6)', color: '#fff',
                          cursor: 'pointer', fontSize: '13px', fontWeight: '500',
                        }}
                      >
                        Accept
                      </button>
                      <button
                        disabled={actioning === notif.id}
                        onClick={() => {
                          if (notif.type === 'follow_request') handleDecline(notif);
                          else if (notif.type === 'group_invitation') handleDeclineGroupInvitation(notif);
                          else handleDeclineJoinRequest(notif);
                        }}
                        style={{
                          padding: '6px 16px', borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'none', cursor: 'pointer', fontSize: '13px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>

                {/* Mark read button for non-actionable notifications */}
                {notif.type !== 'follow_request' && notif.type !== 'group_invitation' && notif.type !== 'group_request' && (
                  <button
                    onClick={() => markRead(notif.id)}
                    title="Mark as read"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div className="card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Earlier</h3>
          </div>
          {read.map(notif => (
            <div
              key={notif.id}
              style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', opacity: 0.7 }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  fontSize: '20px', width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)', borderRadius: '50%', flexShrink: 0,
                }}>
                  {getNotificationIcon(notif.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    {getNotificationText(notif)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDate(notif.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No notifications yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>When you get notifications, they'll appear here</p>
        </div>
      )}
    </div>
  );
}
