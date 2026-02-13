import { User, Mail, Calendar, MapPin, Link as LinkIcon, FileText, Camera } from 'lucide-react';
import Modal from './Modal';
import '../styles/components/EditProfile.css';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfile({ isOpen, onClose }: EditProfileProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="large">
      <div className="edit-profile-form">
        <div className="profile-section">
          <h3>Basic Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nickname">
              <User size={16} />
              Nickname
            </label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              placeholder="@username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} />
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">
              <Calendar size={16} />
              Date of Birth *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              required
            />
          </div>
        </div>

        <div className="profile-section">
          <h3>Additional Information</h3>
          
          <div className="form-group">
            <label htmlFor="location">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="City, Country"
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">
              <LinkIcon size={16} />
              Website
            </label>
            <input
              type="url"
              id="website"
              name="website"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="aboutMe">
              <FileText size={16} />
              About Me
            </label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>
        </div>

        <div className="profile-section">
          <h3>Profile Pictures</h3>
          
          <div className="picture-upload-section">
            <div className="picture-upload">
              <label className="picture-label">
                <Camera size={16} />
                Profile Picture
              </label>
              <div className="picture-upload-area">
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label htmlFor="profilePicture" className="upload-btn">
                  <div className="picture-preview profile-picture-preview">
                    <Camera size={24} />
                  </div>
                  <span>Choose profile picture</span>
                </label>
              </div>
            </div>

            <div className="picture-upload">
              <label className="picture-label">
                <Camera size={16} />
                Cover Photo
              </label>
              <div className="picture-upload-area">
                <input
                  type="file"
                  id="coverPhoto"
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <label htmlFor="coverPhoto" className="upload-btn">
                  <div className="picture-preview cover-photo-preview">
                    <Camera size={24} />
                  </div>
                  <span>Choose cover photo</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Privacy Settings</h3>
          
          <div className="form-group">
            <label htmlFor="profilePrivacy">Profile Privacy</label>
            <select
              id="profilePrivacy"
              name="profilePrivacy"
            >
              <option value="public">Public - Everyone can see your profile</option>
              <option value="private">Private - Only followers can see your profile</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}
