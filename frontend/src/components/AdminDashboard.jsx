import React, { useState, useEffect, useRef } from 'react';
import { getEmployees, uploadExcel } from '../api';
import ScoreForm from './ScoreForm';

function perfStyle(pct) {
  if (pct == null) return { color: '#9CA3AF', bar: '#E5E7EB' };
  if (pct >= 80)   return { color: '#10B981', bar: '#10B981' };
  if (pct >= 60)   return { color: '#3B82F6', bar: '#3B82F6' };
  if (pct >= 40)   return { color: '#F59E0B', bar: '#F59E0B' };
  return              { color: '#EF4444',  bar: '#EF4444'  };
}

export default function AdminDashboard({ user, onLogout }) {
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState(null);
  const [uploadMsg,   setUploadMsg]   = useState('');
  const [uploading,   setUploading]   = useState(false);
  const fileRef = useRef();

  const loadEmployees = async () => {
    setLoading(true);
    try { setEmployees(await getEmployees()); } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadEmployees(); }, []);

  const handleExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const res     = await uploadExcel(file);
      const updated = res.results.filter(r => r.status === 'updated').length;
      const created = res.results.filter(r => r.status === 'created').length;
      let msg = `${updated} record(s) updated.`;
      if (created) msg += `  ${created} new employee(s) created from Excel.`;
      setUploadMsg({ text: msg, ok: true });
      loadEmployees();
    } catch (err) {
      setUploadMsg({ text: 'Error: ' + err.message, ok: false });
    }
    setUploading(false);
    e.target.value = '';
  };

  if (selected) {
    return <ScoreForm employee={selected} onBack={() => { setSelected(null); loadEmployees(); }} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span>📋</span> Applicant Scorecard
        </div>
        <div className="nav-right">
          <span className="nav-user">👤 {user.name}</span>
          <span className="badge badge-admin">Admin</span>
          <button className="btn-logout" onClick={onLogout}> Logout </button>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <div>
            <h2>Employee Scorecards</h2>
            <p className="sub">Manage and score all {employees.length} employees</p>
          </div>
          <div className="header-actions">
            <input type="file" accept=".xlsx,.xls" ref={fileRef} onChange={handleExcel} hidden />
            <button
              className="btn-secondary"
              onClick={() => fileRef.current.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ Processing…' : '📤 Import from Excel'}
            </button>
          </div>
        </div>

        {uploadMsg && (
          <div className={`alert ${uploadMsg.ok ? 'alert-success' : 'alert-error'}`}>
            {uploadMsg.text}
          </div>
        )}

        {loading ? (
          <div className="loading-state">Loading employees…</div>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Applicant Name</th>
                  <th>Client</th>
                  <th>Position</th>
                  <th>Weighted Score</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, i) => {
                  const ps = perfStyle(emp.weighted_pct);
                  return (
                    <tr key={emp.id}>
                      <td className="td-num">{i + 1}</td>
                      <td>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-email">{emp.email || '—'}</div>
                      </td>
                      <td>{emp.applicant_name || <span className="muted">—</span>}</td>
                      <td>{emp.client        || <span className="muted">—</span>}</td>
                      <td>{emp.position      || <span className="muted">—</span>}</td>
                      <td>
                        {emp.weighted_pct != null ? (
                          <div className="score-col">
                            <div className="mini-bar">
                              <div className="mini-fill" style={{ width: `${emp.weighted_pct}%`, background: ps.bar }} />
                            </div>
                            <span className="score-pct" style={{ color: ps.color }}>
                              {emp.weighted_pct}%
                            </span>
                          </div>
                        ) : (
                          <span className="muted">Not scored</span>
                        )}
                      </td>
                      <td>
                        {emp.updated_at
                          ? new Date(emp.updated_at).toLocaleDateString('en-IN')
                          : <span className="muted">—</span>}
                      </td>
                      <td>
                        <button
                          className={emp.scorecard_id ? 'btn-edit' : 'btn-score'}
                          onClick={() => setSelected(emp)}
                        >
                          {emp.scorecard_id ? 'Edit Score' : 'Score Now'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
