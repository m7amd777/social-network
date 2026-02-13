import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import '../styles/components/Login.css';

interface LoginProps {
  onShowSignup?: () => void;
}

export default function Login({ onShowSignup }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-container">
      <div className="login-form">
        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">
            Welcome Back
          </h1>
          <p className="login-subtitle">
            Sign in to your Social Network account
          </p>
        </div>

        {/* Login Form */}
        <div className="form-group">
          {/* Email Field */}
          <div className="form-field">
            <label className="form-label">
              Email Address
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

          {/* Password Field */}
          <div className="form-field">
            <label className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
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

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button btn-primary"
          >
            Sign In
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="login-footer">
          <p className="login-footer-text">
            Don't have an account?{' '}
            <button 
              onClick={onShowSignup}
              className="login-link"
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
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
