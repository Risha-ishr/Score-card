import React, { useState, useEffect } from 'react';
import Login             from './pages/Login';
import AdminDashboard    from './pages/AdminDashboard/AdminDashboard';
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
        handleLogout()
        return;
      }
      setAuth({ token, user: JSON.parse(user) });
    }
  }, []);



  if (!auth) return <Login onLogin={handleLogin} />;
  if (auth.user.role === 'admin')
  return <AdminDashboard user={auth.user} onLogout={handleLogout} />;
  return <EmployeeDashboard user={auth.user} onLogout={handleLogout} />;

}
