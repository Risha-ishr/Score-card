import React, { useState, useEffect } from 'react';
import Login            from './components/Login';
import AdminDashboard   from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

export default function App() {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user  = localStorage.getItem('user');
    if (token && user) setAuth({ token, user: JSON.parse(user) });
  }, []);

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

  if (!auth) return <Login onLogin={handleLogin} />;
  if (auth.user.role === 'admin')
  return <AdminDashboard user={auth.user} onLogout={handleLogout} />;
  return <EmployeeDashboard user={auth.user} onLogout={handleLogout} />;
}
