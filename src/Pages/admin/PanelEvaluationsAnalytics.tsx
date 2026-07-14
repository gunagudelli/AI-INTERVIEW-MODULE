import React, { useEffect, useMemo, useState } from 'react';
import { adminEvaluationAPI } from '../../services/recruiterAPI';
import {
  EvaluationStatistics, PanelEvaluation,
  EVALUATION_STATUS_META, RECOMMENDATION_META,
} from '../../types/panelEvaluation';
import { COLORS, RADIUS, SHADOW } from '../../AIMockInterview/admin/adminTheme';

const StatPill: React.FC<{ label: string; value: React.ReactNode; dot: string }> = ({ label, value, dot }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.sm, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
    <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{value}</span>
    <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

const PanelEvaluationsAnalytics: React.FC = () => {
  const [stats, setStats] = useState<EvaluationStatistics | null>(null);
  const [evaluations, setEvaluations] = useState<PanelEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [recommendationFilter, setRecommendationFilter] = useState('');
  const [search, setSearch] = useState('');
  const [breakdownView, setBreakdownView] = useState<'panel' | 'recruiter' | 'monthly'>('panel');

  const load = () => {
    setLoading(true);
    Promise.all([
      adminEvaluationAPI.getStatistics(),
      adminEvaluationAPI.list({ status: statusFilter || undefined, recommendation: recommendationFilter || undefined }),
    ])
      .then(([statsRes, listRes]) => {
        setStats(statsRes || null);
        setEvaluations(listRes || []);
      })
      .catch(() => { setStats(null); setEvaluations([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, recommendationFilter]);

  const filteredEvaluations = useMemo(() => {
    if (!search.trim()) return evaluations;
    const q = search.trim().toLowerCase();
    return evaluations.filter(ev =>
      ev.candidate_name?.toLowerCase().includes(q) || ev.panel_member_name?.toLowerCase().includes(q)
    );
  }, [evaluations, search]);

  const handleUnlock = async (id: number) => {
    const reason = window.prompt('Reason for unlocking this evaluation (required):');
    if (!reason || !reason.trim()) return;
    try {
      await adminEvaluationAPI.unlock(id, reason.trim());
      load();
    } catch (err) {
      window.alert('Failed to unlock evaluation.');
    }
  };

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 12px' }}>Interview Evaluations — Analytics</h2>

      {/* Stats — just the essentials: how many, how many left, and the outcome split */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <StatPill label="Total Interviews" value={stats?.totalInterviews ?? 0} dot={COLORS.brand} />
        <StatPill label="Pending Evaluations" value={stats?.pendingEvaluations ?? 0} dot={COLORS.warningDark} />
        <StatPill label="Hire %" value={`${stats?.recommendationBreakdown?.Hire ?? 0}%`} dot={RECOMMENDATION_META.Hire.color} />
        <StatPill label="Reject %" value={`${stats?.recommendationBreakdown?.Reject ?? 0}%`} dot={RECOMMENDATION_META.Reject.color} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }}>
          <option value="">All statuses</option>
          <option value="draft">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="locked">Locked</option>
        </select>
        <select value={recommendationFilter} onChange={e => setRecommendationFilter(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }}>
          <option value="">All recommendations</option>
          <option value="Strong Hire">Strong Hire</option>
          <option value="Hire">Hire</option>
          <option value="Hold">Hold</option>
          <option value="Reject">Reject</option>
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate or panel member…"
          style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151', minWidth: 220 }} />
      </div>

      {/* Evaluations table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading…</p>
        ) : filteredEvaluations.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No evaluations found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Candidate', 'Job', 'Panel Member', 'Recruiter', 'Score', 'Recommendation', 'Status', 'Submitted At', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredEvaluations.map(ev => {
                const statusMeta = EVALUATION_STATUS_META[ev.status] || { label: ev.status, color: '#64748B', bg: '#F1F5F9' };
                return (
                  <tr key={ev.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{ev.candidate_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{ev.job_title}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{ev.panel_member_name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{ev.recruiter_name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#0F172A' }}>{ev.overall_score != null ? `${ev.overall_score}/10` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#374151' }}>{ev.recommendation || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: statusMeta.bg, color: statusMeta.color }}>{statusMeta.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8' }}>
                      {ev.submitted_at ? new Date(ev.submitted_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {ev.status !== 'draft' && (
                        <button onClick={() => handleUnlock(ev.id)}
                          style={{ padding: '5px 11px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: '#DC2626', cursor: 'pointer' }}>
                          Unlock
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Breakdown — one table at a time, picked via dropdown, instead of 3 stacked sections */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>
            {breakdownView === 'panel' ? 'Panel Performance' : breakdownView === 'recruiter' ? 'Recruiter Performance' : 'Monthly Analytics'}
          </h3>
          <select value={breakdownView} onChange={e => setBreakdownView(e.target.value as typeof breakdownView)}
            style={{ padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12.5, color: '#374151' }}>
            <option value="panel">By Panel Member</option>
            <option value="recruiter">By Recruiter</option>
            <option value="monthly">By Month</option>
          </select>
        </div>

        {breakdownView === 'panel' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {(stats?.panelPerformance ?? []).length === 0 ? (
                <tr><td style={{ padding: 16, fontSize: 12.5, color: '#94A3B8' }}>No data yet.</td></tr>
              ) : stats!.panelPerformance.map(p => (
                <tr key={p.panel_member_name} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A' }}>{p.panel_member_name}</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#64748B' }}>{p.count} interviews</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A', textAlign: 'right' }}>{p.avg_score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {breakdownView === 'recruiter' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {(stats?.recruiterPerformance ?? []).length === 0 ? (
                <tr><td style={{ padding: 16, fontSize: 12.5, color: '#94A3B8' }}>No data yet.</td></tr>
              ) : stats!.recruiterPerformance.map(r => (
                <tr key={r.recruiter_name || 'unknown'} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A' }}>{r.recruiter_name || 'Unknown'}</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#64748B' }}>{r.count} interviews</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A', textAlign: 'right' }}>{r.avg_score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {breakdownView === 'monthly' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Month', 'Evaluations Submitted', 'Avg Score'].map(h => (
                  <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(stats?.monthly ?? []).length === 0 ? (
                <tr><td colSpan={3} style={{ padding: 16, fontSize: 12.5, color: '#94A3B8' }}>No data yet.</td></tr>
              ) : stats!.monthly.map(m => (
                <tr key={m.month} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A' }}>{m.month}</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#64748B' }}>{m.count}</td>
                  <td style={{ padding: '9px 16px', fontSize: 12.5, color: '#0F172A' }}>{m.avg_score}/10</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PanelEvaluationsAnalytics;
