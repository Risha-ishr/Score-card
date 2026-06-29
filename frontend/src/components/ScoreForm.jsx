import React, { useState, useEffect } from 'react';
import { getEmployeeScorecard, getParameters, saveEmployeeScorecard } from '../api';

const MULT    = { 1: 3, 2: 2, 3: 1 };
const MAX_TOT = 115;

function perf(pct) {
  if (pct >= 80) return { label: 'Excellent',          color: '#10B981' };
  if (pct >= 60) return { label: 'Good',               color: '#3B82F6' };
  if (pct >= 40) return { label: 'Average',            color: '#F59E0B' };
  return              { label: 'Needs Improvement',  color: '#EF4444' };
}

export default function ScoreForm({ employee, onBack }) {
  const [params,  setParams]  = useState([]);
  const [form,    setForm]    = useState({ applicant_name:'', client:'', position:'', jd_shared:false, remarks:'' });
  const [scores,  setScores]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pData, sData] = await Promise.all([
          getParameters(),
          getEmployeeScorecard(employee.id)
        ]);
        setParams(pData);

        const defaultScores = {};
        pData.forEach(p => { defaultScores[p.id] = 3; });

        if (sData.scorecard) {
          const sc = sData.scorecard;
          setForm({
            applicant_name: sc.applicant_name || '',
            client:         sc.client         || '',
            position:       sc.position       || '',
            jd_shared:      !!sc.jd_shared,
            remarks:        sc.remarks        || ''
          });
          const m = {};
          sData.scores.forEach(s => { m[s.parameter_id] = s.score; });
          setScores({ ...defaultScores, ...m });
        } else {
          setScores(defaultScores);
        }
      } catch (err) {
        setMsg({ ok: false, text: err.message });
      }
      setLoading(false);
    })();
  }, [employee.id]);

  const weightedTotal = params.reduce((s, p) => s + (scores[p.id] || 0) * MULT[p.weightage], 0);
  const pct           = Math.round((weightedTotal / MAX_TOT) * 100);
  const p             = perf(pct);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const scoresArr = Object.entries(scores).map(([pid, sc]) => ({
        parameter_id: parseInt(pid),
        score:        parseInt(sc)
      }));
      await saveEmployeeScorecard(employee.id, { ...form, scores: scoresArr });
      setMsg({ ok: true, text: 'Scorecard saved successfully!' });
    } catch (err) {
      setMsg({ ok: false, text: 'Error: ' + err.message });
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="app">
      <nav className="navbar"><div className="nav-brand">📋 Applicant Scorecard</div></nav>
      <div className="loading-state">Loading…</div>
    </div>
  );

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">📋 Applicant Scorecard</div>
        <div className="nav-right">
          <button className="btn-back" onClick={onBack}>← Back to List</button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <div>
            <h2>Score: {employee.name}</h2>
            <p className="sub">@{employee.username}</p>
          </div>
          <div className="score-badge" style={{ borderColor: p.color, color: p.color }}>
            {weightedTotal}/{MAX_TOT} ({pct}%) &mdash; {p.label}
          </div>
        </div>

        {/* Applicant Details */}
        <div className="card form-card">
          <h3 className="card-title">Applicant Details</h3>
          <div className="form-grid-2">
            <div className="field">
              <label>Applicant Name</label>
              <input
                type="text" placeholder="Enter applicant name"
                value={form.applicant_name}
                onChange={e => setForm(f => ({ ...f, applicant_name: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Client</label>
              <input
                type="text" placeholder="Enter client name"
                value={form.client}
                onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Position</label>
              <input
                type="text" placeholder="Position / Role"
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>JD Shared?</label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.jd_shared}
                  onChange={e => setForm(f => ({ ...f, jd_shared: e.target.checked }))}
                />
                Yes, Job Description was shared
              </label>
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="card form-card">
          <h3 className="card-title">Score Parameters</h3>
          <div className="params-legend">
            <span className="legend-item"><span className="w-chip w1">W1</span> Weightage 1 → ×3 (Highest)</span>
            <span className="legend-item"><span className="w-chip w2">W2</span> Weightage 2 → ×2</span>
            <span className="legend-item"><span className="w-chip w3">W3</span> Weightage 3 → ×1 (Lowest)</span>
          </div>

          <div className="param-header-row">
            <span>Parameter</span>
            <span>Weight</span>
            <span>Score (click to select)</span>
            <span>Weighted</span>
          </div>

          {params.map(p => {
            const score   = scores[p.id] || 1;
            const mult    = MULT[p.weightage];
            const wtd     = score * mult;
            const maxWtd  = 5 * mult;
            return (
              <div key={p.id} className="param-row">
                <div className="param-name-col">
                  <span className="param-name">{p.name}</span>
                  {p.description && <span className="param-desc">{p.description}</span>}
                </div>
                <div>
                  <span className={`w-chip w${p.weightage}`}>W{p.weightage} ×{mult}</span>
                </div>
                <div className="score-dots-row">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={`dot-btn ${score >= n ? 'dot-active' : ''}`}
                      onClick={() => setScores(s => ({ ...s, [p.id]: n }))}
                      title={`Score ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="score-label">{score}/5</span>
                </div>
                <div className="wtd-col">
                  <strong>{wtd}</strong>
                  <span className="muted">/{maxWtd}</span>
                </div>
              </div>
            );
          })}

          <div className="total-row-bar">
            <span>Weighted Total</span>
            <div className="total-bar-wrap">
              <div className="total-bar">
                <div className="total-fill" style={{ width: `${pct}%`, background: perf(pct).color }} />
              </div>
              <span className="total-label" style={{ color: perf(pct).color }}>
                {weightedTotal}/115 &nbsp;({pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div className="card form-card">
          <h3 className="card-title">Remarks</h3>
          <textarea
            rows={3}
            placeholder="Add any notes or observations…"
            value={form.remarks}
            onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
          />
        </div>

        {msg && (
          <div className={`alert ${msg.ok ? 'alert-success' : 'alert-error'}`}>{msg.text}</div>
        )}

        <div className="form-actions">
          <button className="btn-outline" onClick={onBack}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Scorecard'}
          </button>
        </div>
      </div>
    </div>
  );
}
