import { Image, Video, Calendar, Smile } from 'lucide-react';
import type { Post } from '../types';
import PostCard from './PostCard';
import { dummyPosts } from '../data/dummyData';
import '../styles/components/Feed.css';

interface FeedProps {
  posts?: Post[];
}

export default function Feed({ posts = dummyPosts }: FeedProps) {

  return (
    <div style={{ flex: 1, maxWidth: '680px', margin: '0 auto' }}>
      {/* Create Post */}
      <div className="card" style={{ 
        marginBottom: '24px',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '2px solid var(--border-color)'
      }}>
        <div style={{ padding: '20px', background: 'var(--bg-gradient-yellow-soft)' }}>
          <div className="flex items-center gap-3">
            <img 
              src="https://picsum.photos/seed/currentuser/48/48.jpg" 
              alt="Current user"
              className="avatar-lg"
              style={{ 
                border: '3px solid white',
                boxShadow: 'var(--shadow-md)'
              }}
            />
            <input
              type="text"
              placeholder="What's on your mind?"
              style={{
                flex: 1,
                padding: '14px 20px',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)',
                transition: 'all var(--transition-base)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(46, 90, 167, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <button 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'white',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                  e.currentTarget.style.color = 'var(--accent-secondary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Image size={18} />
                <span className="hide-small-mobile">Photo</span>
              </button>
              <button 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'white',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                  e.currentTarget.style.color = 'var(--accent-secondary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Video size={18} />
                <span className="hide-small-mobile">Video</span>
              </button>
              <button 
                className="hide-small-mobile"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'white',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                  e.currentTarget.style.color = 'var(--accent-secondary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Calendar size={18} />
                <span>Event</span>
              </button>
              <button 
                className="hide-small-mobile"
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  background: 'white',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-base)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-secondary)';
                  e.currentTarget.style.color = 'var(--accent-secondary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Smile size={18} />
                <span>Feeling</span>
              </button>
            </div>
            <button 
              className="btn-primary" 
              style={{ 
                fontSize: '14px', 
                padding: '10px 24px',
                fontWeight: '700'
              }}
            >
              Post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
        />
      ))}

      {/* Load More */}
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <button 
          className="btn-secondary" 
          style={{ 
            fontSize: '14px',
            fontWeight: '600',
            padding: '12px 32px'
          }}
        >
          Load More Posts
        </button>
      </div>
    </div>
  );
}