import { useState } from 'react';
import type { FormEvent } from 'react';
import { groupApi, type GroupResponse } from '../services/api';

export default function GroupPage() {
  const [groupIdInput, setGroupIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupData, setGroupData] = useState<GroupResponse | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const trimmed = groupIdInput.trim();
    if (!trimmed || Number.isNaN(Number(trimmed))) {
      setError('Please enter a valid numeric group ID.');
      setGroupData(null);
      return;
    }

    setLoading(true);
    setError('');

    const response = await groupApi.getGroup(trimmed);
    if (!response.success || !response.data) {
      if (typeof response.error === 'string') {
        setError(response.error);
      } else {
        setError(response.error?.message || 'Failed to fetch group.');
      }
      setGroupData(null);
      setLoading(false);
      return;
    }

    setGroupData(response.data);
    setLoading(false);
  };

  return (
    <div className="groups-container">
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>
            Group Page (Test)
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Enter a group ID to fetch <code>/api/groups/{'{id}'}</code>.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="number"
              min={1}
              step={1}
              value={groupIdInput}
              onChange={(e) => setGroupIdInput(e.target.value)}
              placeholder="Group ID (e.g. 1)"
              style={{
                flex: '1 1 240px',
                padding: '12px 14px',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch Group'}
            </button>
          </form>

          {error && (
            <p style={{ marginTop: '12px', color: '#b42318', fontWeight: 600 }}>{error}</p>
          )}
        </div>
      </div>

      {groupData && (
        <div className="card">
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
              API Data
            </h3>

            <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
              <div><strong>ID:</strong> {groupData.id}</div>
              <div><strong>Title:</strong> {groupData.title}</div>
              <div><strong>Description:</strong> {groupData.description || '-'}</div>
              <div><strong>Created By:</strong> {groupData.createdBy}</div>
              <div><strong>Member Count:</strong> {groupData.memberCount}</div>
              <div><strong>Created At:</strong> {new Date(groupData.createdAt).toLocaleString()}</div>
            </div>

            <pre
              style={{
                margin: 0,
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                overflowX: 'auto',
                border: '1px solid var(--border-color)',
              }}
            >
              {JSON.stringify(groupData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
