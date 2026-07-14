import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterEvaluationAPI } from '../../services/recruiterAPI';
import { PanelEvaluation, EVALUATION_STATUS_META, RECOMMENDATION_META } from '../../types/panelEvaluation';

const EvaluationsList: React.FC = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState<PanelEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    recruiterEvaluationAPI.list({ status: statusFilter || undefined })
      .then((res: PanelEvaluation[]) => setEvaluations(res || []))
      .catch(() => setEvaluations([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Interview Evaluations</h2>

      <div style={{ marginBottom: 12 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }}>
          <option value="">All statuses</option>
          <option value="draft">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading…</p>
        ) : evaluations.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No evaluations yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Candidate', 'Job', 'Panel Member', 'Overall Score', 'Recommendation', 'Status', 'Submitted At'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluations.map(ev => {
                const statusMeta = EVALUATION_STATUS_META[ev.status] || { label: ev.status, color: '#64748B', bg: '#F1F5F9' };
                const recMeta = ev.recommendation ? RECOMMENDATION_META[ev.recommendation] : { color: '#94A3B8', bg: '#F1F5F9' };
                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}
                    onClick={() => navigate(`/recruiter/applications/${ev.application_id}/evaluation`)}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{ev.candidate_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{ev.job_title}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{ev.panel_member_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#0F172A' }}>{ev.overall_score != null ? `${ev.overall_score}/10` : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {ev.recommendation ? (
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: recMeta.bg, color: recMeta.color }}>{ev.recommendation}</span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusMeta.bg, color: statusMeta.color }}>{statusMeta.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8' }}>
                      {ev.submitted_at ? new Date(ev.submitted_at).toLocaleString('en-IN') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default EvaluationsList;
