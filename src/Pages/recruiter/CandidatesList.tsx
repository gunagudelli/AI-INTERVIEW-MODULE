import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import recruiterAPI from '../../services/recruiterAPI';
import { STATUS_LABEL, getStatusStyle } from '../../styles/theme';

const STATUSES = ['', 'applied', 'pending', 'screened', 'interview_sent', 'shortlisted', 'hired', 'rejected'];

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes cl-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .cl-row { transition: background .12s; }
  .cl-row:hover { background: #FAFAFA !important; }
  @media (max-width: 768px) {
    .cl-table-wrap { display: none !important; }
    .cl-cards      { display: flex !important; }
    .cl-header-pad { padding: 12px 16px !important; }
    .cl-filters    { padding: 0 16px 12px !important; }
    .cl-wrap       { padding: 0 !important; }
  }
  @media (min-width: 769px) {
    .cl-cards { display: none !important; }
  }
`;

const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 36 }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: '#1D4ED8', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#fff', fontWeight: 700,
    fontSize: size * 0.36,
  }}>
    {(name || 'U')[0].toUpperCase()}
  </div>
);

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const bg    = score >= 70 ? '#f0fdf4' : score >= 50 ? '#FFFBEB' : '#fef2f2';
  const color = score >= 70 ? '#15803d' : score >= 50 ? '#B45309' : '#b91c1c';
  return <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color }}>{score}%</span>;
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {STATUS_LABEL[status] || status}
    </span>
  );
};

const CandidatesList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs]                 = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter]       = useState('');
  const [search, setSearch]             = useState('');
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const jobList = await recruiterAPI.getAllJobs();
      setJobs(jobList);
      const results = await Promise.all(
        jobList.map((job: any) =>
          recruiterAPI.getCandidatesByJob(job.id)
            .then((apps: any[]) => apps.map((a: any) => ({ ...a, jobTitle: job.title, jobId: job.id })))
            .catch(() => [])
        )
      );
      setApplications(results.flat());
    } catch { setApplications([]); }
    finally { setLoading(false); }
  };

  const handleSendAssessment = async (appId: string) => {
    setActionLoading(appId + 'send');
    try {
      const res = await recruiterAPI.sendAssessment(appId);
      alert(res.emailSent ? `Email sent to ${res.sentTo}` : 'Link generated');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'interview_sent' } : a));
    } catch { alert('Failed to send assessment'); }
    finally { setActionLoading(null); }
  };

  const handleDecision = async (appId: string, decision: 'hired' | 'rejected', email: string) => {
    if (!window.confirm(`${decision === 'hired' ? 'Hire' : 'Reject'} this candidate?`)) return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      alert(res.emailSent ? `Email sent to ${res.sentTo}` : 'Decision saved');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, finalDecision: decision, status: decision } : a));
    } catch { alert('Failed to update decision'); }
    finally { setDecisionLoading(null); }
  };

  const filtered = applications.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (jobFilter && String(a.jobId) !== jobFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name?.toLowerCase().includes(q) && !a.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #1D4ED8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const ActionButtons = ({ a }: { a: any }) => {
    const isClosed   = a.status === 'hired' || a.status === 'rejected';
    const examDone   = a.examCompleted || a.interviewScore != null || a.interview_score != null;
    const sending    = actionLoading === a.id + 'send';
    const deleting   = actionLoading === a.id + 'del';

    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap', alignItems: 'center' }}>

        {/* View */}
        <button onClick={() => navigate(`/recruiter/applications/${a.id}`)}
          style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          View
        </button>

        {/* Resume */}
        {a.resume_url && (
          <a href={a.resume_url} target="_blank" rel="noreferrer"
            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 500, color: '#374151', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            CV
          </a>
        )}

        {/* Send / Resend Link — hide if closed */}
        {!isClosed && (
          <button onClick={() => handleSendAssessment(a.id)} disabled={sending}
            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#1D4ED8', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', opacity: sending ? 0.6 : 1 }}>
            {sending ? '…' : a.status === 'interview_sent' ? 'Resend' : 'Send Link'}
          </button>
        )}

        {/* Hire — only if exam done AND not closed */}
        {examDone && !isClosed && (
          <button onClick={() => handleDecision(a.id, 'hired', a.email)} disabled={!!decisionLoading}
            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#16A34A', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', opacity: !!decisionLoading ? 0.6 : 1 }}>
            Hire
          </button>
        )}

        {/* Reject — always show if not closed */}
        {!isClosed && (
          <button onClick={() => handleDecision(a.id, 'rejected', a.email)} disabled={!!decisionLoading}
            style={{ padding: '5px 10px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap', opacity: !!decisionLoading ? 0.6 : 1 }}>
            Reject
          </button>
        )}

      </div>
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', -apple-system, sans-serif", animation: 'cl-in .22s ease' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div className="cl-header-pad" style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Applications</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="cl-filters" style={{ padding: '16px 28px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box', color: '#0f172a' }}
          />
        </div>
        <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151', outline: 'none', minWidth: 150 }}>
          <option value="">All Jobs</option>
          {jobs.map(j => <option key={j.id} value={String(j.id)}>{j.title}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#374151', outline: 'none', minWidth: 140 }}>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s ? (STATUS_LABEL[s] || s) : 'All Status'}</option>
          ))}
        </select>
      </div>

      <div className="cl-wrap" style={{ padding: '20px 28px' }}>

        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>No applications found</p>
          </div>
        ) : (
          <>
            {/* ── Desktop Table ── */}
            <div className="cl-table-wrap" style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {['Candidate', 'Job', 'Score', 'Status', 'Applied', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a: any, i: number) => {
                      const score = parseFloat(a.match_score ?? a.score ?? 0) || 0;
                      return (
                        <tr key={a.id} className="cl-row" style={{ borderBottom: '1px solid #f1f5f9', animationDelay: `${Math.min(i * 0.04, 0.3)}s` }}>
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Avatar name={a.name} size={32} />
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <button onClick={() => navigate(`/recruiter/jobs/${a.jobId}/applications`)}
                              style={{ fontSize: 12, color: '#1D4ED8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500, textAlign: 'left' }}>
                              {a.jobTitle || `Job #${a.jobId}`}
                            </button>
                          </td>
                          <td style={{ padding: '12px 18px' }}><ScoreBadge score={score} /></td>
                          <td style={{ padding: '12px 18px' }}><StatusBadge status={a.status || 'pending'} /></td>
                          <td style={{ padding: '12px 18px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {a.applied_at || a.appliedAt ? new Date(a.applied_at || a.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '12px 18px' }}><ActionButtons a={a} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Mobile Cards ── */}
            <div className="cl-cards" style={{ flexDirection: 'column', gap: 10, padding: '12px 16px' }}>
              {filtered.map((a: any) => {
                const score = parseFloat(a.match_score ?? a.score ?? 0) || 0;
                return (
                  <div key={a.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={a.name} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                      </div>
                      <ScoreBadge score={score} />
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <StatusBadge status={a.status || 'pending'} />
                      <span style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 500 }}>{a.jobTitle || `Job #${a.jobId}`}</span>
                      {(a.applied_at || a.appliedAt) && (
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
                          {new Date(a.applied_at || a.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                      <button onClick={() => navigate(`/recruiter/applications/${a.id}`)}
                        style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 7, cursor: 'pointer' }}>
                        View
                      </button>
                      <button onClick={() => handleSendAssessment(a.id)} disabled={actionLoading === a.id + 'send'}
                        style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#16A34A', border: 'none', borderRadius: 7, cursor: 'pointer', opacity: actionLoading === a.id + 'send' ? 0.6 : 1 }}>
                        {a.status === 'interview_sent' ? 'Resend' : 'Send Link'}
                      </button>
                      {a.status !== 'rejected' && a.status !== 'hired' && (
                        <button onClick={() => handleDecision(a.id, 'rejected', a.email)} disabled={!!decisionLoading}
                          style={{ flex: 1, padding: '7px', fontSize: 12, fontWeight: 600, color: '#fff', background: '#DC2626', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidatesList;
