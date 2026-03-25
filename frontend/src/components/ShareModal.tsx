import { X, Search, Send } from 'lucide-react';
import type { FollowerUser } from '../services/api';

interface ShareModalProps {
  onClose: () => void;
  users: FollowerUser[];
}

export default function ShareModal({ onClose, users }: ShareModalProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9998,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '560px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '20px 20px 0 0',
        zIndex: 9999,
        maxHeight: '75vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-color)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px 8px',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Share
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-secondary)', border: 'none', borderRadius: '50%',
              width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '4px 16px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            padding: '9px 14px',
            border: '1.5px solid var(--border-color)',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search..."
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '14px', color: 'var(--text-primary)', flex: 1,
              }}
            />
          </div>
        </div>

        {/* User grid */}
        <div style={{ overflowY: 'auto', padding: '4px 16px 28px', flex: 1 }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', paddingTop: '20px' }}>
              No users to show
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px',
            }}>
              {users.map(u => (
                <UserTile key={u.id} user={u} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function UserTile({ user }: { user: FollowerUser }) {
  const displayName = user.nickname || user.firstName;
  const avatarSrc = user.avatar || '/default.jpg';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '14px 8px', gap: '8px',
      borderRadius: 'var(--radius-md)',
      cursor: 'pointer',
      transition: 'background var(--transition-base)',
    }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={avatarSrc}
          alt={displayName}
          style={{
            width: '68px', height: '68px', borderRadius: '50%',
            objectFit: 'cover',
            border: '2.5px solid var(--border-color)',
          }}
        />
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: '22px', height: '22px', borderRadius: '50%',
          backgroundColor: 'var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg-primary)',
        }}>
          <Send size={10} color="white" />
        </div>
      </div>

      <span style={{
        fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)',
        textAlign: 'center', lineHeight: '1.3',
        maxWidth: '80px', overflow: 'hidden',
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
      }}>
        {displayName}
      </span>
    </div>
  );
}
