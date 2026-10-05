import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  HiOutlineMail,
  HiOutlineLockClosed,
  HiEye,
  HiEyeOff,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineTrendingUp,
  HiOutlineLightningBolt,
  HiOutlineSun,
  HiOutlineMoon,
} from 'react-icons/hi';

const LoginPage = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [email, setEmail] = useState('medkit@gmail.com');
  const [password, setPassword] = useState('Medkit@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Theme Switcher Button on Login Page */}
      <button
        type="button"
        className="header-icon-btn"
        onClick={toggleTheme}
        title={isDark ? "Switch to Light Mode" : "Switch to Vibrant Dark Mode"}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 20,
          background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#ffffff',
          color: isDark ? '#fbbf24' : '#6366f1',
          border: isDark ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {isDark ? <HiOutlineSun style={{ fontSize: '1.25rem' }} /> : <HiOutlineMoon style={{ fontSize: '1.2rem' }} />}
      </button>

      {/* Ambient background decoration */}
      <div className="login-ambient-orb orb-1"></div>
      <div className="login-ambient-orb orb-2"></div>
      <div className="login-ambient-orb orb-3"></div>

      <div className="login-card-container">
        <div className="login-card">
          {/* Brand Header */}
          <div className="login-header">
            <div className="login-brand-icon">
              <HiOutlineSparkles />
            </div>
            <h1 className="login-title">LeadFlow</h1>
            <p className="login-subtitle">Enterprise Agent & Doctor Lead Management System</p>
          </div>

          {error && (
            <div className="login-error-box">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Quick Credential Fillers for Convenience */}
          <div className="login-demo-helper">
            <span className="helper-label">Quick autofill:</span>
            <div className="helper-chips">
              <button
                type="button"
                className="helper-chip active-chip"
                onClick={() => fillCredentials('medkit@gmail.com', 'Medkit@123')}
                title="Autofill Admin Credentials"
              >
                👑 Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <HiOutlineMail className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
              </div>
              <div className="input-with-icon">
                <HiOutlineLockClosed className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="input-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <HiEyeOff /> : <HiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-login"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner spinner-sm"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <HiOutlineLightningBolt className="btn-icon-right" />
                </>
              )}
            </button>
          </form>

          {/* Features Row */}
          <div className="login-features-list">
            <div className="feature-item">
              <HiOutlineTrendingUp className="feature-icon" />
              <span>Realtime Funnel</span>
            </div>
            <div className="feature-item">
              <HiOutlineShieldCheck className="feature-icon" />
              <span>RBAC Security</span>
            </div>
            <div className="feature-item">
              <HiOutlineSparkles className="feature-icon" />
              <span>Automated Sync</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
