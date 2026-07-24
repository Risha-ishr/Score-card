import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login             from './pages/Login';
import LandingPage       from './pages/LandingPage';
import AdminLayout       from './pages/AdminLayout';
import ScoresPage        from './pages/ScoresPage';
import ScoreFormPage     from './pages/ScoreFormPage';
import EmployeeDashboard from './pages/EmployeeDashboard';

export default function App() {
  const [auth, setAuth] = useState(null);

  const handleLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user',  JSON.stringify(data.user));
    setAuth(data);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setAuth(null);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    if (token && user) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
      } catch {
        handleLogout();
        return;
      }
      setAuth({ token, user: JSON.parse(user) });
    }
  }, []);

  /* ── Not logged in ─────────────────────────────────────── */
  if (!auth) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  /* ── Admin ─────────────────────────────────────────────── */
  if (auth.user.role === 'admin') {
    return (
      <Routes>
        {/* Landing page has its own full-page dark design */}
        <Route
          path="/"
          element={<LandingPage user={auth.user} onLogout={handleLogout} />}
        />

        {/* Scores list shares the AdminLayout navbar */}
        <Route element={<AdminLayout user={auth.user} onLogout={handleLogout} />}>
          <Route path="/scores" element={<ScoresPage />} />
        </Route>

        {/* ScoreForm has its own navbar — no layout wrapper */}
        <Route path="/scores/:id" element={<ScoreFormPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  /* ── Employee ───────────────────────────────────────────── */
  return (
    <Routes>
      <Route
        path="/"
        element={<EmployeeDashboard user={auth.user} onLogout={handleLogout} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
