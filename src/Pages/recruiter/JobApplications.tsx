import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Edit, Search, Filter, Trash2, Eye, FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import recruiterAPI from '../../services/recruiterAPI';

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ja-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .trow:hover td { background: #fafafa !important; }
  .ja-stat { animation:ja-in .18s ease both; transition:border-color .15s; }
  .ja-stat:hover { border-color:#cbd5e1!important; }
  .ja-row { animation:ja-in .15s ease both; }
  .ja-btn:hover { opacity: 0.82; }
  th { white-space: nowrap; }
`;


const STAGE_MAP: Record<string, [string, string]> = {
  applied:             ['#EFF6FF', '#1D4ED8'],
  pending:             ['#F3F4F6', '#6B7280'],
  screened:            ['#FEF9C3', '#A16207'],
  shortlisted:         ['#DBEAFE', '#1D4ED8'],
  interview_sent:      ['#FFFBEB', '#B45309'],
  interview_scheduled: ['#FAE8FF', '#A21CAF'],
  rejected:            ['#FEF2F2', '#DC2626'],
  hired:               ['#F0FDF4', '#16A34A'],
};
const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied', pending: 'Pending', screened: 'Screened',
  shortlisted: 'Shortlisted', interview_sent: 'Assessment Sent',
  interview_scheduled: 'Scheduled', rejected: 'Rejected', hired: 'Hired',
};

const StageBadge: React.FC<{ status: string }> = ({ status }) => {
  const [bg, col] = STAGE_MAP[status?.toLowerCase()] ?? ['#F3F4F6', '#6B7280'];
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: col, whiteSpace: 'nowrap' }}>
      {STAGE_LABEL[status?.toLowerCase()] || status || 'Pending'}
    </span>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626';
  const bg    = score >= 70 ? '#F0FDF4' : score >= 50 ? '#FFFBEB' : '#FEF2F2';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: bg, color, whiteSpace: 'nowrap' }}>
      {score}%
    </span>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div style={{
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#667eea,#764ba2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: 12,
  }}>
    {(name || 'U')[0].toUpperCase()}
  </div>
);

const JobApplications: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      recruiterAPI.getCandidatesByJob(jobId).then(setApplications).catch(() => setApplications([])),
      recruiterAPI.getJobById(jobId).then(res => setJob(res?.job ?? res)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [jobId]);

  const handleDecision = async (appId: string, decision: 'hired' | 'rejected') => {
    if (!window.confirm(`${decision === 'hired' ? 'Hire' : 'Reject'} this candidate?`)) return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      alert(res.emailSent ? `Email sent to ${res.sentTo}.` : 'Decision recorded.');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, finalDecision: decision, status: decision } : a));
    } catch { alert('Failed to update decision'); }
    finally { setDecisionLoading(null); }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!window.confirm('Delete this application?')) return;
    setActionLoading(appId + 'del');
    try {
      await recruiterAPI.deleteApplication(appId);
      setApplications(prev => prev.filter(a => String(a.id) !== String(appId)));
      setSelected(prev => { const s = new Set(prev); s.delete(appId); return s; });
    } catch { alert('Failed to delete application'); }
    finally { setActionLoading(null); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} application(s)?`)) return;
    setDeleteLoading(true);
    try {
      await recruiterAPI.bulkDeleteApplications(Array.from(selected));
      setApplications(prev => prev.filter(a => !selected.has(String(a.id))));
      setSelected(new Set());
    } catch { alert('Failed to bulk delete'); }
    finally { setDeleteLoading(false); }
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleSendAssessment = async (appId: string) => {
    setActionLoading(appId + 'send');
    try {
      const res = await recruiterAPI.sendAssessment(appId);
      const candidateEmail = res.sentTo || applications.find(a => String(a.id) === String(appId))?.email || '';
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status: 'interview_sent' } : a));
      if (res.emailSent) {
        alert(`✅ Interview link sent to ${candidateEmail}`);
      } else {
        alert(`✅ Assessment link generated!\n\nCode: ${res.assessmentCode}\nLink: ${res.link}\n\n⚠️ Email delivery pending.`);
      }
    } catch (err: any) {
      alert(`❌ ${err?.response?.data?.error || err?.message || 'Failed to send assessment'}`);
    }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #E5E7EB', borderTop: '2px solid #8B0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const skills: string[] = job?.skills ?? job?.required_skills ?? [];
  const filtered = applications.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name?.toLowerCase().includes(q) && !a.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = [
    { label: 'Total',       count: applications.length,                                            color: '#1D4ED8', bg: '#EFF6FF' },
    { label: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length,    color: '#15803d', bg: '#f0fdf4' },
    { label: 'Assessed',    count: applications.filter(a => a.status === 'interview_sent').length, color: '#B45309', bg: '#FFFBEB' },
    { label: 'Hired',       count: applications.filter(a => a.status === 'hired').length,          color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Rejected',    count: applications.filter(a => a.status === 'rejected').length,       color: '#DC2626', bg: '#FEF2F2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '13px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: '#E5E7EB' }}>|</span>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>
          {job?.title || 'Applications'}
        </h1>
        {job?.status && (
          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: job.status === 'active' ? '#F0FDF4' : '#F3F4F6', color: job.status === 'active' ? '#16A34A' : '#6B7280' }}>
            {job.status}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>

        {/* Job card */}
        {job && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: skills.length ? 10 : 0 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 5px' }}>{job.title}</h2>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><MapPin size={11} />{job.location}</span>}
                  {job.type && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B7280' }}><Clock size={11} />{job.type}</span>}
                  {(job.experience_min ?? job.experience) && <span style={{ fontSize: 12, color: '#6B7280' }}>{job.experience_min ?? job.experience}+ yrs</span>}
                </div>
              </div>
              <button onClick={() => navigate(`/recruiter/jobs/${jobId}/edit`)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#6B7280', fontFamily: 'inherit' }}>
                <Edit size={11} /> Edit
              </button>
            </div>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                {skills.map((sk: string) => (
                  <span key={sk} style={{ padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 5, fontSize: 11, fontWeight: 500 }}>{sk}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="ja-stat"
              style={{ padding: '7px 14px', background: s.bg, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, border: '1px solid transparent', animationDelay: `${i * 0.05}s` }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.count}</span>
              <span style={{ fontSize: 12, color: s.color, opacity: 0.75 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px 8px 28px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#374151', minWidth: 150 }}>
              <option value="">All Stages</option>
              {(['applied', 'pending', 'screened', 'interview_sent', 'shortlisted', 'hired', 'rejected']).map(s => (
                <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Delete Bar */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '8px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7 }}>
            <span style={{ fontSize: 13, color: '#DC2626', fontWeight: 500 }}>{selected.size} selected</span>
            <button onClick={handleBulkDelete} disabled={deleteLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: deleteLoading ? 0.5 : 1 }}>
              <Trash2 size={12} /> {deleteLoading ? 'Deleting…' : `Delete ${selected.size}`}
            </button>
            <button onClick={() => setSelected(new Set())} style={{ fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>No applications found</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 14px', width: 36 }}>
                      <input type="checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((a: any) => String(a.id))))}
                        style={{ cursor: 'pointer' }} />
                    </th>
                    {['Candidate', 'Score', 'Stage', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any, i: number) => {
                    const score = parseFloat(a.match_score ?? a.score ?? 0);
                    const lastActivity = a.applied_at || a.appliedAt;
                    const examDone = a.examCompleted || a.interviewScore != null;
                    const isClosed = ['hired', 'rejected'].includes((a.status || '').toLowerCase());

                    return (
                      <tr key={a.id} className="trow ja-row"
                        style={{ borderBottom: '1px solid #F3F4F6', animationDelay: `${Math.min(i * 0.04, 0.3)}s`, background: selected.has(String(a.id)) ? '#FFF5F5' : undefined }}>

                        {/* Checkbox */}
                        <td style={{ padding: '11px 14px' }}>
                          <input type="checkbox" checked={selected.has(String(a.id))}
                            onChange={() => toggleSelect(String(a.id))} style={{ cursor: 'pointer' }} />
                        </td>

                        {/* Candidate */}
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar name={a.name} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{a.name}</div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{a.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Score */}
                        <td style={{ padding: '11px 14px' }}>
                          <ScoreBadge score={score} />
                        </td>

                        {/* Stage */}
                        <td style={{ padding: '11px 14px' }}>
                          <StageBadge status={a.finalDecision || a.status || 'pending'} />
                        </td>

                        {/* Date */}
                        <td style={{ padding: '11px 14px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {lastActivity ? new Date(lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions — inline buttons */}
                        <td style={{ padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'nowrap' }}>

                            {/* View */}
                            <button className="ja-btn"
                              onClick={() => navigate(`/recruiter/applications/${a.id}`)}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                              <Eye size={12} /> View
                            </button>

                            {/* Resume */}
                            {a.resume_url && (
                              <button className="ja-btn"
                                onClick={() => window.open(a.resume_url, '_blank')}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                                <FileText size={12} /> CV
                              </button>
                            )}

                            {/* Send / Resend Link */}
                            {!isClosed && (
                              <button className="ja-btn"
                                onClick={() => handleSendAssessment(String(a.id))}
                                disabled={actionLoading === String(a.id) + 'send'}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: actionLoading === String(a.id) + 'send' ? 0.6 : 1 }}>
                                <Send size={12} />
                                {actionLoading === String(a.id) + 'send' ? '…' : a.status === 'interview_sent' ? 'Resend' : 'Send Link'}
                              </button>
                            )}

                            {/* Hire — always show if not closed */}
                            {!isClosed && (
                              <button className="ja-btn"
                                onClick={() => handleDecision(String(a.id), 'hired')}
                                disabled={!!decisionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: !!decisionLoading ? 0.6 : 1 }}>
                                <CheckCircle size={12} /> Hire
                              </button>
                            )}

                            {/* Reject — always show if not closed */}
                            {!isClosed && (
                              <button className="ja-btn"
                                onClick={() => handleDecision(String(a.id), 'rejected')}
                                disabled={!!decisionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: !!decisionLoading ? 0.6 : 1 }}>
                                <XCircle size={12} /> Reject
                              </button>
                            )}

                            {/* Delete */}
                            <button className="ja-btn"
                              onClick={() => handleDeleteApplication(String(a.id))}
                              disabled={actionLoading === String(a.id) + 'del'}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', opacity: actionLoading === String(a.id) + 'del' ? 0.5 : 1 }}>
                              <Trash2 size={12} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '9px 16px', borderTop: '1px solid #F3F4F6', background: '#f8fafc' }}>
              <span style={{ fontSize: 11.5, color: '#9CA3AF' }}>
                {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
