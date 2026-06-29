import React, { useState } from 'react';
import { login } from '../api';

export default function Login({ onLogin }) {
  const [form,    setForm]    = useState({ username: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      onLogin(await login(form.username, form.password));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">📋</span>
          <h1>Applicant Scorecard</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="btn-primary full-width" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="login-hint">
          <p><strong>Admin:</strong> admin / Admin@123</p>
          <p><strong>Employees:</strong> haroon, abigail, tehreen, mkhalid, pratik,</p>
          <p>salman, dilshad, employee8, employee9, employee10 / Emp@1234</p>
        </div>
      </div>
    </div>
  );
}
