import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function AdminLayout({ user, onLogout }) {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span>📋</span> Applicant Scorecard
        </div>

        <div className="nav-links">
          <NavLink to="/"      end className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}>Home</NavLink>
          <NavLink to="/scores"    className={({ isActive }) => 'nav-link' + (isActive ? ' nav-link-active' : '')}>Scores</NavLink>
        </div>

        <div className="nav-right">
          <span className="nav-user">👤 {user.name}</span>
          <span className="badge badge-admin">Admin</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
