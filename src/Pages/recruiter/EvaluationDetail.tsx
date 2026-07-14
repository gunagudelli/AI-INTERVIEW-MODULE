import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Rating from '@mui/material/Rating';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { recruiterAPI, recruiterEvaluationAPI } from '../../services/recruiterAPI';
import { RATING_CATEGORIES, PanelEvaluation, RECOMMENDATION_META } from '../../types/panelEvaluation';

const EvaluationDetail: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<PanelEvaluation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    setLoading(true);
    // An application can have more than one panel assignment (multiple interviewers),
    // so evaluations are looked up per-assignment, not directly by applicationId.
    recruiterAPI.getPanelAssignments(applicationId)
      .then(async (assignments: any[]) => {
        const results = await Promise.all(
          assignments.map((a: any) =>
            recruiterEvaluationAPI.getByAssignment(a.id).catch(() => null)
          )
        );
        setEvaluations(results.filter(Boolean) as PanelEvaluation[]);
      })
      .catch(() => setError('Failed to load evaluations for this application.'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading…</div>;
  }

  if (error) {
    return <div style={{ padding: 24, textAlign: 'center', color: '#DC2626', fontSize: 13 }}>{error}</div>;
  }

  if (!evaluations.length) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
        No interviewer evaluations have been submitted for this application yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Interview Evaluations</h2>
      {evaluations.map(ev => {
        const recMeta = ev.recommendation ? RECOMMENDATION_META[ev.recommendation] : { bg: '#F1F5F9', color: '#64748B' };
        return (
          <div key={ev.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '20px 22px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{ev.panel_member_name}</p>
                <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{ev.job_title} · Submitted {ev.submitted_at ? new Date(ev.submitted_at).toLocaleString('en-IN') : '—'}</p>
              </div>
              {ev.recommendation && (
                <Chip label={ev.recommendation} sx={{ backgroundColor: recMeta.bg, color: recMeta.color, fontWeight: 700 }} />
              )}
            </div>

            <p style={{ margin: '0 0 6px', fontSize: 13 }}>
              Overall Score: <strong>{ev.overall_score != null ? `${ev.overall_score}/10` : 'N/A'}</strong>
              {ev.interview_duration_minutes != null && <> · Duration: {ev.interview_duration_minutes} min</>}
            </p>
            {ev.meeting_link && (
              <p style={{ margin: '0 0 12px', fontSize: 13 }}>
                <a href={ev.meeting_link} target="_blank" rel="noreferrer" style={{ color: ev.teams_meeting_id ? '#5B5FC7' : '#1D4ED8', fontWeight: 700, textDecoration: 'none' }}>
                  {ev.teams_meeting_id ? '🟣 Join Teams Meeting' : 'Join Meeting →'}
                </a>
                {ev.teams_meeting_id && <span style={{ color: '#94A3B8', fontSize: 11, marginLeft: 8 }}>ID: {ev.teams_meeting_id}</span>}
              </p>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
              {RATING_CATEGORIES.map(cat => (
                <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <span style={{ fontSize: 12.5, color: '#374151', minWidth: 180 }}>{cat.label}</span>
                  <Rating max={10} precision={1} value={Number(ev.ratings?.[cat.key]) || 0} readOnly size="small" />
                </Box>
              ))}
            </Box>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, fontSize: 12.5 }}>
              <div><strong>Strengths:</strong> {ev.strengths || '—'}</div>
              <div><strong>Areas for Improvement:</strong> {ev.areas_for_improvement || '—'}</div>
              <div><strong>Interview Notes:</strong> {ev.interview_notes || '—'}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvaluationDetail;
