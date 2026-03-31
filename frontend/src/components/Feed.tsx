import { useState, useEffect, useRef } from 'react';
import { Image, Globe, Users, Lock, X, ChevronDown, Check, Search } from 'lucide-react';
import PostCard from './PostCard';
import { postApi, userApi, type PostResponse, type FollowerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { validateImageFile, getImageUrl } from '../utils/image';
import '../styles/components/Feed.css';

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, desc: 'Everyone can see' },
  { value: 'followers', label: 'Followers', icon: Users, desc: 'Only your followers' },
  { value: 'custom', label: 'Private', icon: Lock, desc: 'Choose who sees it' },
] as const;

interface FeedProps {
  onUserClick?: (userId: number) => void;
}

export default function Feed({ onUserClick }: FeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // Create post state
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'followers' | 'custom'>('public');
  const [image, setImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [selectedViewers, setSelectedViewers] = useState<number[]>([]);
  const [viewerSearch, setViewerSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (privacy === 'custom' && user && followers.length === 0) {
      userApi.getUserFollowers(user.id).then(res => {
        if (res.success && res.data) setFollowers(res.data);
      });
    }
  }, [privacy, user]);

  const loadFeed = async () => {
    setFeedLoading(true);
    const res = await postApi.getFeed();
    if (res.success && res.data) setPosts(res.data);
    setFeedLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage('');
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleViewer = (id: number) => {
    setSelectedViewers(prev =>
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please write something before posting.');
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await postApi.createPost({
      content,
      image: image || undefined,
      privacy,
      viewers: privacy === 'custom' ? selectedViewers : undefined,
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setPosts(prev => [res.data!, ...prev]);
      setContent('');
      setImage('');
      setImagePreview('');
      setPrivacy('public');
      setSelectedViewers([]);
      setIsExpanded(false);
    } else {
      setError(typeof res.error === 'string' ? res.error : 'Failed to create post.');
    }
  };

  const currentPrivacy = PRIVACY_OPTIONS.find(o => o.value === privacy)!;
  const avatarSrc = getImageUrl(user?.avatar);

  return (
    <div style={{ flex: 1, width: '100%' }}>
      {/* Create Post Card */}
      <div className="card" style={{
        marginBottom: '24px',
        borderRadius: 'var(--radius-lg)',
        border: '2px solid var(--border-color)'
      }}>
        <div style={{ padding: '20px', background: 'var(--bg-gradient-yellow-soft)' }}>
          {/* Trigger row */}
          <div className="flex items-center gap-3">
            <img
              src={avatarSrc}
              alt="You"
              className="avatar-lg"
              style={{ border: '3px solid white', boxShadow: 'var(--shadow-md)', flexShrink: 0 }}
            />
            {!isExpanded ? (
              <div
                onClick={() => setIsExpanded(true)}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '15px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                What's on your mind?
              </div>
            ) : (
              <textarea
                autoFocus
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                placeholder="What's on your mind?"
                rows={3}
                style={{
                  flex: 1,
                  padding: '14px 20px',
                  border: '2px solid var(--accent-primary)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  backgroundColor: 'white',
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                  boxShadow: '0 0 0 3px rgba(46, 90, 167, 0.15)',
                  overflow: 'hidden',
                  minHeight: '80px',
                }}
              />
            )}
          </div>

          {/* Expanded controls */}
          {isExpanded && (
            <div style={{ marginTop: '16px' }}>
              {/* Image preview */}
              {imagePreview && (
                <div style={{ position: 'relative', marginBottom: '12px', display: 'inline-block' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{ maxHeight: '200px', maxWidth: '100%', borderRadius: 'var(--radius-md)', border: '2px solid var(--border-color)' }}
                  />
                  <button
                    onClick={removeImage}
                    style={{
                      position: 'absolute', top: '6px', right: '6px',
                      background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                      width: '24px', height: '24px', cursor: 'pointer', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Privacy custom viewer selector */}
              {privacy === 'custom' && (
                <div style={{
                  marginBottom: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', padding: '10px 12px 6px' }}>
                    Select followers who can see this post:
                  </p>
                  {/* Search bar */}
                  <div style={{ padding: '4px 10px 8px' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '7px 12px',
                      border: '1.5px solid var(--border-color)',
                    }}>
                      <Search size={13} color="var(--text-muted)" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={viewerSearch}
                        onChange={e => setViewerSearch(e.target.value)}
                        style={{
                          border: 'none', outline: 'none', background: 'transparent',
                          fontSize: '13px', color: 'var(--text-primary)', flex: 1,
                        }}
                      />
                    </div>
                  </div>
                  {followers.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '0 12px 10px' }}>You have no followers yet.</p>
                  ) : (
                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {followers.filter(f => {
                        const q = viewerSearch.toLowerCase();
                        return !q || `${f.firstName} ${f.lastName}`.toLowerCase().includes(q) || (f.nickname || '').toLowerCase().includes(q);
                      }).map(f => {
                        const selected = selectedViewers.includes(f.id);
                        const displayName = f.nickname || `${f.firstName} ${f.lastName}`.trim();
                        return (
                          <div
                            key={f.id}
                            onClick={() => toggleViewer(f.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              backgroundColor: selected ? 'var(--bg-secondary)' : 'transparent',
                              transition: 'background var(--transition-base)',
                            }}
                            onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
                            onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <img
                              src={getImageUrl(f.avatar)}
                              alt={displayName}
                              style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                objectFit: 'cover', flexShrink: 0,
                                border: selected ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                              }}
                            />
                            <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {displayName}
                            </span>
                            <div style={{
                              width: '22px', height: '22px', borderRadius: '50%',
                              border: selected ? 'none' : '2px solid var(--border-color)',
                              backgroundColor: selected ? 'var(--accent-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, transition: 'all var(--transition-base)',
                            }}>
                              {selected && <Check size={12} color="white" strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <p style={{ color: 'var(--accent-danger)', fontSize: '13px', marginBottom: '10px' }}>{error}</p>
              )}

              {/* Action bar */}
              <div className="flex items-center justify-between" style={{ paddingTop: '12px', borderTop: '2px solid var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  {/* Image upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      padding: '8px 14px', background: 'white',
                      border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    <Image size={16} />
                    <span>Photo/GIF</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.gif"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />

                  {/* Privacy dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowPrivacyDropdown(v => !v)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', background: 'white',
                        border: '2px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                        fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      <currentPrivacy.icon size={15} />
                      {currentPrivacy.label}
                      <ChevronDown size={13} />
                    </button>
                    {showPrivacyDropdown && (
                      <div style={{
                        position: 'absolute', bottom: 'calc(100% + 4px)', left: 0,
                        background: 'white', border: '2px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                        zIndex: 100, minWidth: '180px', overflow: 'hidden'
                      }}>
                        {PRIVACY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setPrivacy(opt.value);
                              setShowPrivacyDropdown(false);
                              if (opt.value !== 'custom') { setSelectedViewers([]); setViewerSearch(''); }
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              width: '100%', padding: '10px 14px', textAlign: 'left',
                              background: privacy === opt.value ? 'rgba(46,90,167,0.06)' : 'transparent',
                              border: 'none', cursor: 'pointer',
                              color: privacy === opt.value ? 'var(--accent-primary)' : 'var(--text-primary)'
                            }}
                          >
                            <opt.icon size={15} />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '600' }}>{opt.label}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{opt.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsExpanded(false); setContent(''); removeImage(); setError(''); }}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !content.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ opacity: submitting || !content.trim() ? 0.6 : 1 }}
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts Feed */}
      {feedLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--border-color)',
        }}>
          <div style={{
            fontSize: '56px',
            marginBottom: '16px',
            lineHeight: 1,
          }}>🌊</div>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}>
            Your feed is quiet
          </h3>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-muted)',
            margin: '0 0 24px',
            lineHeight: '1.6',
          }}>
            Follow people or share something to get started.
          </p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsExpanded(true)}
          >
            Create your first post
          </button>
        </div>
      ) : (
        posts.map(post => (
          <PostCard key={post.postId} post={post} onUserClick={onUserClick} />
        ))
      )}
    </div>
  );
}