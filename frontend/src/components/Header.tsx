import { Search } from 'lucide-react';
import '../styles/components/Header.css';

interface HeaderProps {
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export default function Header({ currentUser }: HeaderProps) {
  return (
    <header className="main-header">
      <div className="header-container">
        {/* Left: Logo */}
        <div className="header-logo">
          <h1 className="logo-text">
            Social Network
          </h1>
        </div>

        {/* Center: Search Bar */}
        <div className="header-search">
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={20} className="search-icon" />
            <input
              type="search"
              placeholder="Search posts, users, groups..."
              className="search-input"
              readOnly
            />
          </div>
        </div>

        {/* Right: User Avatar & Name */}
        <div className="header-user">
          <div className="user-button">
            <img 
              src={currentUser?.avatar || 'https://picsum.photos/seed/default/40/40.jpg'} 
              alt="User" 
              className="user-avatar"
            />
            <span className="user-name">
              {currentUser ? currentUser.firstName : 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}