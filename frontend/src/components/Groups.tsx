import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Globe, Search, UserPlus, Eye, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { groupApi } from '../services/api';
import type { GroupResponse } from '../services/api';
import { getImageUrl } from '../utils/image';
import CreateGroupModal from './CreateGroup';
import '../styles/components/Groups.css';

export default function Groups() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'joined' | 'owned' | 'all'>('joined');
  const [searchTerm, setSearchTerm] = useState('');
  const [groups, setGroups] = useState<GroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    const res = await groupApi.listGroups();
    if (res.success && res.data) {
      setGroups(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const visibleGroups = groups.filter((group) => group.memberCount > 0);

  // Filter by tab
  const tabFiltered = visibleGroups.filter(group => {
    switch (activeTab) {
      case 'joined': return group.isMember;
      case 'owned': return group.isOwner;
      case 'all': return true;
      default: return true;
    }
  });

  // Filter by search
  const filteredGroups = tabFiltered.filter(group =>
    group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const joinedCount = visibleGroups.filter(g => g.isMember).length;
  const ownedCount = visibleGroups.filter(g => g.isOwner).length;

  const handleJoinGroup = async (e: React.MouseEvent, groupId: number) => {
    e.stopPropagation();
    setJoiningGroupId(groupId);
    const res = await groupApi.joinGroup(groupId);
    if (res.success) {
      await fetchGroups();
    }
    setJoiningGroupId(null);
  };

  const handleGroupClick = (group: GroupResponse) => {
    if (group.isMember || group.isOwner) {
      navigate(`/groups/${group.id}`);
    }
  };

  return (
    <div className="groups-container">
      {/* Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div className="groups-header">
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>Groups</h2>
            <button className="btn btn-primary" onClick={() => setIsCreateGroupModalOpen(true)}>
              <Plus size={18} />
              <span className="hide-small-mobile">Create Group</span>
            </button>
          </div>

          {/* Search */}
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="groups-tabs">
            <button
              className={`tab-btn ${activeTab === 'joined' ? 'active' : ''}`}
              onClick={() => setActiveTab('joined')}
            >
              Joined <span className="badge-count">{joinedCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'owned' ? 'active' : ''}`}
              onClick={() => setActiveTab('owned')}
            >
              Owned <span className="badge-count">{ownedCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All <span className="badge-count">{visibleGroups.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div className="skeleton" style={{ width: '200px', height: '24px', margin: '0 auto 16px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ width: '300px', height: '16px', margin: '0 auto', borderRadius: 'var(--radius-md)' }} />
        </div>
      )}

      {/* Groups List */}
      {!loading && (
        <div className="groups-list">
          {filteredGroups.map(group => {
            const isClickable = group.isMember || group.isOwner;

            return (
              <div
                key={group.id}
                className={`card group-card ${isClickable ? 'group-card-clickable' : 'group-card-disabled'}`}
                onClick={() => handleGroupClick(group)}
              >
                <div style={{ padding: '24px' }}>
                  <div className="group-content">
                    {/* Group Avatar */}
                    <div className="group-avatar">
                      {group.image ? (
                        <img
                          src={getImageUrl(group.image)}
                          alt={group.title}
                          style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: 'var(--radius-lg)',
                            objectFit: 'cover',
                            boxShadow: 'var(--shadow-colored)',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '72px',
                          height: '72px',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--bg-gradient)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '28px',
                          fontWeight: '700',
                          boxShadow: 'var(--shadow-colored)'
                        }}>
                          {group.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Group Info */}
                    <div className="group-info">
                      <div className="group-title-row">
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {group.title}
                        </h3>
                        {group.isOwner && (
                          <span className="badge badge-primary">Owner</span>
                        )}
                        {group.isMember && !group.isOwner && (
                          <span className="badge badge-primary">Member</span>
                        )}
                      </div>

                      <p style={{
                        fontSize: '15px',
                        color: 'var(--text-secondary)',
                        marginBottom: '16px',
                        lineHeight: '1.5'
                      }}>
                        {group.description}
                      </p>

                      <div className="group-meta">
                        <div className="flex items-center gap-2">
                          <Users size={16} />
                          <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Globe size={16} />
                          <span>Public</span>
                        </div>
                        <div className="hide-small-mobile">
                          Created {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="group-actions">
                        {(group.isOwner || group.isMember) ? (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/groups/${group.id}`);
                              }}
                            >
                              <Eye size={16} />
                              View Group
                            </button>

                            {!group.isOwner && (
                              <div className="joined-badge">
                                <CheckCircle size={16} />
                                Joined
                              </div>
                            )}
                          </>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={joiningGroupId === group.id}
                            onClick={(e) => handleJoinGroup(e, group.id)}
                          >
                            <UserPlus size={16} />
                            {joiningGroupId === group.id ? 'Joining...' : 'Send Request'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGroups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-gradient-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <Users size={36} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
            {searchTerm ? 'No groups found' : activeTab === 'joined'
              ? 'No joined groups yet'
              : activeTab === 'owned'
                ? "You haven't created any groups yet"
                : 'No groups available'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
            {searchTerm
              ? 'No groups match your search. Try different keywords.'
              : activeTab === 'joined'
                ? 'Join groups to connect with people who share your interests!'
                : activeTab === 'owned'
                  ? 'Create your first group and start building a community.'
                  : 'Be the first to create a group!'}
          </p>
          {!searchTerm && (activeTab === 'owned' || activeTab === 'all') && (
            <button
              className="btn btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => setIsCreateGroupModalOpen(true)}
            >
              <Plus size={18} />
              Create Group
            </button>
          )}
        </div>
      )}

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={fetchGroups}
      />
    </div>
  );
}
