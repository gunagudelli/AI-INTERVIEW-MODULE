import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI, recruiterAPI, applicationAPI } from '../../services/recruiterAPI';

const STEPS = ['pending', 'screened', 'approved', 'interview_sent', 'hired'];

const STATUS_META: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:        { bg: '#fffbeb', color: '#b45309', border: '#fcd34d', label: 'Under review' },
  screened:       { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', label: 'AI Screened' },
  approved:       { bg: '#f0fdf4', color: '#15803d', border: '#86efac', label: 'Approved' },
  rejected:       { bg: '#fff1f2', color: '#be123c', border: '#fda4af', label: 'Not selected' },
  interview_sent: { bg: '#faf5ff', color: '#7c3aed', border: '#c4b5fd', label: 'Interview sent' },
  hired:          { bg: '#ecfdf5', color: '#065f46', border: '#6ee7b7', label: 'Hired' },
};

const STAT_CONFIG = [
  { key: 'total',          label: 'Total',     color: '#6366f1', bg: '#eef2ff' },
  { key: 'screened',       label: 'Screened',  color: '#2563eb', bg: '#eff6ff' },
  { key: 'interview_sent', label: 'Interview', color: '#7c3aed', bg: '#faf5ff' },
  { key: 'hired',          label: 'Hired',     color: '#16a34a', bg: '#f0fdf4' },
  { key: 'rejected',       label: 'Rejected',  color: '#be123c', bg: '#fff1f2' },
];

const STEP_LABELS: Record<string, string> = {
  pending: 'Submitted', screened: 'Screened', approved: 'Approved',
  interview_sent: 'Interview', hired: 'Hired',
};

const font = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(.94) translateY(10px); } to { opacity:1; transform:none; } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes popIn   { 0%{opacity:0;transform:scale(.7)} 60%{transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }
  .ref-card { transition: border-color .15s, box-shadow .15s, transform .15s; }
  .ref-card:hover { border-color: #c4b5fd !important; box-shadow: 0 4px 18px rgba(109,40,217,.09) !important; transform: translateY(-1px); }
  .stat-card { transition: box-shadow .15s, transform .15s; }
  .stat-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,.08) !important; transform: translateY(-1px); }
  .btn-primary { transition: opacity .15s, transform .12s; }
  .btn-primary:hover { opacity: .88; transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-ghost { transition: background .12s; }
  .btn-ghost:hover { background: #f5f3ff !important; }
  input:focus, select:focus, textarea:focus { border-color: #a78bfa !important; box-shadow: 0 0 0 3px #ede9fe !important; outline: none; }
`;

// ── Avatar ─────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 40 }) => {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const palette = ['#7c3aed', '#2563eb', '#0891b2', '#16a34a', '#d97706', '#dc2626'];
  const color = palette[(name?.charCodeAt(0) || 0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28, flexShrink: 0,
      background: color + '18', border: `1.5px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.32, color,
    }}>
      {initials}
    </div>
  );
};

// ── StatusBadge ────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
      whiteSpace: 'nowrap', letterSpacing: '0.01em',
    }}>
      {meta.label}
    </span>
  );
};

