import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Send, FileText, User, Brain, StickyNote } from 'lucide-react';
import { recruiterAPI } from '../../services/recruiterAPI';
import { getStatusStyle, STATUS_LABEL } from '../../styles/theme';

/* ─── helpers ─── */
const eligColor = (e: string) =>
  e === 'excellent' ? '#16a34a' : e === 'strong' ? '#2563eb' : e === 'good' ? '#d97706' : '#dc2626';

const scoreColor = (s: number, threshold = 50) =>
  s >= 70 ? '#16a34a' : s >= threshold ? '#d97706' : '#dc2626';

/* ─── sub-components ─── */
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(15,23,42,.06)', padding: '24px 28px', ...style }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
    <span style={{ color: '#94a3b8' }}>{icon}</span>
    <h3 style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>{label}</h3>
  </div>
);

const Field: React.FC<{ label: string; value: any }> = ({ label, value }) =>
  value ? (
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 3px' }}>{label}</p>
      <p style={{ fontSize: 14, color: '#1e293b', fontWeight: 500, margin: 0 }}>{value}</p>
    </div>
  ) : null;

const Pill: React.FC<{ color: string; bg: string; border: string; children: React.ReactNode }> = ({ color, bg, border, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color, border: `1px solid ${border}` }}>
    {children}
  </span>
);

const ScoreRing: React.FC<{ label: string; value: number; threshold?: number }> = ({ label, value, threshold = 50 }) => {
  const color = scoreColor(value, threshold);
  const r = 30, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="#f1f5f9" strokeWidth={7} />
        <circle cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 40 40)" style={{ transition: 'stroke-dashoffset .8s ease' }} />
        <text x={40} y={45} textAnchor="middle" fontSize={15} fontWeight={800} fill={color}>{value}%</text>
      </svg>
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{label}</p>
    </div>
  );
};

