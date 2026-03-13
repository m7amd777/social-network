import { useState, useRef } from 'react';
import { Image, X } from 'lucide-react';
import { groupApi } from '../services/api';
import { validateImageFile } from '../utils/image';
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

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
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
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 3) {
      setError('Group name must be at least 3 characters');
      return;
    }
    if (trimmedTitle.length > 40) {
      setError('Group name must be at most 40 characters');
      return;
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(trimmedTitle)) {
      setError('Group name must only contain alphanumeric characters and spaces');
      return;
    }

    const trimmedDesc = description.trim();
    if (trimmedDesc.length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (trimmedDesc.length > 500) {
      setError('Description must be at most 500 characters');
      return;
    }

    setLoading(true);
    setError('');

    const res = await groupApi.createGroup({
      title: trimmedTitle,
      description: trimmedDesc,
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
          <div className="label-with-counter">
            <label htmlFor="title">Group Name *</label>
            <span className={`char-counter ${title.length > 40 ? 'over-limit' : title.length > 30 ? 'near-limit' : ''}`}>
              {title.length}/40
            </span>
          </div>
          <input
            type="text"
            id="title"
            name="title"
            placeholder="Enter group name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={3}
            maxLength={40}
            required
          />
        </div>

        <div className="form-group">
          <div className="label-with-counter">
            <label htmlFor="description">Description</label>
            <span className={`char-counter ${description.length > 500 ? 'over-limit' : description.length > 450 ? 'near-limit' : ''}`}>
              {description.length}/500
            </span>
          </div>
          <textarea
            id="description"
            name="description"
            placeholder="What is your group about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            minLength={10}
            maxLength={500}
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
