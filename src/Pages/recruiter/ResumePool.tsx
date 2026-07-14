import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import recruiterAPI from '../../services/recruiterAPI';
import BASE_URL from '../../Config';
import {
  Search, CheckCircle, XCircle, ExternalLink, Send,
  ChevronDown, ChevronUp, X, AlertCircle, Briefcase,
  MapPin, SlidersHorizontal, ArrowLeft, RefreshCw,
  Building2, Clock, Users, FileText, Zap, Database, Star,
  Mail,
} from 'lucide-react';
import { ToastContainer } from '../../components/common/Toast';
import { useNotification } from '../../hooks/useNotification';

const BASE = BASE_URL;

/* ── tokens ── */
const T = {
  bg: '#F9FAFB',
  card: '#FFFFFF',
  border: '#E5E7EB',
  borderLt: '#F3F4F6',
  text: '#111827',
  textSec: '#374151',
  textMuted: '#9CA3AF',
  primary: '#1E3A5F',
  pLight: '#EFF6FF',
  pBorder: '#BFDBFE',
  success: '#14532D',
  sBg: '#F0FDF4',
  sBorder: '#BBF7D0',
  warning: '#78350F',
  wBg: '#FFFBEB',
  wBorder: '#FDE68A',
  error: '#7F1D1D',
  eBg: '#FEF2F2',
  eBorder: '#FECACA',
  teal: '#0F766E',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
};

/* ── interfaces ── */
interface Job {
  id: string; title: string; department: string; location: string;
  experience: number; status: string; total_applications?: number; skills: string[];
}
interface AppHist {
  job_id: string; job_title: string; status: string; match_score: number;
  assessment_sent: boolean; applied_at: string; recruiter_name: string;
  interview_score?: number | null; exam_completed?: boolean;
}
interface Candidate {
  id: string; name: string; email: string; phone: string; resume_url: string | null;
  source: string; experience_years: number; skills: string[]; match_score: number;
  matched_skills: string[]; missing_skills: string[]; reasoning: string; eligibility: string;
  status?: string; total_applications?: number; has_resume_data?: boolean;
  is_in_active_pipeline?: boolean; was_rejected?: boolean; was_hired?: boolean;
  assessment_sent?: boolean; rejection_count?: number;
  current_recruiter?: { name: string; email: string } | null;
  application_history?: AppHist[];
}
interface MatchResult {
  job_title: string; total: number; matched_count: number; partial_count: number;
  not_matched_count: number; already_in_db_count: number;
  matched: Candidate[]; partial: Candidate[]; unmatched: Candidate[];
}
type AStatus = 'idle' | 'loading' | 'done' | 'error';
interface JobState { status: AStatus; result?: MatchResult; error?: string; }

/* ── helpers ── */
const scoreCol = (s: number) => s >= 80 ? T.success : s >= 60 ? T.warning : T.error;
const scoreBg  = (s: number) => s >= 80 ? T.sBg     : s >= 60 ? T.wBg     : T.eBg;
const scoreBdr = (s: number) => s >= 80 ? T.sBorder  : s >= 60 ? T.wBorder  : T.eBorder;
const scoreTag = (s: number) => s >= 80 ? 'Strong'  : s >= 60 ? 'Fair'    : 'Weak';
const initials = (n: string) => n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const STAGE_MAP: Record<string, [string, string]> = {
  pending:             [T.borderLt,  T.textMuted],
  applied:             [T.pLight,    '#1D4ED8'],
  screened:            [T.wBg,       T.warning],
  shortlisted:         [T.pLight,    T.primary],
  interview_sent:      [T.wBg,       T.warning],
  interview_scheduled: ['#F5F3FF',   '#5B21B6'],
  rejected:            [T.eBg,       T.error],
  hired:               [T.sBg,       T.success],
};
const STAGE_LBL: Record<string, string> = {
  pending: 'Pending', applied: 'Applied', screened: 'Screened',
  shortlisted: 'Shortlisted', interview_sent: 'Sent',
  interview_scheduled: 'Scheduled', rejected: 'Rejected', hired: 'Hired',
};
const getSt  = (s?: string): [string, string] => STAGE_MAP[(s || 'pending').toLowerCase()] ?? STAGE_MAP.pending;
const getStL = (s?: string) => STAGE_LBL[(s || '').toLowerCase()] ?? (s || 'Pending');

