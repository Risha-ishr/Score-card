import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Form, Input, Checkbox, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { getEmployeeScorecard, getParameters, saveEmployeeScorecard, uploadResume, parseResume, fetchResumeFile, getResumeParsed } from '../../api';
import ResumeBook from '../../components/ResumeBook/ResumeBook';
import './ScoreForm.scss'
import ResumeBook1 from '../../components/ResumeBook/ResumeBook1';
function perf(pct) {
  if (pct >= 80) return { label: 'Excellent',          color: '#10B981' };
  if (pct >= 60) return { label: 'Good',               color: '#3B82F6' };
  if (pct >= 40) return { label: 'Average',            color: '#F59E0B' };
  return              { label: 'Needs Improvement',  color: '#EF4444' };
}

export default function ScoreForm({ employee, onBack }) {
  const [antForm] = Form.useForm();
  const [params,       setParams]       = useState([]);
  const [scores,       setScores]       = useState({});
  const [remarks,      setRemarks]      = useState('');
  const [displayName,  setDisplayName]  = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [skills,     setSkills]     = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [resumeData, setResumeData] = useState(null);
  const [matchedKeywords, setMatchedKeywords] = useState([]);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeParsing,   setResumeParsing]   = useState(false);
  const resumeInputRef = useRef(null);


  const containerRef = useRef(null);
  const dotRefs = useRef({});
  const [linePoints, setLinePoints] = useState([]);

  const setDotRef = (paramId, n) => (el) => {
    if (!dotRefs.current[paramId]) dotRefs.current[paramId] = {};
    dotRefs.current[paramId][n] = el;
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pData, sData] = await Promise.all([
          getParameters(),
          getEmployeeScorecard(employee.id)
        ]);
        setParams(pData);

        const email = sData?.employee?.email || employee?.email || '';

        if (sData.scorecard) {
          const sc = sData.scorecard;
          setDisplayName(sc.applicant_name || '');
          antForm.setFieldsValue({
            applicant_name: sc.applicant_name || '',
            email,
            client:         sc.client   || '',
            position:       sc.position || '',
            jd_shared:      true,
            jd_shared_date: sc.jd_shared_date ? dayjs(sc.jd_shared_date) : null,
          });
          setRemarks(sc.remarks || '');
          setSkills(sc.skills || []);
          setResumeName(sc.resume_filename || '');
          // setResumeData(sc.resume_data || null);
          setMatchedKeywords([]);

          // The scorecard payload only carries the raw resume_data blob; fetch
          // the dedicated parsed-resume endpoint for the fuller picture (skills
          // reconciled with saved ones, plus matched/unmatched keywords) when a
          // resume is on file.
          if (sc.resume_data) {
            try {
              const parsedRes = await getResumeParsed(employee.id);
              setResumeData(parsedRes.resume_data || null);
              setSkills(parsedRes.skills || sc.skills || []);
              setMatchedKeywords(parsedRes.matched_keywords || []);
            } catch (err) {
              // Fall back silently to the data already set from the scorecard payload.
              console.log('error:', err)
            }
          }

          const m = {};
          sData.scores.forEach(s => { m[s.parameter_id] = s.score; });
          setScores({ ...m });
        } else {
          setDisplayName('');
          antForm.setFieldsValue({
            applicant_name: '',
            email,
            client:    '',
            position:  '',
            jd_shared: true,
          });
        }
      } catch (err) {
        console.log('error', err);
        setMsg({ ok: false, text: err.message });
      }
      setLoading(false);
    })();
  }, [employee.id]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const points = params.map(p => {
      const score = scores[p.id] || 0;
      const el = dotRefs.current[p.id]?.[score];
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top + rect.height / 2 - containerRect.top,
      };
    }).filter(Boolean);

    setLinePoints(points);
  }, [params, scores]);

  useEffect(() => {
    const handleResize = () => setScores(s => ({ ...s }));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // weightage is each parameter's % share of the total (sums to 100); score is 1-5.
  const pct = Math.round(params.reduce((s, p) => s + ((scores[p.id] || 0) / 5) * p.weightage, 0));
  const p   = perf(pct);

  const handleSkillKeyDown = (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = skillInput.trim();
    if (!value) return;
    setSkills(s => (s.some(sk => sk.toLowerCase() === value.toLowerCase()) ? s : [...s, value]));
    setSkillInput('');
  };

  const handleRemoveSkill = async (skill) => {
    const prevSkills = skills;
    const nextSkills = skills.filter(sk => sk !== skill);
    setSkills(nextSkills);

    try {
      const values    = antForm.getFieldsValue();
      const scoresArr = Object.entries(scores).map(([pid, sc]) => ({
        parameter_id: parseInt(pid),
        score:        parseInt(sc)
      }));
      await saveEmployeeScorecard(employee.id, { ...values, remarks, scores: scoresArr, skills: nextSkills });
    } catch (err) {
      setSkills(prevSkills);
      setMsg({ ok: false, text: 'Failed to remove skill: ' + err.message });
    }
  };

  const [resumeParseError, setResumeParseError] = useState(null);

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    setResumeParseError(null);
    setResumeUploading(true);
    setMsg(null);
    try {
      const res = await uploadResume(employee.id, file);
      setResumeName(res.filename);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
      setMsg({ ok: true, text: 'Resume uploaded successfully.' });
    } catch (err) {
      setMsg({ ok: false, text: 'Resume upload failed: ' + err.message });
    }
    setResumeUploading(false);
  };

  const handleParseResume = async () => {
    if (skills.length < 2) {
      setResumeParseError('Please add at least 2 skills before parsing the resume.');
      return;
    }
    if (!resumeName) {
      setResumeParseError('Please upload a resume first before parsing.');
      return;
    }
    setResumeParseError(null);
    setResumeParsing(true);
    setMsg(null);
    try {
      const values    = antForm.getFieldsValue();
      const scoresArr = Object.entries(scores).map(([pid, sc]) => ({
        parameter_id: parseInt(pid),
        score:        parseInt(sc),
      }));
      await saveEmployeeScorecard(employee.id, { ...values, remarks, scores: scoresArr, skills });

      const res = await parseResume(employee.id);
      setResumeData(res.parsed);
      setSkills(res.skills || []);
      setMatchedKeywords(res.parsed?.matched_keywords || []);
      setMsg({ ok: true, text: 'Resume parsed successfully.' });
    } catch (err) {
      setMsg({ ok: false, text: 'Resume parsing failed: ' + err.message });
    }
    setResumeParsing(false);
  };


  const handleViewResume = async () => {
    try {
      const blob = await fetchResumeFile(employee.id);
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      setMsg({ ok: false, text: 'Could not open resume: ' + err.message });
    }
  };

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
      await saveEmployeeScorecard(employee.id, { ...values, remarks, scores: scoresArr, skills });
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
            <h2>Score: {displayName || '—'}</h2>
          </div>
          <div className="score-badge" style={{ borderColor: p.color, color: p.color }}>
            {pct}% &mdash; {p.label}
          </div>
        </div>

        <div className="card form-card">
          <h3 className="card-title">Applicant Details</h3>
          <Form form={antForm} layout="vertical">
            <div className="form-grid-2">
              <Form.Item
                label="Applicant Name"
                name="applicant_name"
                rules={[{ required: true, message: 'Please Enter Applicant Name!' }]}
              >
                <Input placeholder="Enter Applicant Name" />
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
              <Form.Item name="jd_shared"
              rules={[{
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('Job Description must be shared')),
              }]}
              valuePropName="checked">
                <Checkbox >Yes, Job Description was shared</Checkbox>
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
        <div className="card form-card" style={{ position: 'relative' }} ref={containerRef}>
          <h3 className="card-title">Score Parameters</h3>
          <div className="params-legend">
            <span className="legend-item">Weight = this parameter's share of the total score</span>
          </div>

          <div className="param-header-row">
            <span>Parameter</span>
            <span>Weight</span>
            <span>Score (click to select)</span>
            <span>Weighted</span>
          </div>

          {params.map(p => {
            const score   = scores[p.id] || 0;
            const wtd     = Math.round((score / 5) * p.weightage * 10) / 10;
            const maxWtd  = p.weightage;
            return (
              <div key={p.id} className="param-row">
                <div className="param-name-col">
                  <span className="param-name">{p.name}</span>
                  {p.description && <span className="param-desc">{p.description}</span>}
                </div>
                <div>
                  <span className="w-chip">{p.weightage}%</span>
                </div>
                <div className="score-dots-row">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      ref={setDotRef(p.id, n)}
                      className={`dot-btn ${score === n ? 'dot-active-scoreForm' : ''}`}
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
                {pct}%
              </span>
            </div>
          </div>

          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          >
            <polyline
              points={linePoints.map(pt => `${pt.x},${pt.y}`).join(' ')}
              fill="none"
              stroke="#8ea3cf"
              strokeWidth="1"
            />
            {/* {linePoints.map((pt, i) => (
              <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#2563eb" />
            ))} */}
          </svg>
        </div>

        {/* Skills */}
        <div className="card form-card">
          <h3 className="card-title">Skills</h3>
          <div className="form-grid-2">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Skills</label>
              <input
                type="text"
                placeholder="Type a skill and press Enter"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              {skills.length > 0 && (
                <div className="skill-tags-wrap">
                  {skills.map(skill => {
                    const fromResume = matchedKeywords.some(k => k.toLowerCase() === skill.toLowerCase());
                    return (
                      <span key={skill} className={`skill-tag${fromResume ? ' skill-tag-matched' : ''}`}>
                        {fromResume && (
                          <span className="skill-tag-check" title="Found in resume">✓</span>
                        )}
                        {skill}
                        <button
                          type="button"
                          className="skill-tag-remove"
                          onClick={() => handleRemoveSkill(skill)}
                          title="Remove skill"
                        >
                          ✕
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              {matchedKeywords.length > 0 && (
                <p className="skill-tags-hint muted">
                  <span className="skill-tag-check" aria-hidden="true">✓</span> found in resume
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resume Upload */}
        <div className="card form-card">
          <h3 className="card-title">Resume</h3>
          <div className="resume-upload">
            <input
              ref={resumeInputRef}
              type="file"
              id="resume-upload-input"
              accept=".pdf,.docx"
              onChange={handleResumeChange}
              disabled={resumeUploading || resumeParsing}
              hidden
            />
            <label htmlFor="resume-upload-input" className="btn-outline resume-upload-btn">
              {resumeUploading ? '⏳ Uploading…' : '📎 Choose Resume File'}
            </label>
            {resumeName ? (
              <div className="resume-file-info">
                <span className="resume-file-name">{resumeName}</span>
                <button type="button" className="btn-outline" onClick={handleViewResume}>View</button>
              </div>
            ) : (
              <span className="muted">No file uploaded (PDF, DOCX)</span>
            )}
          </div>
          {resumeParseError && (
            <p className="alert alert-error" style={{ marginTop: '10px', marginBottom: '4px' }}>
              {resumeParseError}
            </p>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '12px', marginLeft: '18px' }}
            onClick={handleParseResume}
            disabled={resumeUploading || resumeParsing}
          >
            {resumeParsing ? '⏳ Parsing…' : '🔍 Parse Resume'}
          </button>
        </div>

        {/* Resume Book Preview */}
        {/* <ResumeBook resumeData={resumeData} /> */}
        <ResumeBook1 resumeData={resumeData} />

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
      </div>
    </div>
  );
}