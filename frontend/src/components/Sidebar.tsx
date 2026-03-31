import { Home, Users, User, Bell, MessageSquare, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/components/Sidebar2.css';

interface SidebarProps {
  onLogout?: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: typeof Home;
  path: string;
};

export default function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/feed' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
    { id: 'groups', label: 'Groups', icon: Users, path: '/groups' },
  ] satisfies MenuItem[];

  const activeTab = menuItems.find(item => {
    if (item.id === 'home') {
      return location.pathname === '/' || location.pathname.startsWith('/feed');
    }
    if (item.id === 'profile') {
      return location.pathname.startsWith('/profile');
    }
    if (item.id === 'groups') {
      return location.pathname.startsWith('/groups');
    }
    return location.pathname === item.path;
  })?.id;

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
                  onClick={() => navigate(item.path)}
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
                onClick={() => navigate(item.path)}
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