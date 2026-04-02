import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import type { FollowerUser } from '../services/api';
import { getImageUrl } from '../utils/image';

interface ShareModalProps {
  onClose: () => void;
  users: FollowerUser[];
  onSend: (userIds: number[], message: string) => Promise<void>;
}

export default function ShareModal({ onClose, users, onSend }: ShareModalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const filtered = users.filter(u => {
    const name = (u.nickname || u.firstName + ' ' + u.lastName).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0 || sending) return;
    setSending(true);
    await onSend(Array.from(selected), message);
    setSending(false);
    setSent(true);
    setTimeout(onClose, 800);
  };

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

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '90%', maxWidth: '480px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: 'var(--radius-lg)',
        zIndex: 9999,
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>

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
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                fontSize: '14px', color: 'var(--text-primary)', flex: 1,
              }}
            />
          </div>
        </div>

        {/* User list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', paddingTop: '20px' }}>
              No users to show
            </p>
          ) : (
            filtered.map(u => (
              <UserRow
                key={u.id}
                user={u}
                selected={selected.has(u.id)}
                onToggle={() => toggle(u.id)}
              />
            ))
          )}
        </div>

        {/* Message + Send */}
        <div style={{
          padding: '10px 16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-primary)',
        }}>
          <input
            type="text"
            placeholder="Write a message..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{
              flex: 1,
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '10px 16px',
              fontSize: '14px',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-secondary)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={selected.size === 0 || sending}
            style={{
              backgroundColor: sent ? '#16a34a' : selected.size > 0 ? 'var(--accent-primary)' : 'var(--border-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: selected.size > 0 && !sending ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
              transition: 'background var(--transition-base)',
            }}
          >
            {sent ? 'Sent!' : sending ? 'Sending...' : `Send${selected.size > 1 ? ' Separately' : ''}`}
          </button>
        </div>
      </div>
    </>
  );
}

function UserRow({
  user,
  selected,
  onToggle,
}: {
  user: FollowerUser;
  selected: boolean;
  onToggle: () => void;
}) {
  const displayName = user.nickname || `${user.firstName} ${user.lastName}`.trim();
  const avatarSrc = getImageUrl(user.avatar);

  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 10px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'background var(--transition-base)',
        backgroundColor: selected ? 'var(--bg-secondary)' : 'transparent',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <img
        src={avatarSrc}
        alt={displayName}
        style={{
          width: '46px', height: '46px', borderRadius: '50%',
          objectFit: 'cover',
          border: selected ? '2.5px solid var(--accent-primary)' : '2px solid var(--border-color)',
          flexShrink: 0,
        }}
      />
      <span style={{
        flex: 1,
        fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)',
      }}>
        {displayName}
      </span>

      {/* Checkbox */}
      <div style={{
        width: '24px', height: '24px', borderRadius: '50%',
        border: selected ? 'none' : '2px solid var(--border-color)',
        backgroundColor: selected ? 'var(--accent-primary)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all var(--transition-base)',
      }}>
        {selected && <Check size={13} color="white" strokeWidth={3} />}
      </div>
    </div>
  );
}
