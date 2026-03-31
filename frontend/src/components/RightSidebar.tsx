import { useState, useEffect } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { userApi, groupApi, type FollowerUser, type GroupResponse } from '../services/api';
import { getImageUrl } from '../utils/image';

interface RightSidebarProps {
  onUserClick?: (userId: number) => void;
  onGroupClick?: (groupId: number) => void;
}

export default function RightSidebar({ onUserClick, onGroupClick }: RightSidebarProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<FollowerUser[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupResponse[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    userApi.getSuggestedUsers().then(res => {
      if (res.success && res.data) setSuggestedUsers(res.data);
    });
    groupApi.listGroups().then(res => {
      if (res.success && res.data) {
        const notMember = res.data.filter(g => !g.isMember).slice(0, 4);
        setSuggestedGroups(notMember);
      }
    });
  }, []);

  const handleFollow = async (userId: number) => {
    if (followedIds.has(userId) || pendingIds.has(userId)) return;
    const res = await userApi.follow(userId);
    if (res.success) {
      setPendingIds(prev => new Set(prev).add(userId));
    }
  };

  const handleJoin = async (groupId: number) => {
    if (joinedIds.has(groupId)) return;
    const res = await groupApi.joinGroup(groupId);
    if (res.success) {
      setJoinedIds(prev => new Set(prev).add(groupId));
    }
  };

  if (suggestedUsers.length === 0 && suggestedGroups.length === 0) return null;

  return (
    <aside className="right-sidebar">
      {/* People You May Know */}
      {suggestedUsers.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <UserPlus size={15} />
            <span>People You May Know</span>
          </div>
          <div className="sidebar-card-list">
            {suggestedUsers.map(user => {
              const displayName = user.nickname || `${user.firstName} ${user.lastName}`.trim();
              const followed = followedIds.has(user.id);
              const pending = pendingIds.has(user.id);
              return (
                <div key={user.id} className="sidebar-user-row">
                  <img
                    src={getImageUrl(user.avatar)}
                    alt={displayName}
                    className="sidebar-avatar"
                    onClick={() => onUserClick?.(user.id)}
                    style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                  />
                  <span
                    className="sidebar-name"
                    onClick={() => onUserClick?.(user.id)}
                    style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                  >
                    {displayName}
                  </span>
                  <button
                    className={`sidebar-action-btn ${followed || pending ? 'sidebar-action-btn--done' : ''}`}
                    onClick={() => handleFollow(user.id)}
                    disabled={followed || pending}
                  >
                    {pending ? 'Requested' : followed ? 'Following' : 'Follow'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Groups You May Be Interested In */}
      {suggestedGroups.length > 0 && (
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <Users size={15} />
            <span>Groups You May Like</span>
          </div>
          <div className="sidebar-card-list">
            {suggestedGroups.map(group => {
              const joined = joinedIds.has(group.id);
              return (
                <div key={group.id} className="sidebar-user-row">
                  <img
                    src={getImageUrl(group.image)}
                    alt={group.title}
                    className="sidebar-avatar sidebar-avatar--square"
                    onClick={() => onGroupClick?.(group.id)}
                    style={{ cursor: onGroupClick ? 'pointer' : 'default' }}
                  />
                  <div className="sidebar-name-block" onClick={() => onGroupClick?.(group.id)} style={{ cursor: onGroupClick ? 'pointer' : 'default' }}>
                    <span className="sidebar-name">{group.title}</span>
                    <span className="sidebar-sub">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                  <button
                    className={`sidebar-action-btn ${joined ? 'sidebar-action-btn--done' : ''}`}
                    onClick={() => handleJoin(group.id)}
                    disabled={joined}
                  >
                    {joined ? 'Requested' : 'Join'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
