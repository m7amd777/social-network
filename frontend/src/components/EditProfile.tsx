import { useState, useEffect } from 'react';
import { User, Calendar, FileText, Camera } from 'lucide-react';
import Modal from './Modal';
import { authApi } from '../services/api';
import type { UserProfile } from '../services/api';
import { validateImageFile, getImageUrl } from '../utils/image';
import '../styles/components/EditProfile.css';

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  onSave: (updated: Partial<UserProfile>) => void;
}

export default function EditProfile({ isOpen, onClose, profile, onSave }: EditProfileProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile && isOpen) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setNickname(profile.nickname || '');
      setDateOfBirth(profile.createdAt ? profile.createdAt.slice(0, 10) : '');
      setAboutMe(profile.aboutMe || '');
      setAvatarPreview(getImageUrl(profile.avatar));
      setAvatar(null);
      setIsPrivate(profile.isPrivate);
      setError(null);
    }
  }, [profile, isOpen]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setAvatar(base64);
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    const profileData: Parameters<typeof authApi.updateProfile>[0] = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      aboutMe: aboutMe.trim(),
    };
    if (avatar) profileData.avatar = avatar;

    const [profileRes, privacyRes] = await Promise.all([
      authApi.updateProfile(profileData),
      authApi.updatePrivacy(isPrivate),
    ]);

    setLoading(false);

    if (!profileRes.success) {
      const err = profileRes.error;
      let errorMsg = 'Failed to update profile';
      if (typeof err === 'string') {
        errorMsg = err;
      } else if (err) {
        if (err.fields && Object.keys(err.fields).length > 0) {
          errorMsg = Object.values(err.fields).join(', ');
        } else {
          errorMsg = err.message || errorMsg;
        }
      }
      setError(errorMsg);
      return;
    }

    if (!privacyRes.success) {
      setError('Failed to update privacy setting');
      return;
    }

    // Pass updated fields back to Profile so it re-renders without a full refetch
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      nickname: nickname.trim(),
      aboutMe: aboutMe.trim(),
      avatar: avatar || profile?.avatar || '',
      isPrivate,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile" size="large">
      <div className="edit-profile-form">

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <div className="profile-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                placeholder="Enter your first name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                placeholder="Enter your last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
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
              placeholder="@username"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">
              <Calendar size={16} />
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={e => setDateOfBirth(e.target.value)}
            />
          </div>
        </div>

        <div className="profile-section">
          <h3>Additional Information</h3>
          <div className="form-group">
            <label htmlFor="aboutMe">
              <FileText size={16} />
              About Me
            </label>
            <textarea
              id="aboutMe"
              placeholder="Tell us about yourself..."
              rows={4}
              value={aboutMe}
              onChange={e => setAboutMe(e.target.value)}
            />
          </div>
        </div>

        <div className="profile-section">
          <h3>Profile Picture</h3>
          <div className="picture-upload-section">
            <div className="picture-upload">
              <div className="picture-upload-area">
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <label htmlFor="profilePicture" className="upload-btn">
                  <div className="picture-preview profile-picture-preview">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : <Camera size={24} />
                    }
                  </div>
                  <span>Choose profile picture</span>
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
              value={isPrivate ? 'private' : 'public'}
              onChange={e => setIsPrivate(e.target.value === 'private')}
            >
              <option value="public">Public - Everyone can see your profile</option>
              <option value="private">Private - Only followers can see your profile</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </Modal>
  );
}
