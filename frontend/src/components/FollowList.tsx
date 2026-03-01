import { useState, useEffect } from 'react';
import { userApi } from '../services/api';
import type { FollowerUser } from '../services/api';
import Modal from './Modal';

interface FollowListProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  type: 'followers' | 'following';
}

export default function FollowList({ isOpen, onClose, userId, type }: FollowListProps) {
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      const response = type === 'followers'
        ? await userApi.getUserFollowers(userId)
        : await userApi.getUserFollowing(userId);

      if (response.success) {
        setUsers(response.data ?? []);
      } else {
        setError(`Failed to load ${type}`);
      }
      setLoading(false);
    };

    fetchUsers();
  }, [isOpen, userId, type]);

  const title = type === 'followers' ? 'Followers' : 'Following';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
      {loading && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
          Loading {title.toLowerCase()}...
        </p>
      )}

      {error && (
        <p style={{ textAlign: 'center', color: 'var(--accent-danger)', padding: '24px 0' }}>
          {error}
        </p>
      )}

      {!loading && !error && users.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
          No {title.toLowerCase()} yet.
        </p>
      )}

      {!loading && !error && users.map(user => (
        <div
          key={user.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 0',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <img
            src={user.avatar || '/default.jpg'}
            alt={user.firstName}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {user.firstName} {user.lastName}
            </div>
            {user.nickname && (
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                @{user.nickname}
              </div>
            )}
          </div>
        </div>
      ))}
    </Modal>
  );
}