// ── Timeline ───────────────────────────────────────────────────
const StatusTimeline: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'rejected') return (
    <div style={{ marginTop: 10 }}>
      <span style={{ fontSize: 11, color: '#be123c', background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 20, padding: '3px 10px', fontWeight: 500 }}>
        ✗ Not selected
      </span>
    </div>
  );
  const activeIdx = Math.max(STEPS.indexOf(status), 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
      {STEPS.map((step, i) => {
        const done = i <= activeIdx;
        const active = i === activeIdx;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: done ? '#6d28d9' : '#f1f5f9',
                border: active ? '2px solid #6d28d9' : done ? 'none' : '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: done ? 'white' : '#cbd5e1',
                boxShadow: active ? '0 0 0 3px #ede9fe' : 'none',
                transition: 'all .2s',
              }}>
                {done && !active ? (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : active ? (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                ) : i + 1}
              </div>
              <span style={{ fontSize: 9, color: active ? '#6d28d9' : done ? '#64748b' : '#cbd5e1', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ height: 2, flex: 1, minWidth: 10, background: i < activeIdx ? '#6d28d9' : '#e2e8f0', margin: '0 3px', marginBottom: 16, borderRadius: 2, transition: 'background .3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── InfoRow ────────────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
    <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{value}</div>
  </div>
);

// ── StatusNote ─────────────────────────────────────────────────
const StatusNote: React.FC<{ status: string; referral: any }> = ({ status, referral }) => {
  const configs: Record<string, { bg: string; border: string; color: string; icon: string; text: (r: any) => string }> = {
    interview_sent: { bg: '#faf5ff', border: '#e9d5ff', color: '#6d28d9', icon: '', text: r => `Interview link sent to ${r.candidate_email}. Waiting for them to complete.` },
    approved:       { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: '', text: r => `Approved! Interview invitation sent to ${r.candidate_email}.` },
    screened:       { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', icon: '', text: () => 'Resume AI-screened. Awaiting recruiter review.' },
    hired:          { bg: '#ecfdf5', border: '#6ee7b7', color: '#065f46', icon: '', text: r => `${r.candidate_name} has been hired! Your referral bonus is on its way.` },
    rejected:       { bg: '#fff1f2', border: '#fda4af', color: '#be123c', icon: '', text: r => r.review_notes || 'After careful consideration, this candidate was not moved forward.' },
  };
  const c = configs[status];
  if (!c) return null;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12, color: c.color }}>
      {c.text(referral)}
    </div>
  );
};

// ── Field helpers ──────────────────────────────────────────────
const inp = (filled: boolean): React.CSSProperties => ({
  width: '100%', padding: '9px 12px', fontSize: 13, fontFamily: font,
  background: filled ? '#faf5ff' : 'white', color: '#0f172a',
  border: `1.5px solid ${filled ? '#c4b5fd' : '#e2e8f0'}`,
  borderRadius: 8, outline: 'none', boxSizing: 'border-box' as const,
  transition: 'border-color .15s, box-shadow .15s',
});

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5 }}>{children}</label>
);

