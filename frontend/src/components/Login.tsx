import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/components/Login.css';

interface LoginProps {
  onShowSignup?: () => void;
}

export default function Login({ onShowSignup }: LoginProps) {
  const { login, error, loading, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    await login({ email, password });
  };

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
        <form onSubmit={handleSubmit} className="login-fields">
          {/* Error Message */}
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="form-field">
            <label className="form-label">
              Email Address
            </label>
            <div className="input-wrapper">
              <Mail size={18} className="input-icon" style={{ width: 18, height: 18, pointerEvents: 'none' }} />
              <input
                type="email"
                placeholder="Enter your email"
                className="form-input"
                style={{ paddingLeft: 48, boxSizing: 'border-box' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" style={{ width: 18, height: 18, pointerEvents: 'none' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="form-input password-input"
                style={{ paddingLeft: 48, paddingRight: 48, boxSizing: 'border-box' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
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
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

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
