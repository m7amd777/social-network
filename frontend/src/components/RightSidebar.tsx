import { useState, useEffect } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { userApi, groupApi, type FollowerUser, type GroupResponse } from '../services/api';
import { getImageUrl } from '../utils/image';

interface RightSidebarProps {
  onUserClick?: (userId: number) => void;
  onGroupClick?: (groupId: number) => void;
}

export default function RightSidebar({ onUserClick }: RightSidebarProps) {
  const [suggestedUsers, setSuggestedUsers] = useState<FollowerUser[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState<GroupResponse[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const [followedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    userApi.getSuggestedUsers().then(res => {
      if (res.success) {
        setSuggestedUsers(res.data || []);
        setUsersLoaded(true);
      }
    });
    groupApi.listGroups().then(res => {
      if (res.success) {
        const candidates = (res.data || []).filter(g => !g.isMember && !g.isJoinRequestPending);
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        setSuggestedGroups(candidates.slice(0, 4));
        setGroupsLoaded(true);
      }
    });
  }, []);

  const handleFollow = async (userId: number) => {
    if (followedIds.has(userId) || pendingIds.has(userId)) return;
    const res = await userApi.follow(userId);
    if (res.success) {
      setPendingIds(prev => new Set(prev).add(userId));
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleJoin = async (groupId: number) => {
    const res = await groupApi.joinGroup(groupId);
    if (res.success) {
      setSuggestedGroups(prev => prev.filter(g => g.id !== groupId));
      return;
    }

    // If the request already exists, still reflect Requested state for this session.
    const errMsg = typeof res.error === 'string' ? res.error : res.error?.message;
    if (errMsg?.toLowerCase().includes('already pending')) {
      setSuggestedGroups(prev => prev.filter(g => g.id !== groupId));
    }
  };

  if (!usersLoaded && !groupsLoaded) return null;

  return (
    <aside className="right-sidebar">
      {/* People You May Know */}
      {usersLoaded && (
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <UserPlus size={15} />
            <span>People You May Know</span>
          </div>
          {suggestedUsers.length === 0 ? (
            <p className="sidebar-empty-msg">You're following everyone we suggested!</p>
          ) : (
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
          )}
        </div>
      )}

      {/* Groups You May Be Interested In */}
      {groupsLoaded && (
        <div className="sidebar-card">
          <div className="sidebar-card-header">
            <Users size={15} />
            <span>Groups You May Like</span>
          </div>
          {suggestedGroups.length === 0 ? (
            <p className="sidebar-empty-msg">You've requested to join all suggested groups!</p>
          ) : (
            <div className="sidebar-card-list">
              {suggestedGroups.map(group => {
                const requested = group.isJoinRequestPending;
                return (
                  <div key={group.id} className="sidebar-user-row">
                    <img
                      src={getImageUrl(group.image)}
                      alt={group.title}
                      className="sidebar-avatar sidebar-avatar--square"
                    />
                    <div className="sidebar-name-block">
                      <span className="sidebar-name">{group.title}</span>
                      <span className="sidebar-sub">{group.memberCount} member{group.memberCount !== 1 ? 's' : ''}</span>
                    </div>
                    <button
                      className={`sidebar-action-btn ${requested ? 'sidebar-action-btn--done' : ''}`}
                      onClick={() => handleJoin(group.id)}
                      disabled={requested}
                    >
                      {requested ? 'Requested' : 'Send Request'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