const ActionBtn: React.FC<{
  onClick: () => void; disabled?: boolean;
  variant: 'hire' | 'reject' | 'send' | 'ghost';
  children: React.ReactNode;
}> = ({ onClick, disabled, variant, children }) => {
  const styles: Record<string, React.CSSProperties> = {
    hire:   { background: '#16a34a', color: '#fff', border: 'none' },
    reject: { background: '#fff', color: '#dc2626', border: '1px solid #fca5a5' },
    send:   { background: '#1e293b', color: '#fff', border: 'none' },
    ghost:  { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding: '10px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.55 : 1, display: 'inline-flex', alignItems: 'center', gap: 7, transition: 'opacity .15s', ...styles[variant] }}>
      {children}
    </button>
  );
};

/* ─── main component ─── */
const ApplicationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams<{ applicationId: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMsg, setNoteMsg] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [decisionModal, setDecisionModal] = useState<null | 'selected' | 'rejected'>(null);
  const [confirmModal, setConfirmModal] = useState<null | 'hire' | 'reject'>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadApp = async (id: string) => {
    const data = await recruiterAPI.getApplication(id);
    const a = data.application || data;
    return {
      ...a,
      interviewResult: a.interview_result ?? a.interviewResult ?? null,
      interviewScore: parseFloat(a.interview_score ?? a.interviewScore ?? 0) || 0,
    };
  };

  useEffect(() => {
    if (!applicationId) return;
    loadApp(applicationId)
      .then(a => {
        setApp(a);
        const st = (a.status || '').toLowerCase();
        if (a.interviewResult && !['shortlisted', 'rejected', 'hired'].includes(st))
          setDecisionModal(a.interviewScore < 50 ? 'rejected' : 'selected');
      })
      .catch(() => setError('Failed to load application'))
      .finally(() => setLoading(false));
  }, [applicationId]); // eslint-disable-line

  const handleAutoDecision = async (decision: 'selected' | 'rejected') => {
    setDecisionModal(null);
    setActionLoading(decision);
    try {
      if (decision === 'selected') {
        const res = await recruiterAPI.sendDecision(applicationId!, 'hired');
        setApp((a: any) => ({ ...a, status: 'hired', finalDecision: 'hired' }));
        showToast(res.emailSent ? `Hired — confirmation email sent to ${res.sentTo}` : 'Candidate marked as Hired');
      } else {
        const res = await recruiterAPI.sendDecision(applicationId!, 'rejected');
        setApp((a: any) => ({ ...a, status: 'rejected', finalDecision: 'rejected' }));
        showToast(res.emailSent ? `Rejection email sent to ${res.sentTo}` : 'Candidate marked as Not Selected', 'info');
      }
    } catch { showToast('Failed to update status', 'error'); }
    finally { setActionLoading(''); }
  };

  const withTimeout = <T,>(promise: Promise<T>, ms = 20000): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
    ]);

  const handleAction = async (action: 'hire' | 'reject' | 'send-assessment') => {
    if (action === 'hire' || action === 'reject') {
      setConfirmModal(action);
      return;
    }
    await executeAction(action);
  };

  const executeAction = async (action: 'hire' | 'reject' | 'send-assessment') => {
    setConfirmModal(null);
    setActionLoading(action);
    try {
      if (action === 'hire') {
        const res = await withTimeout(recruiterAPI.sendDecision(applicationId!, 'hired'));
        setApp((a: any) => ({ ...a, status: 'hired', finalDecision: 'hired' }));
        showToast(res.emailSent ? `Hired — confirmation email sent to ${res.sentTo || app.email}` : 'Candidate marked as Hired');
      } else if (action === 'reject') {
        const res = await withTimeout(recruiterAPI.sendDecision(applicationId!, 'rejected'));
        setApp((a: any) => ({ ...a, status: 'rejected', finalDecision: 'rejected' }));
        showToast(res.emailSent ? `Rejection email sent to ${res.sentTo || app.email}` : 'Candidate marked as Not Selected', 'info');
      } else {
        const res = await withTimeout(recruiterAPI.sendAssessment(applicationId!), 25000);
        setApp((a: any) => ({ ...a, status: 'interview_sent' }));
        const sentEmail = res.sentTo || app.email;
        showToast(res.emailSent ? `Interview link sent to ${sentEmail}` : `Assessment code generated: ${res.assessmentCode}`, res.emailSent ? 'success' : 'info');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || `Failed to ${action}`;
      showToast(msg, 'error');
    } finally {
      setActionLoading('');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true); setNoteMsg('');
    try {
      await recruiterAPI.addNote(applicationId!, note);
      setNoteMsg('Note saved');
      setNote('');
      const a = await loadApp(applicationId!);
      setApp(a);
    } catch { setNoteMsg('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  /* ── loading / error states ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #1e293b', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (error || !app) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 14, background: '#f8fafc' }}>
      <p style={{ color: '#dc2626', fontSize: 14, fontWeight: 500 }}>{error || 'Application not found'}</p>
      <button onClick={() => navigate(-1)} style={{ padding: '9px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Go Back</button>
    </div>
  );

  const parsed = app.parsed_resume || {};
  const status = (app.status || '').toLowerCase();
  const st = getStatusStyle(status);
  const resumeScore = parseFloat(app.match_score ?? 0);
  const intScore = app.interviewScore ?? 0;
  const isClosed = ['hired', 'rejected'].includes(status);

  const statusDot: Record<string, string> = {
    pending: '#f59e0b', shortlisted: '#10b981', rejected: '#ef4444',
    interview_sent: '#3b82f6', hired: '#8b5cf6',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: none } }
        @keyframes slideIn { from { opacity:0; transform:translateX(100%) } to { opacity:1; transform:none } }
        .ad-card { animation: fadeUp .22s ease both }
        .ad-card:nth-child(1) { animation-delay: .04s }
        .ad-card:nth-child(2) { animation-delay: .08s }
        .ad-card:nth-child(3) { animation-delay: .12s }
        .ad-card:nth-child(4) { animation-delay: .16s }
        .ad-card:nth-child(5) { animation-delay: .20s }
        .ad-card:nth-child(6) { animation-delay: .24s }
        textarea:focus { outline: none; border-color: #94a3b8 !important; }
        .action-btn:hover { filter: brightness(.92); }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '14px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
          maxWidth: 380, boxShadow: '0 8px 24px rgba(15,23,42,.15)',
          animation: 'slideIn .25s ease',
          background: toast.type === 'error' ? '#fef2f2' : toast.type === 'info' ? '#eff6ff' : '#f0fdf4',
          color: toast.type === 'error' ? '#dc2626' : toast.type === 'info' ? '#1d4ed8' : '#16a34a',
          border: `1px solid ${toast.type === 'error' ? '#fecaca' : toast.type === 'info' ? '#bfdbfe' : '#bbf7d0'}`,
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 28px', maxWidth: 360, width: '100%', boxShadow: '0 20px 60px rgba(15,23,42,.15)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              {confirmModal === 'hire' ? 'Confirm Hire' : 'Confirm Rejection'}
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px' }}>
              {confirmModal === 'hire'
                ? `Mark ${app?.name} as hired and send confirmation email?`
                : `Reject ${app?.name}'s application and send rejection email?`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)}
                style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 600, color: '#64748b', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={() => executeAction(confirmModal)}
                style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: confirmModal === 'hire' ? '#16a34a' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {confirmModal === 'hire' ? 'Confirm Hire' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(15,23,42,.18)', animation: 'fadeUp .2s ease' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>{decisionModal === 'selected' ? '🎉' : '😔'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: decisionModal === 'selected' ? '#16a34a' : '#dc2626', margin: '0 0 8px' }}>
              {decisionModal === 'selected' ? 'Candidate Qualified' : 'Candidate Not Qualified'}
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 4px' }}>
              <strong style={{ color: '#1e293b' }}>{app.name}</strong> scored{' '}
              <strong style={{ fontSize: 18, color: decisionModal === 'selected' ? '#16a34a' : '#dc2626' }}>{intScore}%</strong> on the interview.
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 28px' }}>
              {decisionModal === 'selected' ? 'Score ≥ 50% — Qualifies for hire.' : 'Score < 50% — Auto rejection recommended.'}
            </p>
            <button onClick={() => handleAutoDecision(decisionModal)} className="action-btn"
              style={{ width: '100%', padding: 13, background: decisionModal === 'selected' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {decisionModal === 'selected' ? '✓ Confirm Hire' : '✗ Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      {/* ── Top Nav Bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, fontWeight: 500, padding: '6px 10px', borderRadius: 7, transition: 'background .15s' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <ArrowLeft size={15} /> Back to Applications
        </button>
        <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Application Detail</h1>
        <div style={{ flex: 1 }} />
        {/* Status badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusDot[status] || '#94a3b8' }} />
          {STATUS_LABEL[status] || app.status}
        </span>
        {!isClosed && (
          <ActionBtn variant="reject" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
            <XCircle size={14} /> Reject
          </ActionBtn>
        )}
      </div>

      {/* ── Page Body ── */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Candidate hero */}
        <Card style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'linear-gradient(135deg,#1e293b,#475569)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {(app.name || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>{app.name || parsed.name || '—'}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: '#64748b' }}>
                {(app.email || parsed.email) && <span>✉ {app.email || parsed.email}</span>}
                {(app.phone || parsed.phone) && <span>📞 {app.phone || parsed.phone}</span>}
                {app.location && <span>📍 {app.location}</span>}
              </div>
            </div>
            {/* Score pills */}
            {(resumeScore > 0 || intScore > 0) && (
              <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
                {resumeScore > 0 && <ScoreRing label="Resume Match" value={resumeScore} />}
                {intScore > 0 && <ScoreRing label="Interview" value={intScore} />}
              </div>
            )}
          </div>

          {/* Meta pills row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            {app.job_title && <Pill color="#1e293b" bg="#f1f5f9" border="#e2e8f0">🧳 {app.job_title}</Pill>}
            {app.experience_years != null && <Pill color="#2563eb" bg="#eff6ff" border="#bfdbfe">{app.experience_years} yr{app.experience_years !== 1 ? 's' : ''} experience</Pill>}
            {app.expected_salary && <Pill color="#7c3aed" bg="#f5f3ff" border="#ddd6fe">💰 {app.expected_salary}</Pill>}
            {app.applied_at && <Pill color="#64748b" bg="#f8fafc" border="#e2e8f0">Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Pill>}
            {app.eligibility_status && (
              <Pill color={eligColor(app.eligibility_status)} bg={eligColor(app.eligibility_status) + '15'} border={eligColor(app.eligibility_status) + '40'}>
                ● {app.eligibility_status.charAt(0).toUpperCase() + app.eligibility_status.slice(1)} match
              </Pill>
            )}
            {app.interviewResult && (
              <Pill color={app.interviewResult === 'Selected' ? '#16a34a' : '#dc2626'} bg={app.interviewResult === 'Selected' ? '#f0fdf4' : '#fef2f2'} border={app.interviewResult === 'Selected' ? '#bbf7d0' : '#fecaca'}>
                {app.interviewResult === 'Selected' ? '✓ Selected' : '✗ Not Selected'}
              </Pill>
            )}
          </div>
        </Card>

        {/* 2-col layout for AI Screening + Resume */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="ad-two-col">
          <style>{`.ad-two-col { @media(max-width:680px){ grid-template-columns:1fr !important } }`}</style>

          {/* AI Screening */}
          <Card>
            <SectionTitle icon={<Brain size={15} />} label="AI Screening" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <Field label="Match Score" value={app.match_score != null ? `${app.match_score}%` : null} />
              <Field label="Eligibility" value={app.eligibility_status} />
            </div>

            {app.matched_skills?.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Matched Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {app.matched_skills.map((sk: string) => (
                    <span key={sk} style={{ padding: '3px 10px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{sk}</span>
                  ))}
                </div>
              </div>
            )}

            {app.missing_skills?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Missing Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {app.missing_skills.map((sk: string) => (
                    <span key={sk} style={{ padding: '3px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{sk}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Resume */}
          {(app.resume_url || parsed.skills?.length > 0 || parsed.summary) && (
            <Card>
              <SectionTitle icon={<FileText size={15} />} label="Resume" />
              {app.resume_url && (
                <a href={app.resume_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#1e293b', color: '#fff', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}>
                  <ExternalLink size={13} /> View Resume PDF
                </a>
              )}
              {parsed.summary && (
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, margin: '0 0 16px', background: '#f8fafc', borderRadius: 9, padding: '12px 14px', borderLeft: '3px solid #e2e8f0' }}>
                  {parsed.summary}
                </p>
              )}
              {parsed.skills?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {parsed.skills.map((sk: string) => (
                      <span key={sk} style={{ padding: '3px 10px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Actions */}
        <Card>
          <SectionTitle icon={<CheckCircle size={15} />} label="Actions" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!isClosed ? (
              <>
                <ActionBtn variant="hire" onClick={() => handleAction('hire')} disabled={!!actionLoading}>
                  <CheckCircle size={14} /> {actionLoading === 'hire' ? 'Processing…' : 'Hire Candidate'}
                </ActionBtn>
                <ActionBtn variant="reject" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
                  <XCircle size={14} /> {actionLoading === 'reject' ? 'Processing…' : 'Reject'}
                </ActionBtn>
                <ActionBtn variant="send" onClick={() => handleAction('send-assessment')} disabled={!!actionLoading}>
                  <Send size={13} /> {actionLoading === 'send-assessment' ? 'Sending…' : status === 'interview_sent' ? 'Resend Interview Link' : 'Send Interview Link'}
                </ActionBtn>
              </>
            ) : status === 'hired' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#f0fdf4', color: '#16a34a', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>
                <CheckCircle size={15} /> Candidate Hired
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#fef2f2', color: '#dc2626', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>
                <XCircle size={15} /> Not Selected
              </div>
            )}
          </div>
        </Card>

        {/* Recruiter Notes */}
        <Card>
          <SectionTitle icon={<StickyNote size={15} />} label="Recruiter Notes" />
          {app.recruiter_note && (
            <div style={{ padding: '13px 16px', background: '#fefce8', borderRadius: 9, border: '1px solid #fef08a', borderLeft: '4px solid #facc15', marginBottom: 16 }}>
              <p style={{ fontSize: 14, color: '#713f12', margin: 0, lineHeight: 1.65 }}>{app.recruiter_note}</p>
            </div>
          )}
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add an internal note…" rows={3} required
              style={{ padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14, resize: 'vertical', width: '100%', boxSizing: 'border-box', color: '#0f172a', background: '#fafafa', lineHeight: 1.6 }} />
            {noteMsg && (
              <p style={{ color: noteMsg.includes('Failed') ? '#dc2626' : '#16a34a', fontSize: 13, fontWeight: 500, margin: 0 }}>
                {noteMsg.includes('Failed') ? '✗' : '✓'} {noteMsg}
              </p>
            )}
            <ActionBtn variant={savingNote ? 'ghost' : 'send'} onClick={() => {}} disabled={savingNote}>
              {savingNote ? 'Saving…' : 'Save Note'}
            </ActionBtn>
          </form>
        </Card>

      </div>
    </div>
  );
};

export default ApplicationDetail;