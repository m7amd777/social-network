import { useState } from 'react';
import { Edit, Camera, Users, MapPin, Calendar, Link as LinkIcon, LogOut } from 'lucide-react';
import { dummyUsers, dummyPosts } from '../data/dummyData';
import PostCard from './PostCard';
import EditProfileModal from './EditProfile';
import '../styles/components/Profile.css';

interface ProfileProps {
  onLogout?: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  // Static user data for UI demonstration
  const user = dummyUsers[0];
  const userPosts = dummyPosts.filter(post => post.authorId === user.id);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
        {/* Cover Photo */}
        <div style={{ 
          height: '220px', 
          background: 'var(--bg-gradient)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <button 
            className="btn-secondary"
            style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              padding: '10px 16px',
              gap: '8px'
            }}
          >
            <Camera size={18} />
            <span className="hide-small-mobile">Edit Cover</span>
          </button>
        </div>

        {/* Profile Info */}
        <div style={{ padding: '24px' }}>
          <div className="profile-header-content">
            {/* Profile Picture */}
            <div style={{ position: 'relative' }} className="profile-picture-wrapper">
              <img 
                src={user.avatar || 'https://picsum.photos/seed/default/128/128.jpg'} 
                alt={user.firstName}
                style={{ 
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  border: '6px solid var(--bg-primary)',
                  boxShadow: 'var(--shadow-lg)',
                  objectFit: 'cover',
                  marginTop: '-70px'
                }}
              />
              <button 
                className="btn-primary"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  padding: '8px',
                  borderRadius: '50%',
                  minWidth: 'auto',
                  height: 'auto'
                }}
              >
                <Camera size={16} />
              </button>
            </div>

            {/* Profile Details */}
            <div className="profile-details">
              <div className="profile-name-section">
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {user.firstName} {user.lastName}
                  </h2>
                  {user.nickname && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '12px', fontWeight: '500' }}>
                      @{user.nickname}
                    </div>
                  )}
                  <div className="profile-meta">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>1,234 followers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>San Francisco</span>
                    </div>
                    <div className="flex items-center gap-2 hide-small-mobile">
                      <Calendar size={16} />
                      <span>Joined January 2024</span>
                    </div>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn-secondary" onClick={() => setIsEditProfileModalOpen(true)}   style={{ minWidth: '140px' }} >
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                  <button className="btn-primary">
                    <span>Follow</span>
                  </button>
                  <button 
                    className="btn-ghost logout-profile-btn"
                    style={{ 
                      color: 'var(--accent-danger)',
                      border: '2px solid var(--accent-danger)'
                    }}
                    onClick={() => {
                      localStorage.removeItem('token');
                      if (onLogout) {
                        onLogout();
                      }
                    }}
                  >
                    <LogOut size={18} />
                    <span className="hide-small-mobile">Logout</span>
                  </button>
                </div>
              </div>

              {/* Bio */}
              {user.aboutMe && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {user.aboutMe}
                  </p>
                </div>
              )}

              {/* Links */}
              <div style={{ marginTop: '16px' }}>
                <div className="flex items-center gap-2" style={{ color: 'var(--accent-primary)' }}>
                  <LinkIcon size={16} />
                  <a href="#" style={{ fontSize: '15px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>
                    portfolio.example.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div className="profile-stats">
            <div className="stat-item">
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>{userPosts.length}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Posts</div>
            </div>
            <div className="stat-item">
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>1,234</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Followers</div>
            </div>
            <div className="stat-item">
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>567</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Following</div>
            </div>
            <div className="stat-item hide-small-mobile">
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>12</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Groups</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ borderBottom: '2px solid var(--border-color)' }}>
          <div className="profile-tabs">
            <button className="tab-button active">
              Posts
            </button>
            <button className="tab-button">
              About
            </button>
            <button className="tab-button hide-small-mobile">
              Photos
            </button>
            <button className="tab-button hide-small-mobile">
              Groups
            </button>
            <button className="tab-button hide-small-mobile">
              Saved
            </button>
          </div>
        </div>
      </div>

      {/* User Posts */}
      {userPosts.map(post => (
        <PostCard
          key={post.id}
          post={post}
        />
      ))}

      <EditProfileModal 
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
      />
    </div>
  );
}