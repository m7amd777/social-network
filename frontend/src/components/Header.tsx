import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { userApi } from '../services/api';
import type { FollowerUser } from '../services/api';
import '../styles/components/Header.css';

interface HeaderProps {
  currentUser?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  onUserSelect?: (userId: number) => void;
}

export default function Header({ currentUser, onUserSelect }: HeaderProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FollowerUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const res = await userApi.searchUsers(query.trim());
      if (res.success) {
        setResults(res.data ?? []);
        setShowDropdown(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (user: FollowerUser) => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    onUserSelect?.(user.id);
  };

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
              placeholder="Search users..."
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            />
            {showDropdown && results.length > 0 && (
              <div className="search-dropdown">
                {results.map(user => (
                  <div
                    key={user.id}
                    className="search-result-item"
                    onMouseDown={() => handleSelect(user)}
                  >
                    <img
                      src={user.avatar || '/default.jpg'}
                      alt={user.firstName}
                      className="search-result-avatar"
                    />
                    <div>
                      <div className="search-result-name">
                        {user.firstName} {user.lastName}
                      </div>
                      {user.nickname && (
                        <div className="search-result-nickname">@{user.nickname}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showDropdown && query.trim() && results.length === 0 && (
              <div className="search-dropdown">
                <div className="search-no-results">No users found</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: User Avatar & Name */}
        <div className="header-user">
          <div
            className="user-button"
            onClick={() => currentUser && onUserSelect?.(Number(currentUser.id))}
            style={{ cursor: currentUser ? 'pointer' : 'default' }}
          >
            <img
              src={currentUser?.avatar || '/default.jpg'}
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