/* ── global CSS ── */
const CSS = `
  @keyframes spin    { to { transform: rotate(360deg) } }
  @keyframes fadeUp  { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes scanLine {
    0%   { top: 0%;    opacity:0 }
    5%   { opacity:.7 }
    95%  { opacity:.7 }
    100% { top: 100%;  opacity:0 }
  }
  @keyframes dotBlink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
  @keyframes slideRight {
    0%   { transform:translateX(-100%); opacity:0 }
    15%  { opacity:1 }
    85%  { opacity:1 }
    100% { transform:translateX(260%);  opacity:0 }
  }
  @keyframes countUp  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes borderPulse { 0%,100%{border-color:${T.pBorder}} 50%{border-color:${T.primary}} }

  .rp-card:hover   { border-color:${T.pBorder} !important; background:${T.pLight} !important; }
  .rp-card:hover .rp-title { color:${T.primary} !important; }
  .rp-row:hover td { background:${T.bg} !important; }
  .rp-btn:hover    { background:${T.bg} !important; border-color:${T.pBorder} !important; }
`;

/* ── Spinner ── */
const Spin: React.FC<{ s?: number; c?: string }> = ({ s = 15, c = T.primary }) => (
  <div style={{ width: s, height: s, border: `2px solid ${c}28`, borderTop: `2px solid ${c}`, borderRadius: '50%', animation: 'spin .75s linear infinite', flexShrink: 0 }} />
);

