import React, { useState } from 'react';
import { addCandidate } from '../api';

export default function AddCandidateForm({ onClose, onAdded }) {
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addCandidate(name.trim(), email.trim());
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Candidate</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="field">
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Enter candidate name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Email <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Enter email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
