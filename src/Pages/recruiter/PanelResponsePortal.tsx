import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Plus, Trash2 } from 'lucide-react';
import { panelResponseAPI } from '../../services/recruiterAPI';

interface Slot { date: string; startTime: string; endTime: string; }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; }
  .prp-btn { transition: filter .1s; cursor: pointer; font-family: inherit; }
  .prp-btn:hover { filter: brightness(0.95); }
  .prp-btn:disabled { cursor: not-allowed; opacity: 0.55; }
`;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting your response',
  rejected: 'You declined this assignment',
  slots_submitted: 'Availability submitted — waiting on recruiter to confirm',
  recruiter_confirmed: 'Recruiter has confirmed a slot',
  candidate_invited: 'Interview confirmed — candidate has been invited',
  completed: 'Interview completed',
  cancelled: 'This assignment was cancelled',
};

const PanelResponsePortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'accept' | 'reject'>('view');
  const [slots, setSlots] = useState<Slot[]>([{ date: '', startTime: '', endTime: '' }]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    panelResponseAPI.getAssignment(token)
      .then(setAssignment)
      .catch((err: any) => setError(err?.response?.data?.error || 'This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const switchMode = (next: 'view' | 'accept' | 'reject') => { setError(null); setMode(next); };

  const updateSlot = (idx: number, field: keyof Slot, value: string) =>
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const addSlot = () => setSlots(prev => [...prev, { date: '', startTime: '', endTime: '' }]);
  const removeSlot = (idx: number) => setSlots(prev => prev.filter((_, i) => i !== idx));

  const handleAccept = async () => {
    const validSlots = slots.filter(s => s.date && s.startTime);
    if (!validSlots.length) { setError('Please provide at least one available date/time.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await panelResponseAPI.accept(token!, validSlots);
      setDoneMessage('Thank you! Your availability has been submitted. The recruiter will confirm a slot shortly.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit availability.');
    } finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!reason.trim()) { setError('Please provide a reason for declining.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await panelResponseAPI.reject(token!, reason.trim());
      setDoneMessage('You have declined this interview assignment. The recruiter has been notified.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit response.');
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <style>{CSS}</style>
        <p style={{ color: '#64748B', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 20 }}>
        <style>{CSS}</style>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #FECACA', padding: '32px', maxWidth: 440, textAlign: 'center' }}>
          <XCircle size={32} color="#DC2626" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 16, color: '#0F172A', margin: '0 0 8px' }}>Unable to load assignment</h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (doneMessage) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 20 }}>
        <style>{CSS}</style>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #BBF7D0', padding: '32px', maxWidth: 440, textAlign: 'center' }}>
          <CheckCircle size={32} color="#16A34A" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#0F172A', margin: 0 }}>{doneMessage}</p>
        </div>
      </div>
    );
  }

  const skills: string[] = Array.isArray(assignment?.matched_skills) ? assignment.matched_skills
    : Array.isArray(assignment?.job_required_skills) ? assignment.job_required_skills : [];
  const isPending = assignment?.status === 'pending';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 16px', color: '#0F172A' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Interview Panel Assignment</h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>Hi {assignment?.panel_member_name || 'there'}, please review the details below.</p>

        {!isPending && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1D4ED8', fontWeight: 600 }}>
            {STATUS_LABEL[assignment?.status] || assignment?.status}
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '20px 22px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Candidate</h3>
          <p style={{ margin: '0 0 4px', fontSize: 13.5 }}><strong>{assignment?.candidate_name}</strong></p>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748B' }}>{assignment?.candidate_email} {assignment?.candidate_phone ? `· ${assignment.candidate_phone}` : ''}</p>
          <p style={{ margin: '0 0 4px', fontSize: 13, color: '#64748B' }}>Experience: {assignment?.experience_years ?? 'N/A'} year(s)</p>
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
              {skills.map((sk: string) => (
                <span key={sk} style={{ padding: '2px 9px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11.5, fontWeight: 500 }}>{sk}</span>
              ))}
            </div>
          )}
          {assignment?.resume_url && (
            <a href={assignment.resume_url} target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, color: '#374151', textDecoration: 'none', fontWeight: 600 }}>
              <FileText size={13} /> View Resume
            </a>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '20px 22px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Job & Assessment</h3>
          <p style={{ margin: '0 0 4px', fontSize: 13.5 }}><strong>{assignment?.job_title}</strong></p>
          {assignment?.job_description && (
            <p style={{ margin: '0 0 8px', fontSize: 12.5, color: '#64748B', whiteSpace: 'pre-wrap' }}>{assignment.job_description}</p>
          )}
          {(assignment?.assessment_score !== null && assignment?.assessment_score !== undefined) && (
            <p style={{ margin: 0, fontSize: 13 }}>Assessment Score: <strong style={{ color: '#15803D' }}>{assignment.assessment_score}%</strong></p>
          )}
        </div>

        {isPending && mode === 'view' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="prp-btn" onClick={() => switchMode('accept')}
              style={{ flex: 1, padding: '11px 0', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CheckCircle size={15} /> Accept
            </button>
            <button className="prp-btn" onClick={() => switchMode('reject')}
              style={{ flex: 1, padding: '11px 0', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}

        {isPending && mode === 'accept' && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Your Available Slots</h3>
            {slots.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input type="date" value={s.date} onChange={e => updateSlot(idx, 'date', e.target.value)}
                  style={{ padding: '7px 9px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, flex: 1 }} />
                <input type="time" value={s.startTime} onChange={e => updateSlot(idx, 'startTime', e.target.value)}
                  style={{ padding: '7px 9px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, flex: 1 }} />
                <input type="time" value={s.endTime} onChange={e => updateSlot(idx, 'endTime', e.target.value)}
                  style={{ padding: '7px 9px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, flex: 1 }} />
                {slots.length > 1 && (
                  <button className="prp-btn" onClick={() => removeSlot(idx)}
                    style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, width: 30, height: 30, color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            <button className="prp-btn" onClick={addSlot}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 16 }}>
              <Plus size={12} /> Add another slot
            </button>
            {error && <p style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="prp-btn" onClick={() => switchMode('view')} style={{ padding: '9px 16px', background: 'none', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Back</button>
              <button className="prp-btn" onClick={handleAccept} disabled={submitting}
                style={{ flex: 1, padding: '9px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700 }}>
                {submitting ? 'Submitting…' : 'Submit Availability'}
              </button>
            </div>
          </div>
        )}

        {isPending && mode === 'reject' && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '20px 22px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Reason for Declining</h3>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4}
              placeholder="Let the recruiter know why you can't take this interview…"
              style={{ width: '100%', padding: '9px 11px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 12 }} />
            {error && <p style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="prp-btn" onClick={() => switchMode('view')} style={{ padding: '9px 16px', background: 'none', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12.5, fontWeight: 600, color: '#64748B' }}>Back</button>
              <button className="prp-btn" onClick={handleReject} disabled={submitting}
                style={{ flex: 1, padding: '9px 16px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700 }}>
                {submitting ? 'Submitting…' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PanelResponsePortal;
