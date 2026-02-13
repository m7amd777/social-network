import { Globe, Lock, Image } from 'lucide-react';
import Modal from './Modal';
import '../styles/components/CreateGroup.css';

interface CreateGroupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroup({ isOpen, onClose }: CreateGroupProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group" size="medium">
      <div className="create-group-form">
        <div className="form-group">
          <label htmlFor="name">Group Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Enter group name"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            placeholder="What is your group about?"
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
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
          <label>Privacy Settings</label>
          <div className="privacy-options">
            <label className="privacy-option">
              <input
                type="radio"
                name="privacy"
                value="public"
                defaultChecked
              />
              <div className="privacy-option-content">
                <div className="privacy-option-header">
                  <Globe size={18} />
                  <span>Public</span>
                </div>
                <p>Anyone can find and join this group</p>
              </div>
            </label>

            <label className="privacy-option">
              <input
                type="radio"
                name="privacy"
                value="private"
              />
              <div className="privacy-option-content">
                <div className="privacy-option-header">
                  <Lock size={18} />
                  <span>Private</span>
                </div>
                <p>People must request to join and be approved</p>
              </div>
            </label>
          </div>
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
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary">
            Create Group
          </button>
        </div>
      </div>
    </Modal>
  );
}