/* ── Avatar ── */
const Avatar: React.FC<{ name: string; score: number }> = ({ name, score }) => (
  <div style={{ position: 'relative', flexShrink: 0 }}>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: scoreBg(score), border: `2px solid ${scoreBdr(score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: scoreCol(score), letterSpacing: '.04em' }}>
      {initials(name)}
    </div>
    <div style={{ position: 'absolute', bottom: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: scoreBg(score), border: `1.5px solid ${scoreBdr(score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: 7, fontWeight: 700, color: scoreCol(score) }}>{score >= 80 ? '✓' : score >= 60 ? '~' : '!'}</span>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   AI ANALYSIS SCREEN  — refined classic scanner
══════════════════════════════════════════════════════ */
const AIAnalysisScreen: React.FC<{ jobCount: number }> = ({ jobCount }) => {
  const [pct,  setPct]  = useState(0);
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState(1);

  const steps = ['Parsing job descriptions…', 'Extracting resume features…', 'Running skill matching…', 'Ranking candidates…'];

  useEffect(() => {
    const t = setInterval(() => setPct(p => p < 30 ? p + 2 : p < 65 ? p + 1 : p < 88 ? p + 0.4 : p < 93 ? p + 0.1 : p), 280);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setDots(d => d >= 3 ? 1 : d + 1), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minHeight: 360 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, overflow: 'hidden' }}>

          {/* top accent bar */}
          <div style={{ height: 3, background: T.primary }} />

          <div style={{ padding: '28px 28px 24px' }}>

            {/* scanner visual */}
            <div style={{ position: 'relative', height: 100, borderRadius: 10, background: T.bg, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 22 }}>
              {/* document lines */}
              {[20, 35, 50, 65, 80].map((top, i) => (
                <div key={i} style={{ position: 'absolute', top: `${top}%`, left: '10%', right: i % 2 === 0 ? '20%' : '35%', height: 2, background: T.border, borderRadius: 2 }} />
              ))}
              {/* scan line */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: T.primary, opacity: 0.6, animation: 'scanLine 2s ease-in-out infinite' }} />
              {/* glow behind scan line */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 24, background: `linear-gradient(to bottom, transparent, ${T.pLight}, transparent)`, animation: 'scanLine 2s ease-in-out infinite', top: -11, pointerEvents: 'none' }} />

              {/* left label */}
              <div style={{ position: 'absolute', top: 8, left: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={11} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.primary, letterSpacing: '.04em', textTransform: 'uppercase' }}>JDs</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.primary, lineHeight: 1 }}>{jobCount}</div>
                </div>
              </div>

              {/* right label */}
              <div style={{ position: 'absolute', top: 8, right: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: '.04em', textTransform: 'uppercase', textAlign: 'right' }}>Resumes</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textSec, lineHeight: 1, textAlign: 'right', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Spin s={11} c={T.textSec} />
                  </div>
                </div>
                <div style={{ width: 22, height: 22, borderRadius: 5, background: T.bg, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={11} style={{ color: T.textSec }} />
                </div>
              </div>

              {/* center icon */}
              <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.primary, opacity: 0.4, animation: `dotBlink 1.4s ease-in-out ${i * 0.22}s infinite` }} />
                ))}
              </div>
            </div>

            {/* status text */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 3, letterSpacing: '-0.2px' }}>
                Matching candidates{'·'.repeat(dots)}
              </div>
              <div key={step} style={{ fontSize: 12, color: T.textSec, animation: 'fadeUp .3s ease' }}>
                {steps[step]}
              </div>
            </div>

            {/* progress bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: T.textMuted }}>Progress</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.primary }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: 6, background: T.bg, borderRadius: 99, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ height: '100%', width: `${Math.round(pct)}%`, borderRadius: 99, background: T.primary, transition: 'width .4s ease' }} />
              </div>
            </div>

            {/* mini stats */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { l: 'JDs', v: jobCount, c: T.primary, bg: T.pLight },
                { l: 'Status', v: 'Running', c: T.success, bg: T.sBg },
              ].map(s => (
                <div key={s.l} style={{ flex: 1, background: s.bg, border: `1px solid ${s.c}22`, borderRadius: 8, padding: '7px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.c, textTransform: 'uppercase', letterSpacing: '.04em' }}>{s.l}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.c }}>{s.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 10, fontSize: 11, color: T.textMuted }}>
          Comparing every resume against all job descriptions
        </p>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DETAIL VIEW
══════════════════════════════════════════════════════ */
const Detail: React.FC<{ job: Job; state: JobState; onBack: () => void; onRetry: (j: Job) => void }> = ({
  job, state, onBack, onRetry,
}) => {
  const { status, result, error } = state;
  const [tab,      setTab]     = useState<'matched' | 'partial' | 'unmatched'>('matched');
  const [sortBy,   setSortBy]  = useState<'score' | 'exp'>('score');
  const [fExp,     setFExp]    = useState('');
  const [fSkill,   setFSkill]  = useState('');
  const [showF,    setShowF]   = useState(false);
  const [open,     setOpen]    = useState<string | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited,  setInvited] = useState<Set<string>>(new Set());
  const notifications = useNotification();

  const list = useMemo(() => {
    if (!result) return [];
    let l = tab === 'matched' ? result.matched ?? [] : tab === 'partial' ? result.partial ?? [] : result.unmatched ?? [];
    if (fExp)   l = l.filter(c => Number(c.experience_years) >= Number(fExp));
    if (fSkill) l = l.filter(c => c.skills?.some(s => s.toLowerCase().includes(fSkill.toLowerCase())));
    return [...l].sort((a, b) => sortBy === 'score' ? b.match_score - a.match_score : b.experience_years - a.experience_years);
  }, [result, tab, fExp, fSkill, sortBy]);

  const invite = async (c: Candidate) => {
    if (!c.email || c.email === '—') return notifications.error('No email on file.');
    setInviting(c.id);
    try {
      const r = await fetch(`${BASE}/api/recruiter/resume-pool/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('recruiter_token')}` },
        body: JSON.stringify({ email: c.email, name: c.name, jobId: job.id, jobTitle: job.title }),
      });
      if (r.ok) {
        setInvited(p => new Set(p).add(c.id));
        notifications.success('Invite sent successfully');
      } else {
        notifications.error('Invite failed.');
      }
    } catch {
      notifications.error('Invite failed.');
    }
    finally { setInviting(null); }
  };

  const mc  = result?.matched_count ?? 0;
  const pc  = result?.partial_count ?? 0;
  const uc  = result?.not_matched_count ?? 0;
  const dbC = result?.already_in_db_count ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter',sans-serif" }}>
      <style>{CSS}</style>
      <ToastContainer toasts={notifications.toasts} onClose={notifications.removeNotification} />

      {/* header */}
      <div style={{ background: '#FAFAFA', borderBottom: `1px solid ${T.border}`, padding: '0 28px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={onBack} className="rp-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: T.primary, background: T.card, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            <ArrowLeft size={12} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: T.border }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text, flex: 1, letterSpacing: '-0.2px' }}>{job.title}</span>
          {job.department && <span style={{ fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><Building2 size={10} />{job.department}</span>}
          {job.location   && <span style={{ fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{job.location}</span>}
          {job.experience > 0 && <span style={{ fontSize: 12, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{job.experience}+ yrs</span>}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 28px' }}>

        {status === 'loading' && (
          <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 64, textAlign: 'center' }}>
            <Spin s={26} /><p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '14px 0 4px' }}>Analyzing resume pool…</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Matching against <strong>{job.title}</strong></p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.eBorder}`, padding: 52, textAlign: 'center' }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: T.eBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <AlertCircle size={18} style={{ color: T.error }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: '0 0 5px' }}>Analysis failed</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 14px' }}>{error ?? 'Something went wrong.'}</p>
            <button onClick={() => onRetry(job)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={11} /> Retry
            </button>
          </div>
        )}

        {status === 'done' && result && (
          <>
            {/* stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { l: 'Total',          v: result.total, ic: FileText,    vc: T.primary, bg: T.pLight,   bd: T.pBorder  },
                { l: 'Matched ≥80%',   v: mc,           ic: CheckCircle, vc: T.success, bg: T.sBg,      bd: T.sBorder  },
                { l: 'Partial 60–79%', v: pc,           ic: Star,        vc: T.warning, bg: T.wBg,      bd: T.wBorder  },
                { l: 'No match',       v: uc,           ic: XCircle,     vc: T.error,   bg: T.eBg,      bd: T.eBorder  },
                { l: 'In pipeline',    v: dbC,          ic: Database,    vc: T.teal,    bg: T.tealBg,   bd: T.tealBorder },
              ].map(s => {
                const Icon = s.ic;
                return (
                  <div key={s.l} style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, border: `1px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} style={{ color: s.vc }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.vc, lineHeight: 1, letterSpacing: '-0.02em', animation: 'countUp .4s ease' }}>{s.v}</div>
                      <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{s.l}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* tab bar */}
            <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', borderBottom: `1px solid ${T.borderLt}`, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex' }}>
                  {([
                    ['matched',   `Matched ≥80% (${mc})`,   T.success],
                    ['partial',   `Partial 60–79% (${pc})`, T.warning],
                    ['unmatched', `No match (${uc})`,        T.error],
                  ] as const).map(([t, lbl, ac]) => (
                    <button key={t} onClick={() => { setTab(t); setOpen(null); }} style={{ padding: '10px 14px', fontSize: 12.5, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: tab === t ? ac : T.textMuted, borderBottom: tab === t ? `2px solid ${ac}` : '2px solid transparent', transition: 'color .15s' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, padding: '6px 0' }}>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '5px 10px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, color: T.textSec, background: T.card, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                    <option value="score">By score</option>
                    <option value="exp">By experience</option>
                  </select>
                  <button onClick={() => setShowF(p => !p)} className="rp-btn" style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', border: `1px solid ${showF ? T.pBorder : T.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: showF ? T.pLight : T.card, color: showF ? T.primary : T.textSec, transition: 'all .15s' }}>
                    <SlidersHorizontal size={11} /> Filters
                  </button>
                </div>
              </div>

              {showF && (
                <div style={{ display: 'flex', gap: 12, padding: '10px 18px', background: T.bg, borderBottom: `1px solid ${T.borderLt}`, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 3 }}>Min experience (yrs)</label>
                    <input type="number" min={0} value={fExp} onChange={e => setFExp(e.target.value)} placeholder="e.g. 2" style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, width: 100, outline: 'none', fontFamily: 'inherit', background: T.card, color: T.text }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: T.textSec, display: 'block', marginBottom: 3 }}>Skill</label>
                    <input type="text" value={fSkill} onChange={e => setFSkill(e.target.value)} placeholder="e.g. React, Java" style={{ padding: '5px 9px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, width: 160, outline: 'none', fontFamily: 'inherit', background: T.card, color: T.text }} />
                  </div>
                  {(fExp || fSkill) && (
                    <button onClick={() => { setFExp(''); setFSkill(''); }} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', border: `1px solid ${T.eBorder}`, borderRadius: 7, background: T.eBg, color: T.error, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <X size={10} /> Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* candidates */}
            {list.length === 0 ? (
              <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 52, textAlign: 'center' }}>
                <Users size={24} style={{ color: T.border, marginBottom: 8 }} />
                <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>No candidates in this group</p>
              </div>
            ) : (
              <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                    <thead>
                      <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                        {['#', 'Candidate', 'Contact', 'Score', 'Stage', 'Recruiter', 'Last activity', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '9px 13px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c, idx) => {
                        const [sb, sc] = getSt(c.status);
                        const hist    = c.application_history ?? [];
                        const totApp  = c.total_applications ?? hist.length ?? 0;
                        const isOpen  = open === c.id;
                        const lastD   = hist[0]?.applied_at;

                        return (
                          <React.Fragment key={c.id}>
                            <tr className="rp-row" style={{ borderBottom: `1px solid ${T.borderLt}`, cursor: 'pointer', transition: 'background .12s' }} onClick={() => setOpen(isOpen ? null : c.id)}>

                              <td style={{ padding: '10px 13px', fontSize: 12, color: idx < 3 ? T.warning : T.textMuted, fontWeight: 700 }}>#{idx + 1}</td>

                              <td style={{ padding: '10px 13px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <Avatar name={c.name} score={c.match_score} />
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.name}</div>
                                    {c.experience_years > 0 && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{c.experience_years} yrs exp</div>}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '10px 13px' }}>
                                <div style={{ fontSize: 12, color: T.textSec }}>{c.email !== '—' ? c.email : '—'}</div>
                                {c.phone && c.phone !== '—' && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{c.phone}</div>}
                              </td>

                              <td style={{ padding: '10px 13px' }}>
                                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: scoreBg(c.match_score), color: scoreCol(c.match_score), border: `1px solid ${scoreBdr(c.match_score)}` }}>
                                  {c.match_score}%
                                </span>
                              </td>

                              <td style={{ padding: '10px 13px' }}>
                                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: sb, color: sc, whiteSpace: 'nowrap' }}>{getStL(c.status)}</span>
                                {c.was_hired && <div style={{ fontSize: 10, color: T.success, fontWeight: 700, marginTop: 2 }}>✓ Hired</div>}
                                {c.was_rejected && !c.was_hired && <div style={{ fontSize: 10, color: T.error, fontWeight: 700, marginTop: 2 }}>✗ Rejected</div>}
                              </td>

                              <td style={{ padding: '10px 13px', fontSize: 12, color: T.textSec }}>{c.current_recruiter?.name ?? '—'}</td>

                              <td style={{ padding: '10px 13px', fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>
                                {lastD ? new Date(lastD).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </td>

                              <td style={{ padding: '10px 13px' }}>
                                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                  {c.resume_url && (
                                    <a href={c.resume_url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 11, color: T.textSec, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                      <ExternalLink size={9} /> CV
                                    </a>
                                  )}
                                  {tab === 'matched' && (
                                    <button onClick={() => invite(c)} disabled={inviting === c.id || invited.has(c.id)}
                                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: invited.has(c.id) ? 'default' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', background: invited.has(c.id) ? T.sBg : T.primary, color: invited.has(c.id) ? T.success : '#fff', transition: 'background .15s' }}>
                                      {inviting === c.id ? <Spin s={9} c="#fff" /> : <Send size={9} />}
                                      {invited.has(c.id) ? 'Invited ✓' : inviting === c.id ? '…' : 'Invite'}
                                    </button>
                                  )}
                                  {totApp > 0 && (
                                    <button onClick={() => setOpen(isOpen ? null : c.id)} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', border: `1px solid ${T.pBorder}`, borderRadius: 6, fontSize: 11, fontWeight: 600, color: T.primary, background: T.pLight, cursor: 'pointer', fontFamily: 'inherit' }}>
                                      {isOpen ? <ChevronUp size={9} /> : <ChevronDown size={9} />} History
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* expanded row */}
                            {isOpen && (
                              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td colSpan={8} style={{ padding: 0 }}>
                                  <div style={{ background: T.bg, padding: '14px 16px', animation: 'fadeUp .15s ease' }}>

                                    {/* skills */}
                                    {((c.matched_skills ?? []).length > 0 || (c.missing_skills ?? []).length > 0) && (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: c.reasoning ? 10 : 0 }}>
                                        {(c.matched_skills ?? []).length > 0 && (
                                          <div style={{ background: T.sBg, borderRadius: 8, padding: '9px 11px', border: `1px solid ${T.sBorder}` }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.success, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                                              <CheckCircle size={9} /> Matched ({c.matched_skills.length})
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                              {c.matched_skills.map(s => <span key={s} style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#fff', color: T.success, border: `1px solid ${T.sBorder}` }}>{s}</span>)}
                                            </div>
                                          </div>
                                        )}
                                        {(c.missing_skills ?? []).length > 0 && (
                                          <div style={{ background: T.eBg, borderRadius: 8, padding: '9px 11px', border: `1px solid ${T.eBorder}` }}>
                                            <div style={{ fontSize: 10, fontWeight: 700, color: T.error, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
                                              <XCircle size={9} /> Missing ({c.missing_skills.length})
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                              {c.missing_skills.map(s => <span key={s} style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#fff', color: T.error, border: `1px solid ${T.eBorder}` }}>{s}</span>)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* reasoning */}
                                    {c.reasoning && (
                                      <div style={{ background: T.card, borderLeft: `3px solid ${T.primary}`, borderRadius: '0 8px 8px 0', padding: '8px 12px', marginBottom: hist.length ? 10 : 0 }}>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: T.primary, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Zap size={9} /> AI reasoning
                                        </div>
                                        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{c.reasoning}</div>
                                      </div>
                                    )}

                                    {/* history */}
                                    {hist.length > 0 && (
                                      <div>
                                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textSec, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Mail size={10} /> Application history
                                        </div>
                                        <div style={{ overflowX: 'auto' }}>
                                          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 12 }}>
                                            <thead>
                                              <tr style={{ background: T.bg }}>
                                                {['Job title', 'Recruiter', 'Status', 'Score', 'Assessment', 'Applied'].map(h => (
                                                  <th key={h} style={{ padding: '7px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textMuted, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {hist.map((h, i) => {
                                                const [hb, hc] = getSt(h.status);
                                                const aiScore  = h.interview_score ?? null;
                                                const examDone = h.exam_completed === true || aiScore !== null;
                                                return (
                                                  <tr key={i} className="rp-row" style={{ borderTop: i > 0 ? `1px solid ${T.borderLt}` : 'none' }}>
                                                    <td style={{ padding: '7px 12px', fontWeight: 600, color: T.text }}>{h.job_title ?? '—'}</td>
                                                    <td style={{ padding: '7px 12px', color: T.textSec }}>{h.recruiter_name ?? '—'}</td>
                                                    <td style={{ padding: '7px 12px' }}>
                                                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: examDone ? T.sBg : hb, color: examDone ? T.success : hc }}>
                                                        {examDone ? 'Completed' : getStL(h.status)}
                                                      </span>
                                                    </td>
                                                    <td style={{ padding: '7px 12px', fontWeight: 700 }}>
                                                      {aiScore !== null
                                                        ? <span style={{ color: aiScore >= 60 ? T.success : aiScore >= 50 ? T.warning : T.error }}>{aiScore}%</span>
                                                        : <span style={{ color: T.textMuted }}>{h.match_score ? `${h.match_score}%` : '—'}</span>}
                                                    </td>
                                                    <td style={{ padding: '7px 12px' }}>
                                                      {h.assessment_sent
                                                        ? <span style={{ color: T.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><CheckCircle size={10} /> Sent</span>
                                                        : <span style={{ color: T.textMuted }}>—</span>}
                                                    </td>
                                                    <td style={{ padding: '7px 12px', color: T.textMuted, whiteSpace: 'nowrap' }}>
                                                      {h.applied_at ? new Date(h.applied_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
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
                <div style={{ padding: '8px 13px', borderTop: `1px solid ${T.borderLt}`, background: T.bg }}>
                  <span style={{ fontSize: 11.5, color: T.textMuted }}>Showing {list.length} candidate{list.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN — job list
══════════════════════════════════════════════════════ */
const ResumePool: React.FC = () => {
  const navigate = useNavigate();
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [states,    setStates]    = useState<Record<string, JobState>>({});
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const runRef    = useRef(0);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true); setUploadMsg(null);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('resumes', f));
    try {
      const res = await recruiterAPI.uploadResumePool(fd);
      setUploadMsg({ text: `${res.uploaded ?? files.length} resume(s) uploaded. Re-analyzing…`, ok: true });
      analyzeAll(jobs);
    } catch {
      setUploadMsg({ text: 'Upload failed. Try again.', ok: false });
    } finally { setUploading(false); }
  };

  const totalResumes   = useMemo(() => Object.values(states).reduce((a, s) => a + (s.result?.total ?? 0), 0), [states]);
  const totalMatched   = useMemo(() => Object.values(states).reduce((a, s) => a + (s.result?.matched_count ?? 0), 0), [states]);
  const totalPartial   = useMemo(() => Object.values(states).reduce((a, s) => a + (s.result?.partial_count ?? 0), 0), [states]);
  const totalUnmatched = useMemo(() => Object.values(states).reduce((a, s) => a + (s.result?.not_matched_count ?? 0), 0), [states]);
  const totalInDb      = useMemo(() => Object.values(states).reduce((a, s) => a + (s.result?.already_in_db_count ?? 0), 0), [states]);
  const doneCount      = Object.values(states).filter(s => s.status === 'done').length;
  const loadingCount   = Object.values(states).filter(s => s.status === 'loading').length;

  useEffect(() => {
    recruiterAPI.getAllJobs()
      .then((list: Job[]) => {
        const active = list.filter((j: Job) => !j.status || j.status === 'active');
        setJobs(active);
        const init: Record<string, JobState> = {};
        active.forEach(j => { init[j.id] = { status: 'idle' }; });
        setStates(init);
        analyzeAll(active);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeAll = async (list: Job[]) => {
    const runId = ++runRef.current;
    setStates(p => {
      const n = { ...p };
      list.forEach(j => { n[j.id] = { status: 'loading' }; });
      return n;
    });
    for (const job of list) {
      if (runRef.current !== runId) return;
      try {
        const res: MatchResult = await recruiterAPI.matchResumePool(job.id);
        if (runRef.current !== runId) return;
        setStates(p => ({ ...p, [job.id]: { status: 'done', result: res } }));
      } catch (e: any) {
        if (runRef.current !== runId) return;
        setStates(p => ({ ...p, [job.id]: { status: 'error', error: e?.response?.data?.error ?? 'Failed' } }));
      }
    }
  };

  const retryOne = async (job: Job) => {
    setStates(p => ({ ...p, [job.id]: { status: 'loading' } }));
    try {
      const res: MatchResult = await recruiterAPI.matchResumePool(job.id);
      setStates(p => ({ ...p, [job.id]: { status: 'done', result: res } }));
    } catch (e: any) {
      setStates(p => ({ ...p, [job.id]: { status: 'error', error: e?.response?.data?.error ?? 'Failed' } }));
    }
  };

  /* detail view */
  if (selectedId && states[selectedId]) {
    const job = jobs.find(j => j.id === selectedId)!;
    return <Detail job={job} state={states[selectedId]} onBack={() => setSelectedId(null)} onRetry={retryOne} />;
  }

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Inter',sans-serif", animation: 'fadeUp .2s ease' }}>
      <style>{CSS}</style>

      {/* header */}
      <div style={{ background: '#FAFAFA', borderBottom: `1px solid ${T.border}`, padding: '0 28px', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={15} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: '-0.2px' }}>Resume super pool</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{doneCount} of {jobs.length} jobs analyzed · click a row to view candidates</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!loading && jobs.length > 0 && (
              <button onClick={() => analyzeAll(jobs)} className="rp-btn" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: T.card, color: T.textSec, fontFamily: 'inherit', transition: 'all .15s' }}>
                <RefreshCw size={11} /> Re-analyze
              </button>
            )}
            <input ref={uploadRef} type="file" accept=".pdf,.doc,.docx" multiple style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
            <button onClick={() => uploadRef.current?.click()} disabled={uploading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.7 : 1, transition: 'opacity .15s' }}>
              {uploading ? <><Spin s={11} c="#fff" /> Uploading…</> : <><FileText size={11} /> Upload resumes</>}
            </button>
            <div style={{ position: 'relative' }}>
              <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
                style={{ paddingLeft: 27, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 12, outline: 'none', width: 190, color: T.text, background: T.card, fontFamily: 'inherit' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 28px' }}>

        {/* upload message */}
        {uploadMsg && (
          <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 8, background: uploadMsg.ok ? T.sBg : T.eBg, border: `1px solid ${uploadMsg.ok ? T.sBorder : T.eBorder}`, fontSize: 13, color: uploadMsg.ok ? T.success : T.error, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{uploadMsg.text}</span>
            <button onClick={() => setUploadMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 16 }}>×</button>
          </div>
        )}

        {/* global stats */}
        {doneCount > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Total resumes',  v: totalResumes,   ic: FileText,    vc: T.primary, bg: T.pLight,  bd: T.pBorder    },
              { l: 'Matched ≥80%',   v: totalMatched,   ic: CheckCircle, vc: T.success, bg: T.sBg,     bd: T.sBorder    },
              { l: 'Partial 60–79%', v: totalPartial,   ic: Star,        vc: T.warning, bg: T.wBg,     bd: T.wBorder    },
              { l: 'No match',       v: totalUnmatched, ic: XCircle,     vc: T.error,   bg: T.eBg,     bd: T.eBorder    },
              { l: 'In pipeline',    v: totalInDb,      ic: Database,    vc: T.teal,    bg: T.tealBg,  bd: T.tealBorder },
            ].map(s => {
              const Icon = s.ic;
              return (
                <div key={s.l} style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, border: `1px solid ${s.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={14} style={{ color: s.vc }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: s.vc, lineHeight: 1, letterSpacing: '-0.02em', animation: 'countUp .4s ease' }}>{s.v}</div>
                    <div style={{ fontSize: 10.5, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{s.l}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 72 }}><Spin s={26} /></div>
        ) : !loading && loadingCount > 0 && doneCount === 0 ? (
          <AIAnalysisScreen jobCount={jobs.length} />
        ) : filtered.length === 0 ? (
          <div style={{ background: T.card, borderRadius: 10, border: `2px dashed ${T.border}`, padding: '64px 24px', textAlign: 'center' }}>
            <Briefcase size={30} style={{ color: T.border, marginBottom: 10 }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textSec, margin: '0 0 5px' }}>No active jobs found</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '0 0 16px' }}>Create a job to start analyzing your resume pool.</p>
            <button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding: '8px 18px', background: T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Create job
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(job => {
              const s      = states[job.id] ?? { status: 'idle' };
              const isDone = s.status === 'done';
              const isErr  = s.status === 'error';
              const res    = s.result;

              return (
                <div key={job.id} className={isDone ? 'rp-card' : ''} onClick={() => isDone && setSelectedId(job.id)}
                  style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: isDone ? 'pointer' : 'default', opacity: isErr ? 0.7 : 1, transition: 'all .15s' }}>

                  <div style={{ width: 38, height: 38, borderRadius: 9, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Briefcase size={17} color="#fff" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                      <span className="rp-title" style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: '-0.2px', transition: 'color .15s' }}>{job.title}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: T.sBg, color: T.success, border: `1px solid ${T.sBorder}` }}>Active</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      {job.department && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: T.textMuted }}><Building2 size={10} />{job.department}</span>}
                      {job.location   && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: T.textMuted }}><MapPin size={10} />{job.location}</span>}
                      {job.experience > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: T.textMuted }}><Clock size={10} />{job.experience}+ yrs</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: T.textMuted }}><Users size={10} />{job.total_applications ?? 0} applicants</span>
                    </div>
                  </div>

                  {isDone && res && (
                    <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, border: `1px solid ${T.border}`, borderRadius: 9, overflow: 'hidden' }}>
                      {[
                        { l: 'Total',    v: res.total,                c: T.primary, bg: T.pLight },
                        { l: 'Matched',  v: res.matched_count,        c: T.success, bg: T.sBg   },
                        { l: 'Partial',  v: res.partial_count ?? 0,   c: T.warning, bg: T.wBg   },
                        { l: 'No match', v: res.not_matched_count ?? 0, c: T.error, bg: T.eBg   },
                      ].map((st, i) => (
                        <div key={st.l} style={{ textAlign: 'center', padding: '9px 15px', borderLeft: i > 0 ? `1px solid ${T.border}` : 'none', background: st.bg, minWidth: 64 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, color: st.c, lineHeight: 1, letterSpacing: '-0.02em' }}>{st.v}</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3, fontWeight: 500, whiteSpace: 'nowrap' }}>{st.l}</div>
                        </div>
                      ))}
                      <div style={{ padding: '0 10px', borderLeft: `1px solid ${T.border}`, background: T.card, display: 'flex', alignItems: 'center' }}>
                        <ChevronDown size={13} style={{ color: T.primary }} />
                      </div>
                    </div>
                  )}

                  {s.status === 'loading' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: T.textMuted, flexShrink: 0 }}>
                      <Spin s={13} /> Analyzing…
                    </div>
                  )}

                  {isErr && (
                    <button onClick={e => { e.stopPropagation(); retryOne(job); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: T.primary, background: T.pLight, border: `1px solid ${T.pBorder}`, borderRadius: 7, padding: '5px 11px', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                      <RefreshCw size={11} /> Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePool;


