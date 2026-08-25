import React, { useState, useEffect } from 'react';
import ReactPaginate from 'react-paginate';
import { getMyScorecard } from '../api';

const PAGE_SIZE = 5;

function perf(pct) {
  if (pct >= 80) return { label: 'Excellent',         color: '#10B981' };
  if (pct >= 60) return { label: 'Good',              color: '#3B82F6' };
  if (pct >= 40) return { label: 'Average',           color: '#F59E0B' };
  return              { label: 'Needs Improvement', color: '#EF4444' };
}

export default function EmployeeDashboard({ user, onLogout }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(0);

  useEffect(() => {
    (async () => {
      try { setData(await getMyScorecard()); } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  const allScores = data?.scores ?? [];
  // weightage is each parameter's % share of the total (sums to 100); score is 1-5.
  const pct = allScores.length
    ? Math.round(allScores.reduce((s, r) => s + (r.score / 5) * r.weightage, 0))
    : 0;
  const p   = perf(pct);

  const pageCount  = Math.ceil(allScores.length / PAGE_SIZE);
  const offset     = page * PAGE_SIZE;
  const pageScores = allScores.slice(offset, offset + PAGE_SIZE);

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">📋 Applicant Scorecard</div>
        <div className="nav-right">
          <span className="nav-user">👤 {user.name}</span>
          <span className="badge badge-emp">Employee</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="page">
        {loading ? (
          <div className="loading-state">Loading your scorecard…</div>
        ) : !data?.scorecard ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Scorecard Yet</h3>
            <p>Your admin hasn't scored you yet. Please check back later.</p>
          </div>
        ) : (
          <>
            <div className="page-header">
              <div>
                <h2>My Scorecard</h2>
                <p className="sub">Your evaluation results</p>
              </div>
              <div className="score-badge" style={{ borderColor: p.color, color: p.color }}>
                {pct}% &mdash; {p.label}
              </div>
            </div>

            {/* Info cards */}
            <div className="info-row">
              {[
                { label: 'Client',    value: data.scorecard.client },
                { label: 'Position',  value: data.scorecard.position },
                { label: 'JD Shared', value: data.scorecard.jd_shared ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="info-card">
                  <div className="info-label">{label}</div>
                  <div className="info-value">{value || '—'}</div>
                </div>
              ))}
            </div>

            {/* Scorecard table */}
            <div className="card">
              <h3 className="card-title">Parameter Breakdown</h3>
              <table className="table scores-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Parameter</th>
                    <th>Weight</th>
                    <th>Score</th>
                    <th>Weighted</th>
                    <th>Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {pageScores.map((s, i) => {
                    const wtd    = Math.round((s.score / 5) * s.weightage * 10) / 10;
                    const maxWtd = s.weightage;
                    return (
                      <tr key={s.parameter_id}>
                        <td className="td-num">{offset + i + 1}</td>
                        <td>
                          <div>{s.name}</div>
                          {s.description && <div className="param-desc-sm">{s.description}</div>}
                        </td>
                        <td><span className="w-chip">{s.weightage}%</span></td>
                        <td>
                          <div className="stars-row">
                            {[1,2,3,4,5].map(n => (
                              <span key={n} className={`star ${s.score >= n ? 'star-on' : ''}`}>★</span>
                            ))}
                            <span className="star-num">{s.score}/5</span>
                          </div>
                        </td>
                        <td><strong>{wtd}</strong><span className="muted">/{maxWtd}</span></td>
                        <td>
                          <div className="mini-bar">
                            <div className="mini-fill" style={{ width: `${(s.score / 5) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="total-foot">
                    <td colSpan={4}><strong>Total Weighted Score</strong></td>
                    <td><strong>{pct}%</strong></td>
                    <td>
                      <div className="mini-bar">
                        <div className="mini-fill" style={{ width: `${pct}%`, background: p.color }} />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>

              {pageCount > 1 && (
                <ReactPaginate
                  pageCount={pageCount}
                  forcePage={page}
                  onPageChange={({ selected }) => setPage(selected)}
                  previousLabel="‹ Prev"
                  nextLabel="Next ›"
                  breakLabel="…"
                  containerClassName="pagination"
                  pageClassName="pg-item"
                  pageLinkClassName="pg-link"
                  previousClassName="pg-item"
                  previousLinkClassName="pg-link pg-nav"
                  nextClassName="pg-item"
                  nextLinkClassName="pg-link pg-nav"
                  breakClassName="pg-item"
                  breakLinkClassName="pg-link pg-break"
                  activeClassName="pg-active"
                  disabledClassName="pg-disabled"
                  marginPagesDisplayed={1}
                  pageRangeDisplayed={3}
                />
              )}

              {/* Overall progress bar */}
              <div className="overall-section">
                <div className="overall-bar">
                  <div className="overall-fill" style={{ width: `${pct}%`, background: p.color }} />
                </div>
                <div className="overall-labels">
                  <span>0%</span>
                  <span style={{ color: p.color, fontWeight: 700 }}>
                    {pct}% — {p.label}
                  </span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {data.scorecard.remarks && (
              <div className="card remarks-card">
                <h3 className="card-title">Admin Remarks</h3>
                <p>{data.scorecard.remarks}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
