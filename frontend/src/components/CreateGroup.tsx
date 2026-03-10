import { useState } from 'react';
import { Image } from 'lucide-react';
import { groupApi } from '../services/api';
import Modal from './Modal';
import '../styles/components/CreateGroup.css';

interface CreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export default function CreateGroup({ isOpen, onClose, onGroupCreated }: CreateGroupProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    // Validate
    if (!title.trim()) {
      setError('Group name is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);
    setError('');

    const res = await groupApi.createGroup({
      title: title.trim(),
      description: description.trim(),
    });

    if (res.success) {
      onGroupCreated();
      handleClose();
    } else {
      if (typeof res.error === 'string') {
        setError(res.error);
      } else if (res.error && typeof res.error === 'object' && 'fields' in res.error) {
        const fields = res.error.fields as Record<string, string>;
        setError(Object.values(fields).join('. '));
      } else {
        setError('Failed to create group. Please try again.');
      }
    }

    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Group" size="medium">
      <div className="create-group-form">
        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(231, 76, 60, 0.1)',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-danger)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Group Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter group name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            placeholder="What is your group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="general">General</option>
            <option value="technology">Technology</option>
            <option value="sports">Sports & Fitness</option>
            <option value="arts">Arts & Culture</option>
            <option value="business">Business</option>
            <option value="education">Education</option>
            <option value="entertainment">Entertainment</option>
            <option value="health">Health & Wellness</option>
            <option value="travel">Travel</option>
            <option value="food">Food & Cooking</option>
          </select>
        </div>

        <div className="form-group">
          <label className="group-avatar-label">
            <Image size={16} />
            Group Cover Image
          </label>
          <div className="avatar-upload">
            <input
              type="file"
              id="avatar"
              accept="image/*"
              style={{ display: 'none' }}
            />
            <label htmlFor="avatar" className="avatar-upload-btn">
              <div className="avatar-preview">
                <Image size={32} />
              </div>
              <span>Choose cover image</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
