import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Calendar, Camera, Edit3 } from 'lucide-react';
import '../styles/components/Signup.css';

interface SignupProps {
  onShowLogin?: () => void;
}

export default function Signup({ onShowLogin }: SignupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        {/* Header */}
        <div className="signup-header">
          <h1 className="signup-title">
            Create Account
          </h1>
          <p className="signup-subtitle">
            Join Social Network today and connect with others
          </p>
        </div>

        {/* Signup Form */}
        <div className="form-group">
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
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="First name"
                  className="form-input name-input"
                  readOnly
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="form-field">
              <label className="form-label">
                Last Name *
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Last name"
                  className="form-input name-input"
                  readOnly
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
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="Enter your email"
                className="form-input"
                readOnly
              />
            </div>
          </div>

          {/* Date of Birth */}
          <div className="form-field">
            <label className="form-label">
              Date of Birth *
            </label>
            <div className="input-wrapper">
              <Calendar size={18} className="input-icon" />
              <input
                type="date"
                className="form-input"
                readOnly
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
              <Edit3 size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Enter your nickname"
                className="form-input"
                readOnly
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field">
            <label className="form-label">
              Password *
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className="form-input password-input"
                readOnly
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
              <Lock size={18} className="input-icon" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="form-input password-input"
                readOnly
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
              readOnly
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button btn-primary"
          >
            Create Account
          </button>
        </div>

        {/* Login Link */}
        <div className="signup-footer">
          <p className="signup-footer-text">
            Already have an account?{' '}
            <button 
              onClick={onShowLogin}
              className="signup-link"
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
      </div>
    </div>
  );
}
