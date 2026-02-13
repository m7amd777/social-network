import { useState } from 'react';
import { Plus, Users, Lock, Globe, Search, Filter } from 'lucide-react';
import type { Group } from '../types';
import { dummyGroups } from '../data/dummyData';
import CreateGroupModal from './CreateGroup';
import '../styles/components/Groups.css';

export default function Groups() {
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);

  const myGroups = dummyGroups.filter(group => group.isMember);
  const allGroups = dummyGroups;

  const filteredGroups = activeTab === 'my-groups' ? myGroups : allGroups.filter(group => 
    group.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="groups-container">
      {/* Header */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <div className="groups-header">
            <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>Groups</h2>
            <button className="btn-primary" onClick={() => setIsCreateGroupModalOpen(true)}>
              <Plus size={18} />
              <span className="hide-small-mobile">Create Group</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="groups-tabs">
            <button
              className={`tab-btn ${activeTab === 'my-groups' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-groups')}
            >
              My Groups <span className="badge-count">{myGroups.length}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveTab('discover')}
            >
              Discover
            </button>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ 
              position: 'absolute', 
              left: '14px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px 12px 42px',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)',
                transition: 'all var(--transition-base)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Groups List */}
      <div className="groups-list">
        {filteredGroups.map(group => (
          <div key={group.id} className="card group-card">
            <div style={{ padding: '24px' }}>
              <div className="group-content">
                {/* Group Avatar */}
                <div className="group-avatar">
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '700',
                    boxShadow: 'var(--shadow-colored)'
                  }}>
                    {group.title.charAt(0)}
                  </div>
                </div>

                {/* Group Info */}
                <div className="group-info">
                  <div className="group-title-row">
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                      {group.title}
                    </h3>
                    {group.isMember ? (
                      <span className="badge badge-primary">Member</span>
                    ) : (
                      <span className="badge">
                        {group.members.length} members
                      </span>
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
                      <span>{group.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {group.isMember ? <Globe size={16} /> : <Lock size={16} />}
                      <span>{group.isMember ? 'Public' : 'Private'}</span>
                    </div>
                    <div className="hide-small-mobile">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="group-actions">
                    {group.isMember ? (
                      <>
                        <button className="btn-primary">View Group</button>
                        <button className="btn-secondary hide-small-mobile">Invite</button>
                        <button className="btn-ghost hide-small-mobile">Settings</button>
                        <button className={`join-button joined-badge`}>
                          Joined
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-primary">Join Group</button>
                        <button className="btn-ghost hide-small-mobile">Learn More</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
          <h3 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
            No groups found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
            {activeTab === 'my-groups' 
              ? "You haven't joined any groups yet. Discover groups to get started and connect with people who share your interests!"
              : "No groups match your search. Try different keywords or browse all available groups."
            }
          </p>
        </div>
      )}

      <CreateGroupModal 
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />

    </div>
  );
}