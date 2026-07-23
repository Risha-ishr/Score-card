import React, { useState, useEffect } from 'react';
import { Form, Input, Checkbox, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { getEmployeeScorecard, getParameters, saveEmployeeScorecard } from '../api';
import LineForm from './LineForm';
const MULT    = { 1: 3, 2: 2, 3: 1 };
const MAX_TOT = 115;

function perf(pct) {
  if (pct >= 80) return { label: 'Excellent',          color: '#10B981' };
  if (pct >= 60) return { label: 'Good',               color: '#3B82F6' };
  if (pct >= 40) return { label: 'Average',            color: '#F59E0B' };
  return              { label: 'Needs Improvement',  color: '#EF4444' };
}

export default function ScoreForm({ employee, onBack }) {
  const [antForm] = Form.useForm();
  const [params,  setParams]  = useState([]);
  const [scores,  setScores]  = useState({});
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pData, sData] = await Promise.all([
          getParameters(),
          getEmployeeScorecard(employee.id)
        ]);
        setParams(pData);
        setChartData(pData?.scores)
        console.log('sData...', sData)

        const employeeName = sData?.employee?.name  || employee.name  || '';
        const email        = sData?.employee?.email || employee.email || '';

        if (sData.scorecard) {
          const sc = sData.scorecard;
          console.log('scorecard', dayjs(sc?.jd_shared_date).format('YYYY-MM-DD') )
          antForm.setFieldsValue({
            employee_name:  employeeName,
            email,
            client:         sc.client   || '',
            position:       sc.position || '',
            jd_shared:      !!sc.jd_shared,
            jd_shared_date: sc.jd_shared_date ? dayjs(sc.jd_shared_date) : null,
          });
          setRemarks(sc.remarks || '');
          const m = {};
          sData.scores.forEach(s => { m[s.parameter_id] = s.score; });
          setScores({ ...m });
        } else {
          antForm.setFieldsValue({
            employee_name: employeeName,
            email,
            client:    '',
            position:  '',
            jd_shared: false,
          });
        }
      } catch (err) {
        console.log('error', error)
        setMsg({ ok: false, text: err.message });
      }
      setLoading(false);
    })();
  }, [employee.id]);

  const weightedTotal = params.reduce((s, p) => s + (scores[p.id] || 0) * MULT[p.weightage], 0);
  const pct           = Math.round((weightedTotal / MAX_TOT) * 100);
  const p             = perf(pct);

  const handleSave = async () => {
    try {
      await antForm.validateFields();
    } catch {
      setMsg({ ok: false, text: 'Please fill in all required Applicant Details fields.' });
      return;
    }

    setSaving(true);
    setMsg(null);
    try {
      const values    = antForm.getFieldsValue();
      const scoresArr = Object.entries(scores).map(([pid, sc]) => ({
        parameter_id: parseInt(pid),
        score:        parseInt(sc)
      }));
      console.log('values...', dayjs(values.jd_shared_date).format('YYYY-MM-DD'))
      await saveEmployeeScorecard(employee.id, { ...values, remarks, scores: scoresArr });
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
          <Form form={antForm} layout="vertical">
            <div className="form-grid-2">
              <Form.Item
                label="Applicant Name"
                name="employee_name"
                rules={[{ required: true, message: 'Please Enter Applicant Name!' }]}
              >
                <Input 
                placeholder="Enter Applicant Name" />
              </Form.Item>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please Enter Email!' },
                  { type: 'email', message: 'Enter a valid email address' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
              <Form.Item
                label="Client"
                name="client"
                rules={[{ required: true, message: 'Please Enter Client Name!' }]}
              >
                <Input placeholder="Enter client name" />
              </Form.Item>
              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Please Enter Position!' }]}
              >
                <Input placeholder="Position / Role" />
              </Form.Item>
              <Form.Item name="jd_shared" valuePropName="checked">
                <Checkbox>Yes, Job Description was shared</Checkbox>
              </Form.Item>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.jd_shared !== currentValues.jd_shared
                    }
                  >
                  {({ getFieldValue }) =>
                    getFieldValue('jd_shared') ? (
                      <Form.Item
                        // label="Date JD Shared"
                        name="jd_shared_date"
                        rules={[{ required: true, message: 'Please Select JD Shared Date' }]}
                      >
                    <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder='JD Shared Date'
                    />
                  </Form.Item>
                    ) : null
                  }
              </Form.Item>
            </div>
          </Form>
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
            const score   = scores[p.id] || 0;
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
                      className={`dot-btn ${score === n ? 'dot-active' : ''}`}
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
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
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
        {/* <LineForm scores={chartData} /> */}
      </div>
      
    </div>
  );
}
