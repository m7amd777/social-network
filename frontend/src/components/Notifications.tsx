import { dummyNotifications } from '../data/dummyData';

export default function Notifications() {
  const unreadNotifications = dummyNotifications.filter(n => !n.isRead);
  const readNotifications = dummyNotifications.filter(n => n.isRead);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_request':
        return '👤';
      case 'group_invitation':
        return '👥';
      case 'group_request':
        return '📨';
      case 'event_created':
        return '📅';
      default:
        return '🔔';
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
            Notifications
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {unreadNotifications.length} unread notifications
          </p>
        </div>
      </div>

      {/* Unread Notifications */}
      {unreadNotifications.length > 0 && (
        <div className="card" style={{ marginBottom: '16px' }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
              New
            </h3>
          </div>
          {unreadNotifications.map(notification => (
            <div 
              key={notification.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)'
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '50%'
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: '600', 
                    marginBottom: '4px' 
                  }}>
                    {notification.title}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)', 
                    marginBottom: '8px' 
                  }}>
                    {notification.message}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-muted)' 
                  }}>
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Notifications */}
      {readNotifications.length > 0 && (
        <div className="card">
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600' }}>
              Earlier
            </h3>
          </div>
          {readNotifications.map(notification => (
            <div 
              key={notification.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                opacity: 0.7
              }}
            >
              <div className="flex items-center gap-3">
                <div style={{
                  fontSize: '20px',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '50%'
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    marginBottom: '4px' 
                  }}>
                    {notification.title}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-secondary)', 
                    marginBottom: '6px' 
                  }}>
                    {notification.message}
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--text-muted)' 
                  }}>
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {dummyNotifications.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
            No notifications yet
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            When you get notifications, they'll appear here
          </p>
        </div>
      )}
    </div>
  );
}
