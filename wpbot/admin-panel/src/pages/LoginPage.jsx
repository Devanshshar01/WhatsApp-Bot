import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import '../styles/login.css';

function LoginPage() {
  const { isAuthenticated, login, error, clearError } = useAuthContext();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    if (!password) {
      setLocalError('Password is required');
      return;
    }

    try {
      setSubmitting(true);
      await login(password);
    } catch (err) {
      // handled by context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1>WhatsApp Bot Admin</h1>
        <p className="login-subtitle">Secure access for owners and administrators only.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="password">Admin Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password from .env"
            autoComplete="current-password"
            disabled={submitting}
          />

          {(localError || error) ? (
            <div className="error-banner">{localError || error}</div>
          ) : null}

          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <footer>
          <small>Need access? Ask the bot owner to share the admin password.</small>
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;
