import React from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import ScoreForm from './ScoreForm/ScoreForm';

export default function ScoreFormPage() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.employee) return <Navigate to="/scores" replace />;

  return (
    <ScoreForm
      employee={state.employee}
      onBack={() => navigate('/scores')}
    />
  );
}
