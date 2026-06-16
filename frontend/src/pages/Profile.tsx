import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user ? user.name : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name || !email) {
      setError('Name and Email are required fields.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError('New password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name, email, password || undefined);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <main className="container" id="main-content">
      <div className="profile-layout-container">
        <div className="profile-card glass-card animate-fade-in">
          <div className="profile-header">
            <div className="profile-avatar-giant">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="profile-title">Profile Management</h1>
            <p className="profile-subtitle">Update your personal account credentials below.</p>
          </div>

          {error && (
            <div className="auth-error-alert" role="alert" aria-live="polite">
              <span role="img" aria-label="Warning symbol">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
          )}

          {success && (
            <div className="profile-success-alert" role="status" aria-live="polite">
              <span role="img" aria-label="Checkmark symbol">✅</span>
              <span className="success-text">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="profile-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-email">
                Email Address
              </label>
              <input
                id="profile-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>

            <hr className="profile-divider" />
            <h2 className="security-section-title">Change Password</h2>
            <p className="security-section-subtitle">Leave blank if you do not wish to alter your current password.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-password">
                New Password
              </label>
              <input
                id="profile-password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profile-confirm-password">
                Confirm New Password
              </label>
              <input
                id="profile-confirm-password"
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary profile-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
export default Profile;
