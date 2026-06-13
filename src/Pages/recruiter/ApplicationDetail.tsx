import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { recruiterAPI } from '../../services/recruiterAPI';
import { getStatusStyle, STATUS_LABEL } from '../../styles/theme';

const eligColor = (e: string) =>
  e === 'excellent' ? '#15803d' : e === 'strong' ? '#0369a1' : e === 'good' ? '#c2410c' : '#b91c1c';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="ad-section" style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: 24 }}>
    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: any }> = ({ label, value }) =>
  value ? (
    <div>
      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 14, color: '#0f172a', margin: 0 }}>{value}</p>
    </div>
  ) : null;

const statusColor: Record<string, string> = {
  pending: '#f59e0b', shortlisted: '#10b981', rejected: '#ef4444',
  interview_sent: '#3b82f6', hired: '#8b5cf6',
};

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
        if (a.interviewResult && !['shortlisted', 'rejected', 'hired'].includes(st)) {
          setDecisionModal(a.interviewScore < 50 ? 'rejected' : 'selected');
        }
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
        if (res.emailSent) alert(`Hired! Email sent to ${res.sentTo}`);
      } else {
        const res = await recruiterAPI.sendDecision(applicationId!, 'rejected');
        setApp((a: any) => ({ ...a, status: 'rejected', finalDecision: 'rejected' }));
        if (res.emailSent) alert(`Rejection email sent to ${res.sentTo}`);
      }
    } catch { alert('Failed to update status'); }
    finally { setActionLoading(''); }
  };

  const handleAction = async (action: 'hire' | 'reject' | 'send-assessment') => {
    if (action === 'reject' && !window.confirm('Reject this candidate?')) return;
    if (action === 'hire' && !window.confirm('Hire this candidate?')) return;
    setActionLoading(action);
    try {
      if (action === 'hire') {
        const res = await recruiterAPI.sendDecision(applicationId!, 'hired');
        setApp((a: any) => ({ ...a, status: 'hired', finalDecision: 'hired' }));
        alert(res.emailSent ? `Hired! Email sent to ${res.sentTo}` : 'Marked as Hired');
      } else if (action === 'reject') {
        const res = await recruiterAPI.sendDecision(applicationId!, 'rejected');
        setApp((a: any) => ({ ...a, status: 'rejected', finalDecision: 'rejected' }));
        alert(res.emailSent ? `Rejection email sent to ${res.sentTo}` : 'Marked as Not Selected');
      } else {
        const res = await recruiterAPI.sendAssessment(applicationId!);
        setApp((a: any) => ({ ...a, status: 'interview_sent' }));
        alert(res.emailSent ? `Interview link sent to ${res.sentTo}` : 'Link generated!');
      }
    } catch { alert(`Failed to ${action}`); }
    finally { setActionLoading(''); }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSavingNote(true);
    setNoteMsg('');
    try {
      await recruiterAPI.addNote(applicationId!, note);
      setNoteMsg('Note saved');
      setNote('');
      const a = await loadApp(applicationId!);
      setApp(a);
    } catch { setNoteMsg('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (error || !app) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 }}>
      <p style={{ color: '#b91c1c', fontSize: 14 }}>{error || 'Not found'}</p>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 18px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13 }}>Go Back</button>
    </div>
  );

  const parsed = app.parsed_resume || {};
  const status = (app.status || '').toLowerCase();
  const st = getStatusStyle(status);
  const resumeScore = parseFloat(app.match_score ?? 0);
  const intScore = app.interviewScore ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif", animation:'ad-in .22s ease' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes ad-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .ad-section{animation:ad-in .2s ease both}
        .ad-section:nth-child(2){animation-delay:.05s}
        .ad-section:nth-child(3){animation-delay:.1s}
        .ad-section:nth-child(4){animation-delay:.15s}
        .ad-section:nth-child(5){animation-delay:.2s}
        .ad-section:nth-child(6){animation-delay:.25s}
      `}</style>

      {/* Auto-Decision Modal */}
      {decisionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '36px 32px', maxWidth: 400, width: '100%', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>{decisionModal === 'selected' ? '🎉' : '❌'}</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: decisionModal === 'selected' ? '#15803d' : '#b91c1c', margin: '0 0 10px' }}>
              {decisionModal === 'selected' ? 'Candidate Qualified' : 'Candidate Not Qualified'}
            </h2>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 6px' }}>
              <strong>{app.name}</strong> scored <strong style={{ fontSize: 17, color: decisionModal === 'selected' ? '#15803d' : '#b91c1c' }}>{intScore}%</strong>
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 24px' }}>
              {decisionModal === 'selected' ? 'Score ≥ 50% — Qualifies for hire.' : 'Score < 50% — Auto rejection.'}
            </p>
            <button
              onClick={() => handleAutoDecision(decisionModal)}
              style={{ width: '100%', padding: '12px', background: decisionModal === 'selected' ? '#15803d' : '#b91c1c', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              {decisionModal === 'selected' ? '✓ Confirm Hire' : '✗ Confirm Reject'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, padding: 0 }}>
          <ArrowLeft size={15} /> Back
        </button>
        <span style={{ color: '#e2e8f0' }}>|</span>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, flex: 1 }}>Application Detail</h1>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: st.bg, color: st.color }}>
          {STATUS_LABEL[status] || app.status}
        </span>
        {!['hired', 'rejected'].includes(status) && (
          <button onClick={() => handleAction('reject')} disabled={!!actionLoading}
            style={{ padding: '7px 16px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {actionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
          </button>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Score Summary */}
        {(resumeScore > 0 || intScore > 0) && (
          <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '18px 24px' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
              {resumeScore > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Resume Match</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: resumeScore >= 70 ? '#15803d' : resumeScore >= 50 ? '#c2410c' : '#b91c1c', margin: 0, lineHeight: 1 }}>{resumeScore}%</p>
                </div>
              )}
              {intScore > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Interview Score</p>
                  <p style={{ fontSize: 28, fontWeight: 800, color: intScore >= 50 ? '#15803d' : '#b91c1c', margin: 0, lineHeight: 1 }}>{intScore}%</p>
                </div>
              )}
              {app.interviewResult && (
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ padding: '7px 20px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: app.interviewResult === 'Selected' ? '#f0fdf4' : '#fef2f2', color: app.interviewResult === 'Selected' ? '#15803d' : '#b91c1c', border: `1px solid ${app.interviewResult === 'Selected' ? '#bbf7d0' : '#fecaca'}` }}>
                    {app.interviewResult === 'Selected' ? '✓ Selected' : '✗ Not Selected'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Candidate Info */}
        <Section title="Candidate Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <InfoRow label="Full Name" value={app.name || parsed.name} />
            <InfoRow label="Email" value={app.email || parsed.email} />
            <InfoRow label="Phone" value={app.phone || parsed.phone} />
            <InfoRow label="Location" value={app.location} />
            <InfoRow label="Experience" value={app.experience_years != null ? `${app.experience_years} year(s)` : null} />
            <InfoRow label="Expected Salary" value={app.expected_salary} />
            <InfoRow label="Applied For" value={app.job_title} />
            <InfoRow label="Applied At" value={app.applied_at ? new Date(app.applied_at).toLocaleString() : null} />
          </div>
        </Section>

        {/* AI Screening */}
        <Section title="AI Screening">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <InfoRow label="Match Score" value={app.match_score != null ? `${app.match_score}%` : null} />
            {app.eligibility_status && (
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Eligibility</p>
                <span style={{ padding: '4px 12px', borderRadius: 20, background: eligColor(app.eligibility_status) + '20', color: eligColor(app.eligibility_status), fontSize: 12, fontWeight: 600 }}>
                  {app.eligibility_status}
                </span>
              </div>
            )}
          </div>
          {app.matched_skills?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Matched Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {app.matched_skills.map((sk: string) => <span key={sk} style={{ padding: '3px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{sk}</span>)}
              </div>
            </div>
          )}
          {app.missing_skills?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Missing Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {app.missing_skills.map((sk: string) => <span key={sk} style={{ padding: '3px 10px', background: '#fef2f2', color: '#b91c1c', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{sk}</span>)}
              </div>
            </div>
          )}
        </Section>

        {/* Resume */}
        {(app.resume_url || parsed.skills?.length > 0 || parsed.summary) && (
          <Section title="Resume">
            {app.resume_url && (
              <a href={app.resume_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: '#0f172a', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 14 }}>
                <ExternalLink size={14} /> View Resume PDF
              </a>
            )}
            {parsed.summary && <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: '0 0 14px' }}>{parsed.summary}</p>}
            {parsed.skills?.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Skills from Resume</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {parsed.skills.map((sk: string) => <span key={sk} style={{ padding: '3px 10px', background: '#eef2ff', color: '#4f46e5', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>{sk}</span>)}
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Actions */}
        <Section title="Actions">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {!['hired', 'rejected'].includes(status) && (
              <>
                <button onClick={() => handleAction('hire')} disabled={!!actionLoading}
                  style={{ padding: '10px 22px', background: '#15803d', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading === 'hire' ? 'Processing...' : '✓ Hire'}
                </button>
                <button onClick={() => handleAction('reject')} disabled={!!actionLoading}
                  style={{ padding: '10px 22px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === 'reject' ? 'Processing...' : 'Reject'}
                </button>
                <button onClick={() => handleAction('send-assessment')} disabled={!!actionLoading}
                  style={{ padding: '10px 22px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
                  {actionLoading === 'send-assessment' ? 'Sending...' : status === 'interview_sent' ? 'Resend Interview Link' : 'Send Interview Link'}
                </button>
              </>
            )}
            {status === 'hired' && <div style={{ padding: '10px 18px', background: '#f0fdf4', color: '#15803d', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>Candidate Hired — Email Sent</div>}
            {status === 'rejected' && <div style={{ padding: '10px 18px', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid #fecaca' }}>Not Selected — Email Sent</div>}
          </div>
        </Section>

        {/* Recruiter Note */}
        <Section title="Recruiter Notes">
          {app.recruiter_note && (
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 14 }}>
              <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>{app.recruiter_note}</p>
            </div>
          )}
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={3} required
              style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical', width: '100%', boxSizing: 'border-box', outline: 'none', color: '#0f172a' }} />
            {noteMsg && <p style={{ color: noteMsg.includes('Failed') ? '#b91c1c' : '#15803d', fontSize: 13, margin: 0 }}>{noteMsg}</p>}
            <button type="submit" disabled={savingNote}
              style={{ padding: '9px 20px', background: savingNote ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: savingNote ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {savingNote ? 'Saving...' : 'Add Note'}
            </button>
          </form>
        </Section>

      </div>
    </div>
  );
};

export default ApplicationDetail;
