import React, { useEffect, useState } from 'react';
import { adminHiringAPI } from '../../services/recruiterAPI';
import { COLORS, RADIUS, SHADOW } from '../../AIMockInterview/admin/adminTheme';

const StatPill: React.FC<{ label: string; value: React.ReactNode; dot: string }> = ({ label, value, dot }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.sm, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
    <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{value}</span>
    <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:        { label: 'Pending',        color: '#475569', bg: '#F1F5F9', border: '#E2E8F0' },
  screened:       { label: 'Screened',       color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  shortlisted:    { label: 'Shortlisted',    color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  interview_sent: { label: 'Interview Sent', color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  hired:          { label: 'Hired',          color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  rejected:       { label: 'Rejected',       color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
};
const statusMeta = (s: string) => STATUS_META[s] || { label: s || 'Unknown', color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0' };

const HiringMonitor: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [candidatesByJob, setCandidatesByJob] = useState<Record<number, any[]>>({});
  const [candidatesLoading, setCandidatesLoading] = useState<number | null>(null);

  const load = () => {
    setLoading(true); setError('');
    adminHiringAPI.getOverview()
      .then(setData)
      .catch(() => setError('Failed to load hiring overview'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (jobId: number) => {
    if (expandedJobId === jobId) { setExpandedJobId(null); return; }
    setExpandedJobId(jobId);
    if (!candidatesByJob[jobId]) {
      setCandidatesLoading(jobId);
      adminHiringAPI.getJobCandidates(jobId)
        .then(candidates => setCandidatesByJob(prev => ({ ...prev, [jobId]: candidates })))
        .catch(() => setCandidatesByJob(prev => ({ ...prev, [jobId]: [] })))
        .finally(() => setCandidatesLoading(null));
    }
  };

  const jobs: any[] = data?.jobs || [];
  const filtered = jobs.filter(j => {
    const matchesSearch = !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.createdBy?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? j.status === 'active' : j.status !== 'active');
    return matchesSearch && matchesStatus;
  });

  const summary = data?.summary || {};
  const statCards = [
    { label: 'Total Jobs',         value: summary.totalJobs ?? 0,         color: '#0F172A' },
    { label: 'Active Jobs',        value: summary.activeJobs ?? 0,        color: '#15803D' },
    { label: 'Inactive Jobs',      value: summary.inactiveJobs ?? 0,      color: '#B91C1C' },
    { label: 'Total Applications', value: summary.totalApplications ?? 0, color: '#1D4ED8' },
    { label: 'Total Hired',        value: summary.totalHired ?? 0,        color: '#15803D' },
    { label: 'Total Rejected',     value: summary.totalRejected ?? 0,     color: '#B91C1C' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94A3B8' }}>
          <div style={{ width: 28, height: 28, border: '2.5px solid #E2E8F0', borderTop: '2.5px solid #0F172A', borderRadius: '50%', animation: 'hm-spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Loading hiring overview…
          <style>{`@keyframes hm-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>Hiring Status Monitor</h2>
          <p style={{ fontSize: 12.5, color: '#94A3B8', margin: '3px 0 0' }}>All jobs across every recruiter — applications, hires, and rejections at a glance</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12.5, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
          ⟳ Refresh
        </button>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
      )}

      {/* Summary — compact pills instead of large padded cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {statCards.map(s => (
          <StatPill key={s.label} label={s.label} value={s.value} dot={s.color} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job title or recruiter…"
          style={{ flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
          style={{ padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }}>
          <option value="all">All Jobs</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <span style={{ fontSize: 12.5, color: '#94A3B8', alignSelf: 'center' }}>{filtered.length} job{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Jobs table */}
      <div style={{ background: '#fff', borderRadius: 9, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No jobs match your filters.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['Job', 'Recruiter', 'Status', 'Positions', 'Applications', 'Hired', 'Rejected', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(job => {
                  const isExpanded = expandedJobId === job.id;
                  const candidates = candidatesByJob[job.id] || [];
                  return (
                    <React.Fragment key={job.id}>
                      <tr onClick={() => toggleExpand(job.id)}
                        style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', background: isExpanded ? '#F8FAFC' : '#fff' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0F172A' }}>{job.title}</td>
                        <td style={{ padding: '11px 14px', color: '#475569' }}>{job.createdBy?.name || '—'}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: job.status === 'active' ? '#F0FDF4' : '#FEF2F2', color: job.status === 'active' ? '#15803D' : '#B91C1C', border: `1px solid ${job.status === 'active' ? '#BBF7D0' : '#FECACA'}` }}>
                            {job.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', color: '#374151' }}>
                          {job.vacancies != null ? `${job.remaining} of ${job.vacancies}` : '—'}
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1D4ED8' }}>{job.applications.total}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#15803D' }}>{job.applications.hired}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#B91C1C' }}>{job.applications.rejected}</td>
                        <td style={{ padding: '11px 14px', color: '#94A3B8', fontSize: 12 }}>{isExpanded ? '▲ Hide' : '▼ View'}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ padding: 0, background: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ padding: '14px 24px 18px' }}>
                              {candidatesLoading === job.id ? (
                                <div style={{ padding: '16px 0', color: '#94A3B8', fontSize: 12.5 }}>Loading candidates…</div>
                              ) : candidates.length === 0 ? (
                                <div style={{ padding: '16px 0', color: '#94A3B8', fontSize: 12.5 }}>No applications yet for this job.</div>
                              ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                                  <thead>
                                    <tr>
                                      {['Candidate', 'Email', 'Status', 'Score', 'Applied'].map(h => (
                                        <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {candidates.map((c: any) => {
                                      const meta = statusMeta(c.status);
                                      return (
                                        <tr key={c.id} style={{ borderTop: '1px solid #F1F5F9' }}>
                                          <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0F172A' }}>{c.name || '—'}</td>
                                          <td style={{ padding: '7px 10px', color: '#64748B' }}>{c.email || '—'}</td>
                                          <td style={{ padding: '7px 10px' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
                                          </td>
                                          <td style={{ padding: '7px 10px', color: '#374151' }}>{c.match_score != null ? `${c.match_score}%` : '—'}</td>
                                          <td style={{ padding: '7px 10px', color: '#94A3B8' }}>{c.applied_at ? new Date(c.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HiringMonitor;