// ── Success Popup ──────────────────────────────────────────────
const SuccessPopup: React.FC<{ name: string; job: string; onClose: () => void }> = ({ name, job, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, animation: 'fadeIn .2s ease' }}>
    <div style={{ background: 'white', borderRadius: 20, padding: '40px 36px', maxWidth: 400, width: '100%', textAlign: 'center', border: '1px solid #e2e8f0', animation: 'scaleIn .3s ease' }}>
      {/* Animated check */}
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'popIn .4s ease' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.3px' }}>Referral Submitted!</h2>
      <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 18px', lineHeight: 1.6 }}>
        <strong style={{ color: '#0f172a' }}>{name}</strong> has been referred for<br />
        <strong style={{ color: '#6d28d9' }}>{job}</strong>
      </p>

      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '14px 18px', marginBottom: 22, textAlign: 'left' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>What happens next?</div>
        {[
          'AI screens the resume against JD',
          'Recruiter reviews the profile',
          'Candidate receives interview link',
        ].map((text, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, color: '#374151', marginBottom: i < 2 ? 7 : 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6d28d9', flexShrink: 0 }} />
            {text}
          </div>
        ))}
      </div>

      <button onClick={onClose} className="btn-primary"
        style={{ width: '100%', padding: '12px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
        View My Referrals
      </button>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
const EmployeeReferralDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('employee_ref_user') || '{}');
  const employeeId = user?.id;

  const [referrals, setReferrals]         = useState<any[]>([]);
  const [jobs, setJobs]                   = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [showForm, setShowForm]           = useState(false);
  const [showTracker, setShowTracker]     = useState(false);
  const [trackCode, setTrackCode]         = useState('');
  const [trackResult, setTrackResult]     = useState<any>(null);
  const [trackLoading, setTrackLoading]   = useState(false);
  const [trackError, setTrackError]       = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState('');
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const [successData, setSuccessData]     = useState<{ name: string; job: string } | null>(null);
  const [form, setForm] = useState({ candidateName: '', candidateEmail: '', candidatePhone: '', jobId: '', notes: '', relationship: '' });
  const [resumeFile, setResumeFile]       = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [selectedJob, setSelectedJob]     = useState<any>(null);
  const [aiMatch, setAiMatch]             = useState<{ score: number; matched: string[]; missing: string[] } | null>(null);

  const BASE = process.env.REACT_APP_RECRUITER_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const handleJobChange = async (jobId: string) => {
    setForm(p => ({ ...p, jobId }));
    setAiMatch(null);
    if (!jobId) { setSelectedJob(null); return; }
    try {
      const res = await recruiterAPI.getJobById(jobId);
      setSelectedJob(res?.job || res);
    } catch { setSelectedJob(jobs.find((j: any) => String(j.id) === jobId) || null); }
  };

  const parseAndFill = async (f: File, jobId?: string) => {
    setResumeParsing(true); setAiMatch(null);
    try {
      const fd = new FormData();
      fd.append('resume', f);
      if (jobId) fd.append('jobId', jobId);
      else fd.append('jobDescription', 'general');
      const res = await fetch(`${BASE}/api/applications/match-jd`, { method: 'POST', body: fd });
      const data = await res.json();
      const p = data?.candidate || {};
      setForm(prev => ({
        ...prev,
        candidateName:  p.name  || prev.candidateName,
        candidateEmail: p.email || prev.candidateEmail,
        candidatePhone: p.phone || prev.candidatePhone,
      }));
      const m = data?.match || data;
      const score = m?.match_score ?? m?.matchScore;
      if (score != null) setAiMatch({ score: Number(score), matched: m?.matchedSkills ?? m?.matched_skills ?? [], missing: m?.missingSkills ?? m?.missing_skills ?? [] });
    } catch { /* silent */ }
    finally { setResumeParsing(false); }
  };

  const loadData = useCallback(async () => {
    try {
      const refs = await referralAPI.getMyReferrals(employeeId);
      setReferrals(prev => {
        const next = refs.referrals || [];
        next.forEach((r: any) => { const old = prev.find((p: any) => p.id === r.id); if (old && old.status !== r.status) r._changed = true; });
        return next;
      });
    } catch { setReferrals([]); }
    try { const jobList = await recruiterAPI.getPublicJobs(); setJobs(jobList); }
    catch { setJobs([]); }
    finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) { navigate('/referral/login'); return; }
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [employeeId, loadData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError(''); setSubmitting(true);
    try {
      const refRes = await referralAPI.refer({ ...form, employeeId, jobId: Number(form.jobId) });
      const referralId = refRes.referral?.id;
      if (resumeFile && referralId) {
        const fd = new FormData();
        fd.append('resume', resumeFile);
        fd.append('jobId', form.jobId);
        fd.append('name', form.candidateName);
        fd.append('email', form.candidateEmail);
        fd.append('phone', form.candidatePhone);
        fd.append('referralId', String(referralId));
        fd.append('employeeId', String(employeeId));
        await applicationAPI.apply(fd);
      }
      const jobTitle = jobs.find((j: any) => String(j.id) === form.jobId)?.title || `Job #${form.jobId}`;
      setSuccessData({ name: form.candidateName, job: jobTitle });
      setShowForm(false);
      setForm({ candidateName: '', candidateEmail: '', candidatePhone: '', jobId: '', notes: '', relationship: '' });
      setResumeFile(null); setAiMatch(null); setSelectedJob(null);
      loadData();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || 'Failed to submit referral');
    } finally { setSubmitting(false); }
  };

  const trackStatus = async (e: React.FormEvent) => {
    e.preventDefault(); setTrackError(''); setTrackLoading(true); setTrackResult(null);
    const val = trackCode.trim();
    try {
      const isNumeric = /^\d+$/.test(val);
      const data = isNumeric ? await referralAPI.getById(Number(val)) : await referralAPI.trackByCode(val);
      const ref = data.referral || data;
      if (ref && (ref.id || ref.candidate_name)) setTrackResult(ref);
      else setTrackError('Referral not found');
    } catch { setTrackError('Referral not found'); }
    finally { setTrackLoading(false); }
  };

  const resetForm = () => {
    setShowForm(false); setResumeFile(null); setFormError('');
    setSelectedJob(null); setAiMatch(null);
    setForm({ candidateName: '', candidateEmail: '', candidatePhone: '', jobId: '', notes: '', relationship: '' });
  };

  const handleLogout = () => {
    localStorage.removeItem('employee_ref_token');
    localStorage.removeItem('employee_ref_user');
    navigate('/referral/login');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', fontFamily: font }}>
      <style>{CSS}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #6d28d9', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: font }}>Loading your referrals…</div>
      </div>
    </div>
  );

  const counts: Record<string, number> = {
    total:          referrals.length,
    screened:       referrals.filter(r => r.status === 'screened').length,
    interview_sent: referrals.filter(r => r.status === 'interview_sent').length,
    hired:          referrals.filter(r => r.status === 'hired').length,
    rejected:       referrals.filter(r => r.status === 'rejected').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: font }}>
      <style>{CSS}</style>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', height: 54, display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, color: 'white', fontWeight: 700 }}>R</span>
          </div>
          <div>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Referral Portal</span>
            <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>Employee dashboard</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={loadData} className="btn-ghost"
            style={{ fontSize: 12, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', fontWeight: 500, fontFamily: font }}>
            ↻ Refresh
          </button>
          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6d28d9' }}>
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{user.name || user.email}</span>
          </div>
          <button onClick={handleLogout} style={{ fontSize: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', fontFamily: font }}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px' }}>

        {/* ── Stat cards ──────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10, marginBottom: 28 }}>
          {STAT_CONFIG.map((s, i) => (
            <div key={s.key} className="stat-card"
              style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', padding: '14px 10px', textAlign: 'center', animation: `fadeUp .2s ease both`, animationDelay: `${i * 0.06}s` }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: '-0.03em' }}>{counts[s.key]}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>My Referrals</h2>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Live · auto-refreshes every 30s
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowTracker(true)} className="btn-ghost"
              style={{ padding: '8px 14px', background: 'white', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              Track status
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary"
              style={{ padding: '8px 16px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              + Refer Candidate
            </button>
          </div>
        </div>

        {/* ── Empty state ─────────────────────────────────── */}
        {referrals.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: '2px dashed #e2e8f0', padding: '64px 24px', textAlign: 'center', animation: 'fadeUp 0.3s ease' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="24" height="24" fill="none" stroke="#6d28d9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>No referrals yet</div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 22 }}>Start referring great candidates and earn bonuses!</div>
            <button onClick={() => setShowForm(true)} className="btn-primary"
              style={{ padding: '10px 24px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
              + Refer a Candidate
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {referrals.map((r: any, idx: number) => {
              const isExpanded = expandedId === r.id;
              return (
                <div key={r.id} className="ref-card"
                  style={{
                    background: 'white', borderRadius: 14,
                    border: `1.5px solid ${r._changed ? '#c4b5fd' : '#e2e8f0'}`,
                    padding: '18px 22px', cursor: 'pointer',
                    boxShadow: r._changed ? '0 0 0 3px #ede9fe' : 'none',
                    animation: `fadeUp .2s ease both`, animationDelay: `${idx * 0.05}s`,
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  {/* Main row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <Avatar name={r.candidate_name} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{r.candidate_name}</span>
                          <span style={{ fontSize: 10, color: '#94a3b8', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 4, padding: '1px 6px' }}>#{r.id}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>{r.candidate_email}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#7c3aed', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 5, padding: '2px 8px', marginTop: 2 }}>
                          {r.job_title || `Job #${r.job_id}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      <StatusBadge status={r.status} />
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                      <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 500 }}>{isExpanded ? '▲ less' : '▼ details'}</span>
                    </div>
                  </div>

                  <StatusTimeline status={r.status} />

                  {/* Expanded */}
                  {isExpanded && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9', animation: 'fadeUp 0.18s ease' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                        <InfoRow label="Referral ID" value={`#${r.id}`} />
                        <InfoRow label="Job" value={r.job_title || `Job #${r.job_id}`} />
                        <InfoRow label="Submitted" value={r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN') : '—'} />
                        <InfoRow label="Last updated" value={r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-IN') : '—'} />
                      </div>
                      {r.notes && <div style={{ marginBottom: 8 }}><InfoRow label="Notes" value={r.notes} /></div>}
                      <StatusNote status={r.status} referral={r} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Track Modal ──────────────────────────────────────── */}
      {showTracker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, animation: 'fadeIn .15s ease' }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 440, padding: '28px 26px', border: '1px solid #e2e8f0', animation: 'scaleIn .22s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Track Referral</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>Enter referral ID to check status</p>
              </div>
              <button onClick={() => { setShowTracker(false); setTrackResult(null); setTrackError(''); }}
                style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 17, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font }}>×</button>
            </div>

            <form onSubmit={trackStatus} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={trackCode} onChange={e => setTrackCode(e.target.value)}
                placeholder="e.g. 42"
                style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', fontFamily: font, transition: 'border-color .15s' }} />
              <button type="submit" disabled={trackLoading || !trackCode.trim()}
                style={{ padding: '10px 18px', background: '#6d28d9', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: trackLoading || !trackCode.trim() ? 0.5 : 1, fontFamily: font }}>
                {trackLoading ? '…' : 'Check'}
              </button>
            </form>

            {trackError && (
              <div style={{ background: '#fff1f2', border: '1px solid #fda4af', color: '#be123c', padding: '10px 13px', borderRadius: 9, fontSize: 13, marginBottom: 12 }}>
                {trackError}
              </div>
            )}

            {trackResult && (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', animation: 'fadeUp .2s ease' }}>
                <div style={{ background: '#6d28d9', padding: '16px 18px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{trackResult.candidate_name}</div>
                  <div style={{ fontSize: 12, color: '#c4b5fd', marginTop: 3 }}>{trackResult.job_title}</div>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Current status</span>
                    <StatusBadge status={trackResult.status} />
                  </div>
                  <StatusTimeline status={trackResult.status} />
                  {trackResult.review_notes && (
                    <div style={{ fontSize: 12, color: '#374151', background: '#f8fafc', borderRadius: 8, padding: '9px 12px', lineHeight: 1.6 }}>
                      {trackResult.review_notes}
                    </div>
                  )}
                  {trackResult.expected_bonus && (
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
                      {trackResult.expected_bonus}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Refer Modal ──────────────────────────────────────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16, animation: 'fadeIn .15s ease' }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 500, maxHeight: '92vh', overflowY: 'auto', border: '1px solid #e2e8f0', animation: 'scaleIn .22s ease' }}>

            {/* Modal header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Refer a Candidate</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>They'll receive an email with interview link</p>
              </div>
              <button onClick={resetForm}
                style={{ width: 30, height: 30, borderRadius: 8, background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: 17, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: font }}>×</button>
            </div>

            <div style={{ padding: '22px 24px' }}>
              {formError && (
                <div style={{ background: '#fff1f2', border: '1px solid #fda4af', color: '#be123c', padding: '10px 13px', borderRadius: 9, marginBottom: 16, fontSize: 13 }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Job + Relationship */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Job *</FieldLabel>
                    <select required value={form.jobId} onChange={e => handleJobChange(e.target.value)} style={{ ...inp(false), background: 'white' }}>
                      <option value="">Select job</option>
                      {jobs.map((j: any) => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Relationship</FieldLabel>
                    <select value={form.relationship} onChange={e => setForm(p => ({ ...p, relationship: e.target.value }))} style={{ ...inp(false), background: 'white' }}>
                      <option value="">Select</option>
                      <option value="current_colleague">Current colleague</option>
                      <option value="former_colleague">Former colleague</option>
                      <option value="friend">Friend</option>
                      <option value="professional_network">Professional network</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* JD Preview */}
                {selectedJob && (
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 12, padding: '14px 16px', animation: 'fadeUp 0.2s ease' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Job Details</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 6 }}>{selectedJob.title}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: selectedJob.description ? 8 : 0 }}>
                      {selectedJob.location && <span style={{ fontSize: 11, background: 'white', border: '1px solid #e9d5ff', borderRadius: 5, padding: '2px 8px', color: '#4c1d95' }}>{selectedJob.location}</span>}
                      {selectedJob.type && <span style={{ fontSize: 11, background: 'white', border: '1px solid #e9d5ff', borderRadius: 5, padding: '2px 8px', color: '#4c1d95' }}>{selectedJob.type}</span>}
                      {selectedJob.experience_years != null && <span style={{ fontSize: 11, background: 'white', border: '1px solid #e9d5ff', borderRadius: 5, padding: '2px 8px', color: '#4c1d95' }}>{selectedJob.experience_years}+ yrs</span>}
                    </div>
                    {(selectedJob.skills ?? selectedJob.required_skills)?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(selectedJob.skills ?? selectedJob.required_skills).map((sk: string) => (
                          <span key={sk} style={{ fontSize: 11, background: 'white', border: '1px solid #c4b5fd', borderRadius: 20, padding: '2px 8px', color: '#5b21b6', fontWeight: 500 }}>{sk}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Resume upload */}
                <div>
                  <FieldLabel>Resume <span style={{ color: '#94a3b8', textTransform: 'none', fontWeight: 400 }}>(AI matches against JD)</span></FieldLabel>
                  <div
                    onClick={() => !resumeParsing && document.getElementById('ref-resume')?.click()}
                    style={{
                      border: `2px dashed ${resumeFile ? '#c4b5fd' : '#e2e8f0'}`,
                      borderRadius: 10, padding: '14px', textAlign: 'center',
                      cursor: resumeParsing ? 'default' : 'pointer',
                      background: resumeFile ? '#faf5ff' : '#f8fafc', transition: 'all 0.15s',
                    }}
                  >
                    {resumeParsing ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: '2px solid #e0d9ff', borderTop: '2px solid #6d28d9', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 500 }}>Analyzing resume vs JD…</span>
                      </div>
                    ) : resumeFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#6d28d9', fontWeight: 600 }}>{resumeFile.name}</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setResumeFile(null); setAiMatch(null); setForm(p => ({ ...p, candidateName: '', candidateEmail: '', candidatePhone: '' })); }}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 17, fontFamily: font, lineHeight: 1 }}>×</button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{form.jobId ? 'Upload resume — AI matches against JD' : 'Select a job first, then upload resume'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>PDF, DOC, DOCX</div>
                      </div>
                    )}
                  </div>
                  <input id="ref-resume" type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) { setResumeFile(f); parseAndFill(f, form.jobId || undefined); } }} />
                </div>

                {/* AI Match Result */}
                {aiMatch && (
                  <div style={{ background: aiMatch.score >= 60 ? '#f0fdf4' : '#fff7ed', border: `1.5px solid ${aiMatch.score >= 60 ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 12, padding: '14px 16px', animation: 'fadeUp 0.2s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: aiMatch.score >= 60 ? '#15803d' : '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Match Score</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{ fontSize: 22, fontWeight: 800, color: aiMatch.score >= 60 ? '#16a34a' : '#ea580c', letterSpacing: '-0.03em' }}>{aiMatch.score}%</span>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20, background: aiMatch.score >= 60 ? '#dcfce7' : '#fed7aa', color: aiMatch.score >= 60 ? '#15803d' : '#c2410c' }}>
                          {aiMatch.score >= 75 ? 'Strong' : aiMatch.score >= 60 ? 'Good' : aiMatch.score >= 40 ? 'Moderate' : 'Weak'}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${aiMatch.score}%`, background: aiMatch.score >= 60 ? '#16a34a' : '#f97316', borderRadius: 3, transition: 'width 0.8s ease' }} />
                    </div>
                    {aiMatch.matched.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#15803d', marginBottom: 5 }}>✓ Matched</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {aiMatch.matched.map((sk: string) => <span key={sk} style={{ fontSize: 11, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 8px', color: '#15803d', fontWeight: 500 }}>{sk}</span>)}
                        </div>
                      </div>
                    )}
                    {aiMatch.missing.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', marginBottom: 5 }}>✗ Missing</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {aiMatch.missing.map((sk: string) => <span key={sk} style={{ fontSize: 11, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 20, padding: '2px 8px', color: '#dc2626', fontWeight: 500 }}>{sk}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <FieldLabel>Full Name *</FieldLabel>
                    <input type="text" required placeholder="Full name" value={form.candidateName}
                      onChange={e => setForm(p => ({ ...p, candidateName: e.target.value }))}
                      style={inp(!!form.candidateName)} />
                  </div>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <input type="tel" placeholder="+91 9999999999" value={form.candidatePhone}
                      onChange={e => setForm(p => ({ ...p, candidatePhone: e.target.value }))}
                      style={inp(!!form.candidatePhone)} />
                  </div>
                </div>

                <div>
                  <FieldLabel>Email *</FieldLabel>
                  <input type="email" required placeholder="candidate@email.com" value={form.candidateEmail}
                    onChange={e => setForm(p => ({ ...p, candidateEmail: e.target.value }))}
                    style={inp(!!form.candidateEmail)} />
                </div>

                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Why are you referring this candidate?" rows={2}
                    style={{ ...inp(false), resize: 'none' }} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  <button type="button" onClick={resetForm}
                    style={{ flex: 1, padding: '11px', background: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || resumeParsing} className="btn-primary"
                    style={{ flex: 2, padding: '11px', background: submitting ? '#a78bfa' : '#6d28d9', color: 'white', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {submitting
                      ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
                      : '→ Submit Referral'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Popup ────────────────────────────────────── */}
      {successData && (
        <SuccessPopup
          name={successData.name}
          job={successData.job}
          onClose={() => setSuccessData(null)}
        />
      )}
    </div>
  );
};

export default EmployeeReferralDashboard;
