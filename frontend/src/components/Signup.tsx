import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateImageFile } from '../utils/image';
import '../styles/components/Signup.css';

interface SignupProps {
  onShowLogin?: () => void;
}

const iconStyle = { width: 18, height: 18, pointerEvents: 'none' as const };
const inputPadding = { paddingLeft: 48, boxSizing: 'border-box' as const };
const nameInputPadding = { paddingLeft: 44, boxSizing: 'border-box' as const };
const passwordPadding = { paddingLeft: 48, paddingRight: 48, boxSizing: 'border-box' as const };

export default function Signup({ onShowLogin }: SignupProps) {
  const { register, error, loading, clearError } = useAuth();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setLocalError(validationError);
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarPreview(base64String);
      setAvatar(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Client-side validation
    if (!firstName.trim()) {
      setLocalError('First name is required');
      return;
    }
    if (!lastName.trim()) {
      setLocalError('Last name is required');
      return;
    }
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!dateOfBirth) {
      setLocalError('Date of birth is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (!/[a-zA-Z]/.test(password)) {
      setLocalError('Password must contain at least one letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setLocalError('Password must contain at least one number');
      return;
    }

    // Prepare registration data
    const registerData = {
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: dateOfBirth,
      nickname: nickname.trim() || undefined,
      aboutMe: aboutMe.trim() || undefined,
      avatar: avatar || undefined,
    };

    const success = await register(registerData);
    if (success && onShowLogin) {
      // Redirect to login page after successful registration
      onShowLogin();
    }
  };

  const displayError = localError || error;

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        {/* Header */}
        <div className="signup-header">
          <h1 className="signup-title">
            Create Account
          </h1>
          <p className="signup-subtitle">
            Join Social Network today and connect with others
          </p>
        </div>

        {/* Error Message */}
        {displayError && (
          <div className="error-message" style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {displayError}
          </div>
        )}

        {/* Signup Form */}
        <div className="signup-fields">
          {/* Avatar Upload */}
          <div className="avatar-upload">
            <div className="avatar-wrapper">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="avatar-image"
                  />
                ) : (
                  <Camera size={32} className="avatar-placeholder" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="avatar-input"
              />
            </div>
            <p className="avatar-hint">
              Optional: Click to upload avatar
            </p>
          </div>

          <div className="form-row">
            {/* First Name */}
            <div className="form-field">
              <label className="form-label">
                First Name *
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" style={iconStyle} />
                <input
                  type="text"
                  placeholder="First name"
                  className="form-input name-input"
                  style={nameInputPadding}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="form-field">
              <label className="form-label">
                Last Name *
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" style={iconStyle} />
                <input
                  type="text"
                  placeholder="Last name"
                  className="form-input name-input"
                  style={nameInputPadding}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="form-field">
            <label className="form-label">
              Email Address *
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" style={iconStyle} />
              <input
                type="email"
                placeholder="Enter your email"
                className="form-input"
                style={inputPadding}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-field">
            <label className="form-label">
              Date of Birth *
            </label>
            <div className="input-wrapper">
              <Calendar size={18} className="input-icon" style={iconStyle} />
              <input
                type="date"
                className="form-input"
                style={inputPadding}
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          {/* Nickname (Optional) */}
          <div className="form-field">
            <label className="form-label">
              Nickname
              <span className="optional-label">
                (Optional)
              </span>
            </label>
            <div className="input-wrapper">
              <Edit3 size={18} className="input-icon" style={iconStyle} />
              <input
                type="text"
                placeholder="Enter your nickname"
                className="form-input"
                style={inputPadding}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label">
              Password *
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" style={iconStyle} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className="form-input password-input"
                style={passwordPadding}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label className="form-label">
              Confirm Password *
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" style={iconStyle} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="form-input password-input"
                style={passwordPadding}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* About Me (Optional) */}
          <div className="form-field">
            <label className="form-label">
              About Me
              <span className="optional-label">
                (Optional)
              </span>
            </label>
            <textarea
              placeholder="Tell us about yourself..."
              rows={4}
              className="form-textarea"
              value={aboutMe}
              onChange={(e) => setAboutMe(e.target.value)}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        {/* Login Link */}
        <div className="signup-footer">
          <p className="signup-footer-text">
            Already have an account?{' '}
            <button 
              onClick={onShowLogin}
              className="signup-link"
              type="button"
              style={{ 
                background: 'none',
                border: 'none',
                color: 'var(--accent-primary)',
                textDecoration: 'none',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit'
              }}
            >
              Sign in
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
