import { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';
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
  const [image, setImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImage(null);
    setImagePreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImage(base64String);
      setImagePreview(base64String);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      image: image || undefined,
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
          <label className="group-avatar-label">
            <Image size={16} />
            Group Cover Image
          </label>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          {imagePreview ? (
            <div className="cover-image-preview-wrapper">
              <img
                src={imagePreview}
                alt="Cover preview"
                className="cover-image-preview"
              />
              <button
                type="button"
                className="cover-image-remove"
                onClick={handleRemoveImage}
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="avatar-preview">
                <Image size={32} />
              </div>
              <span>Choose cover image</span>
            </div>
          )}
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
