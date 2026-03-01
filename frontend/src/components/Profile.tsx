import { useState, useEffect } from 'react';
import { Edit, Users, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import type { UserProfile, Post } from '../services/api';
import EditProfileModal from './EditProfile';
import FollowList from './FollowList';
import '../styles/components/Profile.css';

interface ProfileProps {
  onLogout?: () => void;
}

export default function Profile({ onLogout }: ProfileProps) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [profileRes, postsRes] = await Promise.all([
        userApi.getProfile(user.id),
        userApi.getUserPosts(user.id),
      ]);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
      } else {
        setError('Failed to load profile');
      }
      if (postsRes.success && postsRes.data) {
        setPosts(postsRes.data);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  const formatJoinDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return <div className="profile-container" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading profile...</div>;
  }

  if (error || !profile) {
    return <div className="profile-container" style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-danger)' }}>{error || 'Profile not found'}</div>;
  }

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
        </div>

        {/* Profile Info */}
        <div style={{ padding: '24px' }}>
          <div className="profile-header-content">
            {/* Profile Picture */}
            <div style={{ position: 'relative' }} className="profile-picture-wrapper">
              <img
                src={profile.avatar || '/default.jpg'}
                alt={profile.firstName}
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
            </div>

            {/* Profile Details */}
            <div className="profile-details">
              <div className="profile-name-section">
                <div>
                  <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '6px', color: 'var(--text-primary)' }}>
                    {profile.firstName} {profile.lastName}
                  </h2>
                  {profile.nickname && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '12px', fontWeight: '500' }}>
                      @{profile.nickname}
                    </div>
                  )}
                  <div className="profile-meta">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{profile.followerCount} followers</span>
                    </div>
                    <div className="flex items-center gap-2 hide-small-mobile">
                      <Calendar size={16} />
                      <span>Joined {formatJoinDate(profile.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn-secondary" onClick={() => setIsEditProfileModalOpen(true)} style={{ minWidth: '140px' }}>
                    <Edit size={18} />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    className="btn-ghost logout-profile-btn"
                    style={{ color: 'var(--accent-danger)', border: '2px solid var(--accent-danger)' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={18} />
                    <span className="hide-small-mobile">Logout</span>
                  </button>
                </div>
              </div>

              {/* Bio */}
              {profile.aboutMe && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {profile.aboutMe}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div className="profile-stats">
            <div className="stat-item">
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>{profile.postCount}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Posts</div>
            </div>
            <div className="stat-item" onClick={() => setFollowListType('followers')} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>{profile.followerCount}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Followers</div>
            </div>
            <div className="stat-item" onClick={() => setFollowListType('following')} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>{profile.followingCount}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Following</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ borderBottom: '2px solid var(--border-color)' }}>
          <div className="profile-tabs">
            <button className="tab-button active">Posts</button>
            <button className="tab-button hide-small-mobile">Photos</button>
            <button className="tab-button hide-small-mobile">Groups</button>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No posts yet.
        </div>
      ) : (
        posts.map(post => (
          <div key={post.postId} className="card" style={{ marginBottom: '20px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <img
                src={profile.avatar || '/default.jpg'}
                alt={profile.firstName}
                style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                  {profile.firstName} {profile.lastName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  <span style={{ textTransform: 'capitalize' }}>{post.privacy}</span>
                </div>
              </div>
            </div>

            {post.content && (
              <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-primary)', marginBottom: post.imagePath ? '12px' : '0' }}>
                {post.content}
              </p>
            )}

            {post.imagePath && (
              <img
                src={post.imagePath}
                alt="Post"
                style={{ width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: '500px' }}
              />
            )}
          </div>
        ))
      )}

      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        profile={profile}
        onSave={(updated) => setProfile(prev => prev ? { ...prev, ...updated } : prev)}
      />

      <FollowList
        isOpen={followListType !== null}
        onClose={() => setFollowListType(null)}
        userId={user!.id}
        type={followListType ?? 'followers'}
      />
    </div>
  );
}
