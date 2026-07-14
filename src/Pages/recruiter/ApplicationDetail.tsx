import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Send, FileText, User, Brain, StickyNote, Mail, Phone, MapPin, Briefcase, CalendarDays, Sparkles } from 'lucide-react';
import { recruiterAPI, recruiterEvaluationAPI } from '../../services/recruiterAPI';
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

const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
    borderRadius: 18,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgba(15,23,42,.04)',
    ...style,
  }}>
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

const InfoTile: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'default' | 'blue' | 'green' | 'amber' | 'rose' }> = ({ icon, label, value, tone = 'default' }) => {
  const tones: Record<string, React.CSSProperties> = {
    default: { background: '#f8fafc', color: '#475569', border: '#e2e8f0' },
    blue: { background: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    green: { background: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    amber: { background: '#fffbeb', color: '#b45309', border: '#fde68a' },
    rose: { background: '#fef2f2', color: '#be123c', border: '#fecaca' },
  };
  const t = tones[tone];
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: '#fff',
      border: `1px solid ${t.border}`,
      boxShadow: '0 1px 2px rgba(15,23,42,.04)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      minWidth: 0,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: t.background, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 4px' }}>{label}</p>
        <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600, lineHeight: 1.45, wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  );
};

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
  // Panel-assignment / evaluation state — true interview completion is the panel evaluation
  // being submitted/locked, not merely a panel assignment reaching 'completed' (that status
  // only means the evaluation form was opened). See panelInFlight/decisionGatedByInterview below.
  const [latestPanelAssignment, setLatestPanelAssignment] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadApp = async (id: string) => {
    const data = await recruiterAPI.getApplication(id);
    const a = data.application || data;
    // Prefer interview_score from evaluation_reports (overall_score)
    const examScore = parseFloat(a.interview_score ?? a.interviewScore ?? 0) || 0;
    const examCompleted = a.exam_completed === true || examScore > 0;
    return {
      ...a,
      interviewResult: a.interview_result ?? a.interviewResult ?? null,
      interviewScore: examScore,
      examCompleted,
    };
  };

  useEffect(() => {
    if (!applicationId) return;
    loadApp(applicationId)
      .then(a => {
        setApp(a);
        const st = (a.status || '').toLowerCase();
        // Only show decision modal if exam is completed and status is not final
        if (a.examCompleted && a.interviewScore > 0 && !['shortlisted', 'rejected', 'hired'].includes(st))
          setDecisionModal(a.interviewScore < 50 ? 'rejected' : 'selected');
      })
      .catch(() => setError('Failed to load application'))
      .finally(() => setLoading(false));
  }, [applicationId]); // eslint-disable-line

  // Fetch panel-assignment + evaluation status so Hire/Reject can be gated on real interview
  // completion (panel_evaluations.status submitted/locked) rather than AI-exam score alone.
  useEffect(() => {
    if (!applicationId) return;
    recruiterAPI.getPanelAssignments(applicationId)
      .then((rows: any[]) => {
        const latest = rows && rows.length ? rows[0] : null; // findByApplication is ORDER BY created_at DESC
        setLatestPanelAssignment(latest);
        if (latest?.status === 'completed') {
          recruiterEvaluationAPI.getByAssignment(latest.id)
            .then((ev: any) => setEvaluation(ev ?? null))
            .catch(() => setEvaluation(null));
        }
      })
      .catch(() => setLatestPanelAssignment(null));
  }, [applicationId]);

  const evaluationSubmitted = !!evaluation && ['submitted', 'locked'].includes(evaluation.status);
  const panelInFlight = !!latestPanelAssignment && !['rejected', 'cancelled'].includes(latestPanelAssignment.status);
  const decisionGatedByInterview = panelInFlight && !evaluationSubmitted;

  // The auto-suggested hire/reject modal below is keyed only off the AI exam score and can
  // fire before the panel-assignment fetch resolves — close it reactively if we learn a panel
  // interview is in flight (real completion isn't decided by AI score alone in that case).
  useEffect(() => {
    if (decisionGatedByInterview && decisionModal) setDecisionModal(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionGatedByInterview]);

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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
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
          position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9999,
          padding: '12px 14px', borderRadius: 14, fontSize: 13, fontWeight: 600,
          maxWidth: 420, width: 'min(100%, 420px)', marginLeft: 'auto', marginRight: 'auto',
          boxShadow: '0 18px 40px rgba(15,23,42,.14)',
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
        {!isClosed && !decisionGatedByInterview && (
          <ActionBtn variant="reject" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
            <XCircle size={14} /> Reject
          </ActionBtn>
        )}
      </div>

      {/* ── Page Body ── */}
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 24px 44px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Candidate Details */}
        <Panel style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '26px 28px 22px',
            background: 'linear-gradient(135deg, rgba(15,23,42,.98) 0%, rgba(30,41,59,.96) 55%, rgba(51,65,85,.94) 100%)',
            color: '#fff',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top right, rgba(56,189,248,.16), transparent 32%), radial-gradient(circle at left bottom, rgba(34,197,94,.12), transparent 24%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{
                  width: 62, height: 62, borderRadius: 18,
                  background: 'linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.08))',
                  border: '1px solid rgba(255,255,255,.16)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 24, fontWeight: 800, flexShrink: 0,
                }}>
                  {(app.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.03em' }}>{app.name || parsed.name || '—'}</h2>
                    {app.interviewResult && (
                      <span style={{
                        padding: '5px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        background: app.interviewResult === 'Selected' ? 'rgba(34,197,94,.15)' : 'rgba(239,68,68,.15)',
                        color: app.interviewResult === 'Selected' ? '#86efac' : '#fca5a5',
                        border: `1px solid ${app.interviewResult === 'Selected' ? 'rgba(34,197,94,.22)' : 'rgba(239,68,68,.22)'}`,
                      }}>
                        {app.interviewResult}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(226,232,240,.88)', lineHeight: 1.6, maxWidth: 680 }}>
                    A cleaner snapshot of the candidate profile, screening signals, and actionable next steps.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {app.job_title && <Pill color="#e2e8f0" bg="rgba(255,255,255,.07)" border="rgba(255,255,255,.14)"><Briefcase size={12} /> {app.job_title}</Pill>}
                    {app.experience_years != null && <Pill color="#e2e8f0" bg="rgba(255,255,255,.07)" border="rgba(255,255,255,.14)"><User size={12} /> {app.experience_years} yr{app.experience_years !== 1 ? 's' : ''} experience</Pill>}
                    {app.applied_at && <Pill color="#e2e8f0" bg="rgba(255,255,255,.07)" border="rgba(255,255,255,.14)"><CalendarDays size={12} /> Applied {new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Pill>}
                  </div>
                </div>
              </div>
              {(resumeScore > 0 || intScore > 0) && (
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                  {resumeScore > 0 && <ScoreRing label="Resume Match" value={resumeScore} />}
                  {intScore > 0 && <ScoreRing label="Interview" value={intScore} />}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '20px 22px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<Mail size={16} />} label="Email" value={app.email || parsed.email || 'Not provided'} tone="blue" /></div>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<Phone size={16} />} label="Phone" value={app.phone || parsed.phone || 'Not provided'} tone="green" /></div>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<MapPin size={16} />} label="Location" value={app.location || 'Not provided'} tone="amber" /></div>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<Briefcase size={16} />} label="Role" value={app.job_title || 'Not provided'} /></div>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<Sparkles size={16} />} label="Eligibility" value={app.eligibility_status ? app.eligibility_status.charAt(0).toUpperCase() + app.eligibility_status.slice(1) : 'Pending'} tone={app.eligibility_status === 'excellent' || app.eligibility_status === 'strong' ? 'green' : app.eligibility_status === 'good' ? 'amber' : 'rose'} /></div>
              <div style={{ gridColumn: 'span 4' }}><InfoTile icon={<CalendarDays size={16} />} label="Applied On" value={app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not available'} /></div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
              {app.expected_salary && <Pill color="#7c3aed" bg="#f5f3ff" border="#ddd6fe">💰 {app.expected_salary}</Pill>}
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
          </div>
        </Panel>

        {/* 2-col layout for AI Screening + Resume */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="ad-two-col">
          <style>{`.ad-two-col { @media(max-width:680px){ grid-template-columns:1fr !important } }`}</style>

          {/* AI Screening */}
          <Card style={{ padding: '22px 24px' }}>
            <SectionTitle icon={<Brain size={15} />} label="AI Screening" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 18 }}>
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
            <Card style={{ padding: '22px 24px' }}>
              <SectionTitle icon={<FileText size={15} />} label="Resume" />
              {app.resume_url && (
                <a href={app.resume_url} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f172a', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 16, boxShadow: '0 8px 18px rgba(15,23,42,.12)' }}>
                  <ExternalLink size={13} /> View Resume PDF
                </a>
              )}
              {parsed.summary && (
                <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.8, margin: '0 0 16px', background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
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
                {!decisionGatedByInterview ? (
                  <>
                    <ActionBtn variant="hire" onClick={() => handleAction('hire')} disabled={!!actionLoading}>
                      <CheckCircle size={14} /> {actionLoading === 'hire' ? 'Processing…' : 'Hire Candidate'}
                    </ActionBtn>
                    <ActionBtn variant="reject" onClick={() => handleAction('reject')} disabled={!!actionLoading}>
                      <XCircle size={14} /> {actionLoading === 'reject' ? 'Processing…' : 'Reject'}
                    </ActionBtn>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px', background: '#f8fafc', color: '#64748b', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0' }}>
                    Awaiting panel interview evaluation before Hire/Reject can be finalized
                  </div>
                )}
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
