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

// Annual = 10x monthly (2 months free). The real monthly price is always shown —
// the annual view adds the yearly figure and the saving, it never replaces the
// monthly rate with a blended number.
const PLANS = [
  {
    name: 'Smart Shortlist',
    monthly: 9999,
    annual: 99990,
    annualSaving: 19998,
    screens: '200',
    reports: '15 Core',
    users: 3,
  },
  {
    name: 'Decision Fit',
    monthly: 24999,
    annual: 249990,
    annualSaving: 49998,
    screens: '500',
    reports: '25 Decision Fit',
    users: 5,
    featured: true,
  },
  {
    name: 'Leadership Intelligence',
    monthly: 59999,
    annual: 599990,
    annualSaving: 119998,
    screens: '1,000',
    reports: '10 Advanced',
    users: 10,
    note: 'The 10 reports / month is intentional. These are advanced assessments with substantially deeper analysis — not directly comparable to the higher-volume Decision Fit reports. The lower allowance reinforces the premium, high-value nature of the assessment rather than positioning this tier as a volume-based upgrade.',
  },
  {
    name: 'Enterprise — Super Platinum',
    monthly: 149999,
    annual: 1499990,
    annualSaving: 299998,
    screens: '3,000',
    reports: '50 Fitment-ready dossiers',
    users: 25,
  },
];

const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

function formatPrice(plan, annual) {
  return annual
    ? { price: rupees(plan.annual), period: '/ yr' }
    : { price: rupees(plan.monthly), period: '/ mo' };
}

export default function LandingPage({ user, onLogout }) {
  const navigate = useNavigate();
  const onEnter  = () => navigate('/scores');
  const [visible, setVisible] = useState(false);
  const [annual, setAnnual] = useState(false);

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
          <a className="lp-btn-outline" href="#pricing">See Pricing</a>
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

      {/* Pricing */}
      <section className="lp-pricing" id="pricing">
        <p className="lp-section-tag">Pricing</p>
        <h2 className="lp-section-title">Simple plans, no surprises</h2>

        <div className="lp-billing-toggle">
          <span className={!annual ? 'lp-billing-active' : ''}>Monthly</span>
          <button
            className={`lp-billing-switch ${annual ? 'lp-billing-switch-on' : ''}`}
            onClick={() => setAnnual((v) => !v)}
            aria-label="Toggle annual billing"
          >
            <span className="lp-billing-knob" />
          </button>
          <span className={annual ? 'lp-billing-active' : ''}>Annual — get 2 months free</span>
        </div>

        <div className="lp-pricing-grid">
          {PLANS.map((plan) => {
            const { name, featured, screens, reports, users, monthly, note } = plan;
            const { price, period } = formatPrice(plan, annual);
            return (
              <div key={name} className={`lp-price-card ${featured ? 'lp-price-card-featured' : ''}`}>
                {featured && <span className="lp-price-ribbon">RECOMMENDED</span>}
                <h3>{name}</h3>
                <div className="lp-price-value">
                  {price}
                  <span>{period}</span>
                </div>
                {annual
                  ? <p className="lp-price-saving">Save {rupees(plan.annualSaving)} · {rupees(monthly)} / mo value</p>
                  : <p className="lp-price-saving">{rupees(plan.annual)} / yr billed annually</p>}
                <ul className="lp-price-specs">
                  <li><span>AI CV screens</span><strong>{screens} / mo</strong></li>
                  <li><span>Reports</span><strong>{reports} / mo</strong></li>
                  <li><span>Users</span><strong>{users}</strong></li>
                </ul>
                {note && <p className="lp-price-note">{note}</p>}
              </div>
            );
          })}
        </div>

        <div className="lp-pilot">
          <div className="lp-pilot-tag">Launch offer</div>
          <h3>14-day Assisted Pilot — <strong>₹4,999</strong></h3>
          <ul className="lp-pilot-list">
            <li>100 AI CV screens</li>
            <li>5 Decision Fit reports</li>
            <li>Assisted setup and onboarding</li>
          </ul>
          <p>The full ₹4,999 pilot fee is credited against any annual plan if you upgrade within 15 days.</p>
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
