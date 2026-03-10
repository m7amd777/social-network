import { Home, Users, Calendar, User, Bell, MessageSquare, LogOut } from 'lucide-react';
import '../styles/components/Sidebar2.css';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'group-page', label: 'Group Page', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="sidebar-desktop">
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Navigation Menu */}
          <nav style={{ flex: 1 }}>
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className="sidebar-btn"
                  style={{
                    background: isActive ? 'var(--bg-gradient)' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-primary)',
                    fontWeight: isActive ? '700' : '500',
                    boxShadow: isActive ? 'var(--shadow-colored)' : 'none'
                  }}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div style={{ borderTop: '2px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
            <button
              className="sidebar-btn logout-btn"
              onClick={handleLogout}
            >
              <LogOut size={24} strokeWidth={2} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - TRULY FIXED */}
      <nav className="bottom-nav-fixed">
        <div className="bottom-nav-container">
          {menuItems.slice(0, 5).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className="bottom-nav-item"
                style={{
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                }}
                onClick={() => onTabChange(item.id)}
              >
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span style={{ fontWeight: isActive ? '700' : '500' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}