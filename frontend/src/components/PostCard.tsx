import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="card animate-fadeIn" style={{ 
      marginBottom: '20px', 
      borderRadius: 'var(--radius-lg)',
      border: '2px solid var(--border-color)',
      backgroundColor: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      {/* Post Header */}
      <div style={{ 
        padding: '20px 20px 16px 20px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ position: 'relative' }}>
              <img 
                src={post.author.avatar || 'https://picsum.photos/seed/default/48/48.jpg'} 
                alt={post.author.firstName}
                className="avatar-lg"
                style={{ 
                  border: '3px solid white',
                  boxShadow: 'var(--shadow-md)'
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '14px',
                height: '14px',
                background: 'var(--accent-success)',
                border: '2px solid var(--bg-primary)',
                borderRadius: '50%'
              }} />
            </div>
            <div>
              <div style={{ 
                fontWeight: '700', 
                fontSize: '15px', 
                lineHeight: '1.2',
                color: 'var(--text-primary)'
              }}>
                {post.author.firstName} {post.author.lastName}
                {post.author.nickname && (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    marginLeft: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    @{post.author.nickname}
                  </span>
                )}
              </div>
              <div style={{ 
                fontSize: '13px', 
                color: 'var(--text-muted)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{timeAgo(post.createdAt)}</span>
                <span>•</span>
                <span style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {post.privacy}
                </span>
              </div>
            </div>
          </div>
          <button 
            className="btn-ghost" 
            style={{ 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              opacity: 0.6
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div style={{ padding: '0 20px 16px 20px' }}>
        <div style={{ 
          fontSize: '15px', 
          lineHeight: '1.6', 
          marginBottom: post.image ? '16px' : '0',
          color: 'var(--text-primary)'
        }}>
          {post.content}
        </div>
        
        {post.image && (
          <div style={{ 
            marginTop: '16px',
            borderRadius: 'var(--radius-md)', 
            overflow: 'hidden',
            border: '2px solid var(--border-color)'
          }}>
            <img 
              src={post.image} 
              alt="Post image" 
              style={{ 
                width: '100%', 
                display: 'block',
                maxHeight: '500px',
                objectFit: 'cover'
              }}
            />
          </div>
        )}
      </div>

      {/* Post Actions */}
      <div style={{ 
        padding: '12px 20px',
        borderTop: '2px solid var(--border-color)',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: post.isLiked ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                color: post.isLiked ? 'var(--accent-danger)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = post.isLiked 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'var(--bg-hover)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = post.isLiked 
                  ? 'rgba(239, 68, 68, 0.1)' 
                  : 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} strokeWidth={2.5} />
              <span>{post.likes}</span>
            </button>
            
            <button 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <MessageCircle size={18} strokeWidth={2.5} />
              <span>{post.comments.length}</span>
            </button>
            
            <button 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-base)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Share2 size={18} strokeWidth={2.5} />
              <span>Share</span>
            </button>
          </div>
          
          <button 
            style={{ 
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all var(--transition-base)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--accent-warning)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Bookmark size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Comments Preview */}
      {post.comments.length > 0 && (
        <div style={{ 
          padding: '16px 20px',
          borderTop: '2px solid var(--border-color)',
          background: 'var(--bg-primary)'
        }}>
          <button 
            style={{ 
              fontSize: '13px', 
              color: 'var(--text-muted)', 
              marginBottom: '12px',
              fontWeight: '600',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            View all {post.comments.length} comments
          </button>
          {post.comments.slice(0, 2).map(comment => (
            <div key={comment.id} style={{ 
              marginBottom: '10px',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px'
            }}>
              <span style={{ 
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {comment.author.firstName} {comment.author.lastName}
              </span>
              <span style={{ 
                marginLeft: '8px',
                color: 'var(--text-primary)'
              }}>
                {comment.content}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}