import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import recruiterAPI from '../../services/recruiterAPI';
import { STATUS_STYLE, STATUS_LABEL, getStatusStyle } from '../../styles/theme';

const STATUSES = ['', 'applied', 'pending', 'screened', 'interview_sent', 'shortlisted', 'hired', 'rejected'];

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
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
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

  const handleDecision = async (appId: string, decision: 'hired' | 'rejected', email: string) => {
    if (!window.confirm(`${decision === 'hired' ? 'Hire' : 'Reject'} this candidate? An email will be sent to ${email}.`)) return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      alert(res.emailSent ? `Email sent to ${res.sentTo}` : 'Decision saved');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, finalDecision: decision, status: decision } : a));
    } catch { alert('Failed to update decision'); }
    finally { setDecisionLoading(null); }
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
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", animation:'cl-in .22s ease' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}
        @keyframes cl-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .cl-row{animation:cl-in .15s ease both;transition:background .1s}
        .cl-row:hover td{background:#f5f3ff!important}
      `}</style>

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Applications</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>{filtered.length} candidate{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', boxSizing: 'border-box', color: '#0f172a' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={14} style={{ color: '#94a3b8' }} />
          </div>
          <select value={jobFilter} onChange={e => setJobFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#0f172a', outline: 'none', minWidth: 160 }}>
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j.id} value={String(j.id)}>{j.title}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', color: '#0f172a', outline: 'none', minWidth: 160 }}>
            {(STATUSES as string[]).map(s => (
              <option key={s} value={s}>{s ? (STATUS_LABEL[s] || s) : 'All Status'}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>No applications found</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Candidate', 'Job', 'Resume Score', 'Status', 'Applied', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any, i: number) => {
                  const score = parseFloat(a.match_score ?? a.score ?? 0) || 0;
                  const scoreBg = score >= 70 ? '#f0fdf4' : score >= 50 ? '#fff7ed' : '#fef2f2';
                  const scoreColor = score >= 70 ? '#15803d' : score >= 50 ? '#c2410c' : '#b91c1c';
                  return (
                    <tr key={a.id} className="cl-row" style={{ borderBottom: '1px solid #f1f5f9', animationDelay:`${Math.min(i*0.04,0.3)}s` }}>

                      {/* Candidate */}
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {(a.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Job */}
                      <td style={{ padding: '13px 18px' }}>
                        <button onClick={() => navigate(`/recruiter/jobs/${a.jobId}/applications`)}
                          style={{ fontSize: 13, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: 500 }}>
                          {a.jobTitle || `Job #${a.jobId}`}
                        </button>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: scoreBg, color: scoreColor, width: 'fit-content' }}>
                            {score}% match
                          </span>
                          {a.interviewScore != null ? (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: a.interviewScore >= 60 ? '#f0fdf4' : '#fef2f2', color: a.interviewScore >= 60 ? '#15803d' : '#b91c1c', width: 'fit-content' }}>
                              Exam: {a.interviewScore}%
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Exam pending</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '13px 18px' }}>
                        <StatusBadge status={a.status || 'pending'} />
                      </td>

                      {/* Applied */}
                      <td style={{ padding: '13px 18px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {a.applied_at || a.appliedAt ? new Date(a.applied_at || a.appliedAt).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '13px 18px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => navigate(`/recruiter/applications/${a.id}`)}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#4f46e5', background: '#eef2ff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                            View
                          </button>
                          {a.resume_url && (
                            <a href={a.resume_url} target="_blank" rel="noreferrer"
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#475569', background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', textDecoration: 'none' }}>
                              Resume
                            </a>
                          )}
                          <button onClick={() => handleSendAssessment(a.id)}
                            disabled={actionLoading === a.id + 'send'}
                            style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: 'white', background: '#4f46e5', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: actionLoading === a.id + 'send' ? 0.6 : 1 }}>
                            {actionLoading === a.id + 'send' ? '...' : a.status === 'interview_sent' ? 'Resend' : 'Send Link'}
                          </button>
                          {a.status !== 'rejected' && a.status !== 'hired' && (
                            <button onClick={() => handleDecision(a.id, 'rejected', a.email)}
                              disabled={!!decisionLoading}
                              style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, color: '#b91c1c', background: '#fef2f2', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
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

export default CandidatesList;
