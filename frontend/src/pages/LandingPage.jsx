import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.scss';

const FEATURES = [
  {
    icon: '🎯',
    title: 'Precision Scoring',
    desc: 'Rate candidates across 23 weighted parameters — communication, technical skills, attitude and more.',
  },
  {
    icon: '📊',
    title: 'Weighted Analytics',
    desc: 'Three-tier multiplier system gives every parameter its true impact on the final score.',
  },
  {
    icon: '⚡',
    title: 'Instant Insights',
    desc: 'See overall performance percentages, trends, and colour-coded ratings at a glance.',
  },
  {
    icon: '📤',
    title: 'Excel Import',
    desc: 'Bulk-upload candidate data from spreadsheets. Existing records update automatically.',
  },
];

const STATS = [
  { value: '23',   label: 'Scoring Parameters' },
  { value: '3×',   label: 'Weighted Multipliers' },
  { value: '100%', label: 'Score Transparency' },
];

export default function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();
  const onEnter  = () => navigate('/scores');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={`lp-root ${visible ? 'lp-visible' : ''}`}>
      {/* Glowing orbs */}
      <div className="lp-orb lp-orb-1" />
      <div className="lp-orb lp-orb-2" />
      <div className="lp-orb lp-orb-3" />

      {/* Navbar */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-nav-icon">📋</span>
          <span>Applicant Scorecard</span>
        </div>
        <div className="lp-nav-right">
          <span className="lp-nav-user">👤 {user.name}</span>
          <span className="lp-badge">Admin</span>
          <button className="lp-btn-ghost" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-pill">Applicant Evaluation System</div>

        <h1 className="lp-headline">
          Evaluate Smarter.<br />
          <span className="lp-gradient-text">Hire Better.</span>
        </h1>

        <p className="lp-sub">
          A powerful scorecard platform to assess, track, and manage<br />
          every candidate with structured precision and full transparency.
        </p>

        <div className="lp-cta-row">
          <button className="lp-btn-primary" onClick={onEnter}>
            View Employee Scorecards
            <span className="lp-arrow">→</span>
          </button>
          <a className="lp-btn-outline" href="#features">Explore Features</a>
        </div>

        {/* Stats */}
        <div className="lp-stats">
          {STATS.map(({ value, label }) => (
            <div key={label} className="lp-stat">
              <div className="lp-stat-value">{value}</div>
              <div className="lp-stat-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="lp-features" id="features">
        <p className="lp-section-tag">Features</p>
        <h2 className="lp-section-title">Everything you need to evaluate candidates</h2>
        <div className="lp-feature-grid">
          {FEATURES.map(({ icon, title, desc }) => (
            <div key={title} className="lp-feature-card">
              <div className="lp-feature-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="lp-bottom-cta">
        <div className="lp-bottom-cta-inner">
          <h2>Ready to start scoring?</h2>
          <p>Jump into the dashboard and manage your entire candidate pipeline.</p>
          <button className="lp-btn-primary lp-btn-lg" onClick={onEnter}>
            Open Scorecards Dashboard
            <span className="lp-arrow">→</span>
          </button>
        </div>
      </section>

      <footer className="lp-footer">
        <span>© 2025 Applicant Scorecard · All rights reserved</span>
      </footer>
    </div>
  );
}
