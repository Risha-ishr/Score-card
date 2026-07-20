import React, { useState, useEffect, useRef } from 'react';
import ReactPaginate from 'react-paginate';
import { getEmployees, uploadExcel } from '../../api';
import ScoreForm from '../../components/ScoreForm';
import AddCandidateForm from '../AddCandidateForm';
import './AdminDashboard.scss';
import SimpleBox from '../SimpleBox';

const PAGE_SIZE = 10;

function perfStyle(pct) {
  if (pct == null) return { color: '#9CA3AF', bar: '#E5E7EB' };
  if (pct >= 80)   return { color: '#10B981', bar: '#10B981' };
  if (pct >= 60)   return { color: '#3B82F6', bar: '#3B82F6' };
  if (pct >= 40)   return { color: '#F59E0B', bar: '#F59E0B' };
  return              { color: '#EF4444',  bar: '#EF4444'  };
}

export default function AdminDashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [page,      setPage]      = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [uploadMsg,    setUploadMsg]    = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [search,       setSearch]       = useState('');
  const [showAddForm,  setShowAddForm]  = useState(false);
  const fileRef = useRef();

  const searchTimer = useRef(null);

  const loadEmployees = async (searchTerm = '') => {
    setLoading(true);
    setPage(0);
    try { setEmployees(await getEmployees(searchTerm)); } catch { /* empty */ }
    setLoading(false);
  };

  useEffect(() => { loadEmployees(); }, []);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadEmployees(value), 400);
  };

  const pageCount     = Math.ceil(employees.length / PAGE_SIZE);
  const offset        = page * PAGE_SIZE;
  const pageEmployees = employees.slice(offset, offset + PAGE_SIZE);

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
      loadEmployees(search);
    } catch (err) {
      setUploadMsg({ text: 'Error: ' + err.message, ok: false });
    }
    setUploading(false);
    e.target.value = '';
  };

  if (selected) {
    return <ScoreForm employee={selected} onBack={() => { setSelected(null); loadEmployees(search); }} />;
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
            <p className="sub">
              {search.trim()
                ? `${employees.length} result(s) found`
                : `${employees.length} employees`
              } — page {page + 1} of {pageCount || 1}
            </p>
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
            <button className="btn-primary" onClick={() => setShowAddForm(true)}>
              + Add Candidate
            </button>
          </div>
        </div>

        <div className="search-bar-wrap" >
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by employee, client or position…"
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => { setSearch(''); loadEmployees(''); setPage(0); }}>✕</button>
          )}
        </div>
        <div>
          Click to look at the TimeStamp
        </div>

        {uploadMsg && (
          <div className={`alert ${uploadMsg.ok ? 'alert-success' : 'alert-error'}`}>
            {uploadMsg.text}
          </div>
        )}

        {loading ? (
          <SimpleBox/>
        ) : (
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Client</th>
                  <th>Position</th>
                  <th>Weighted Score</th>
                  <th>Last Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                      No results found for "<strong>{search}</strong>"
                    </td>
                  </tr>
                )}
                {pageEmployees.map((emp, i) => {
                  const ps = perfStyle(emp.weighted_pct);
                  return (
                    <tr key={emp.id}>
                      <td className="td-num">{offset + i + 1}</td>
                      <td>
                        <div className="emp-name">{emp.name}</div>
                        <div className="emp-email" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => { window.location.href = `mailto:${emp.email}`; }}
                        >{emp.email || '—'}</div>
                      </td>
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
            {/* <div className="pagination-box" > */}
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
              {/* <input
              type="number"
              min={1}
              max={pageCount}
              value={page + 1}
              onChange={(e) => {
                const value = e.target.value;
                console.log('value', value )
                console.log('pagecount', pageCount )
      
                setPage(e.target.value)}}
              placeholder={`1-${pageCount}`}
              className="pg-goto-input"
              /> */}
            {/* </div> */}
          </div>
        )}

      </div>

      {showAddForm && (
        <AddCandidateForm
          onClose={() => setShowAddForm(false)}
          onAdded={() => loadEmployees(search)}
        />
      )}
    </div>
  );
}
