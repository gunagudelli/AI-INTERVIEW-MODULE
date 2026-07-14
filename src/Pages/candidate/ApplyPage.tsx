import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import applicationAPI from '../../services/applicationAPI';
import axios from 'axios';
import BASE_URL from '../../Config';

const BASE = BASE_URL;

type Step = 'jd' | 'upload' | 'parsing' | 'form' | 'submitting' | 'done';

interface Job {
  id: string | number;
  title: string;
  description?: string;
  skills?: string[];
  required_skills?: string[];
  requirements?: string | string[];
  experience_years?: number;
  location?: string;
  type?: string;
  department?: string;
  vacancies?: number;
  hired_count?: number;
  total_applications?: number;
  salary?: string;
}

// Salaries are always in LPA (lakhs per annum) on this platform — make sure the
// label shows even if the recruiter typed just a plain range like "4-6".
const formatSalary = (salary: string) => /lpa|lakh|₹/i.test(salary) ? salary : `${salary} LPA`;

// ── Styles ────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes spin    { to { transform: rotate(360deg); } }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes shimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
`;

const font = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";

// Brand palette — kept consistent with the jobs list page
const BRAND = '#2b3550';
const BRAND_DARK = '#1E293B';
const BRAND_SOFT = '#eef0f5';
const BRAND_SOFT_BORDER = '#d8dce6';

// Layout
const page: React.CSSProperties     = { minHeight: '100vh', background: '#f5f6f8', fontFamily: font, padding: '0 0 60px' };
const topbar: React.CSSProperties   = { borderBottom: '1px solid #e2e8f0', background: 'white', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 };
const wrap: React.CSSProperties     = { maxWidth: 660, margin: '0 auto', padding: '32px 20px' };

// Card
const card = (anim = true): React.CSSProperties => ({
  background: 'white', borderRadius: 12, border: '1px solid #e3e6eb',
  boxShadow: '0 1px 4px rgba(16,24,40,.04)',
  animation: anim ? 'fadeUp 0.22s ease' : 'none',
});

// Inputs
const inputBase = (filled: boolean): React.CSSProperties => ({
  width: '100%', padding: '10px 13px', fontSize: 14, fontFamily: font,
  background: filled ? '#f7f8fb' : 'white', color: '#0f172a',
  border: `1px solid ${filled ? '#b7bfd4' : '#e2e8f0'}`,
  borderRadius: 8, outline: 'none', transition: 'border-color 0.15s',
});

// Buttons
const btnPrimary: React.CSSProperties = {
  background: BRAND, color: 'white', border: 'none',
  borderRadius: 7, fontWeight: 600, cursor: 'pointer',
  fontFamily: font, fontSize: 14, display: 'flex',
  alignItems: 'center', justifyContent: 'center', gap: 7,
};

// ── Helpers ───────────────────────────────────────────────────
const Req = () => <span style={{ color: '#dc2626', marginLeft: 1 }}>*</span>;

const ErrBox: React.FC<{ msg: string }> = ({ msg }) => (
  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#b91c1c', fontSize: 13 }}>
    {msg}
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>{children}</div>
);

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', required }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <Label>{label}{required && <Req />}</Label>
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={inputBase(!!value)}
    />
  </div>
);

const IconCheck: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#16a34a' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#dc2626' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconArrowRight: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

// ── Main ──────────────────────────────────────────────────────
const ApplyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { jobId: jobIdParam2 } = useParams<{ jobId: string }>();
  const token     = searchParams.get('token') || '';
  const jobIdParam = searchParams.get('jobId') || '';
  const referralId = searchParams.get('referralId') || '';

  const getJobId = () => {
    if (jobIdParam2) return jobIdParam2;
    if (jobIdParam)  return jobIdParam;
    try {
      const decoded = atob(token);
      const part = decoded.split(':')[0];
      return part && part !== 'apply' ? part : '';
    } catch { return ''; }
  };
  const jobId = getJobId();

  const [job, setJob]           = useState<Job | null>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [step, setStep]         = useState<Step>('jd');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile]         = useState<File | null>(null);
  const [parseMsg, setParseMsg] = useState('');
  const [form, setForm]         = useState({ name: '', email: '', phone: '', experienceYears: '' });
  const [applicationId, setApplicationId] = useState('');
  const [error, setError]       = useState('');
  const [matchResult, setMatchResult] = useState<{ score: number; matched: string[]; missing: string[]; reasoning: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!jobId) { setJobLoading(false); return; }
    applicationAPI.getPublicJobs()
      .then((jobs: any[]) => {
        const j = jobs.find((x: any) => String(x.id) === String(jobId));
        if (j) setJob(j);
      })
      .catch(() => {})
      .finally(() => setJobLoading(false));
  }, [jobId]);

  const parseResume = async (f: File) => {
    setStep('parsing');
    const msgs = ['Reading your resume…', 'Extracting your details…', 'Matching with job requirements…', 'Almost done…'];
    let i = 0;
    setParseMsg(msgs[0]);
    const timer = setInterval(() => { i = (i + 1) % msgs.length; setParseMsg(msgs[i]); }, 1300);
    try {
      const fd = new FormData();
      fd.append('resume', f);
      if (jobId) fd.append('jobId', jobId);
      else fd.append('jobDescription', 'general position');
      const res = await axios.post(`${BASE}/api/applications/match-jd`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearInterval(timer);
      const p = res.data?.candidate || res.data || {};
      setForm({ name: p.name || '', email: p.email || '', phone: p.phone || '', experienceYears: p.experience_years != null ? String(p.experience_years) : '' });
      const m = res.data?.match || res.data;
      const matchScore = m?.match_score ?? m?.matchScore;
      if (matchScore != null) {
        setMatchResult({ score: Number(matchScore), matched: m?.matchedSkills ?? m?.matched_skills ?? [], missing: m?.missingSkills ?? m?.missing_skills ?? [], reasoning: m?.reasoning ?? '' });
      }
    } catch { clearInterval(timer); }
    finally { setStep('form'); }
  };

  const handleFile = async (f: File) => {
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { setError('Only PDF, DOC, DOCX files are allowed'); return; }
    if (f.size > 5 * 1024 * 1024) { setError('File size must be under 5MB'); return; }
    setError('');
    setFile(f);
    parseResume(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    if (!form.name || !form.email || !form.phone) { setError('Name, email and phone are required'); return; }
    if (!jobId) { setError('Invalid job link'); return; }
    setStep('submitting');
    const fd = new FormData();
    fd.append('resume', file);
    fd.append('jobId', jobId);
    if (referralId) fd.append('referralId', referralId);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      const res = await applicationAPI.apply(fd);
      const appData = res.application || res;
      const applyScore = appData?.match_score ?? appData?.matchScore ?? res.match_score;
      if (applyScore != null) {
        setMatchResult({ score: Number(applyScore), matched: Array.isArray(appData?.matched_skills) ? appData.matched_skills : (appData?.matchedSkills ?? []), missing: Array.isArray(appData?.missing_skills) ? appData.missing_skills : (appData?.missingSkills ?? []), reasoning: appData?.reasoning ?? res.reasoning ?? '' });
      }
      // eligible:false means not saved — show done screen with rejection result
      setApplicationId(res.application?.id || res.id || res.applicationId || '');
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Submission failed. Please try again.');
      setStep('form');
    }
  };

  const reqList: string[] = job?.requirements
    ? (Array.isArray(job.requirements) ? job.requirements : (job.requirements as string).split('\n').filter(Boolean))
    : [];

  // ── Top bar ────────────────────────────────────────────────────────
  const TopBar = ({ back, label }: { back?: () => void; label: string }) => (
    <div style={{ ...topbar, background: BRAND_DARK, padding: '0 24px', height: 60, gap: 12, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.03em', lineHeight: 1 }}>ASKOXY.AI</div>
          <div style={{ color: '#8a93a6', fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', marginTop: 2 }}>JOBS PORTAL</div>
        </div>
      </div>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.12)', flexShrink: 0 }} />

      {back && (
        <button onClick={back} style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', cursor: 'pointer', color: '#e2e8f0', fontSize: 12.5, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontFamily: font }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#8a93a6' }}>{label}</span>
    </div>
  );

  // ── JD Step ─────────────────────────────────────────────────
  if (step === 'jd') return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', fontFamily: font }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .skill-pill { display: inline-block; padding: 5px 13px; background: #fff; color: ${BRAND}; border: 1.5px solid ${BRAND_SOFT_BORDER}; border-radius: 4px; font-size: 12.5px; font-weight: 500; }
        .apply-main-btn { transition: background .15s; }
        .apply-main-btn:hover { background: ${BRAND_DARK} !important; }
      `}</style>
      <TopBar back={() => navigate('/jobs')} label="" />

      {jobLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ width: 26, height: 26, border: '2.5px solid #e2e8f0', borderTop: `2.5px solid ${BRAND}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : !jobId ? <div style={{ padding: '32px 40px' }}><ErrBox msg="Invalid job link." /></div>
        : !job   ? <div style={{ padding: '32px 40px' }}><ErrBox msg="Job not found or closed." /></div>
      : (
        <div style={{ maxWidth: 1020, margin: '0 auto', padding: '28px 20px 60px', display: 'grid', gridTemplateColumns: '1fr 296px', gap: 16, alignItems: 'start' }}>

          {/* ── LEFT ── */}
          <div style={{ background: '#fff', border: '1px solid #e3e6eb', borderRadius: 10 }}>

            {/* Header */}
            <div style={{ padding: '28px 32px 24px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 21, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, marginBottom: 8 }}>{job.title}</h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, fontSize: 13, color: '#4b5563' }}>
                    {job.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        {job.location}
                      </span>
                    )}
                    {job.type && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
                        {job.type}
                      </span>
                    )}
                    {job.department && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/></svg>
                        {job.department}
                      </span>
                    )}
                    {job.experience_years != null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><circle cx={12} cy={12} r={10}/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>
                        {job.experience_years}+ years experience
                      </span>
                    )}
                    {job.salary && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12M6 8h12M6 13h3m3 0h6M6 13c6.667 0 6.667-10 0-10M6 13l8.5 8"/></svg>
                        {formatSalary(job.salary)}
                      </span>
                    )}
                    {job.vacancies != null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        {Math.max(job.vacancies - (job.hired_count || 0), 0)} open position{Math.max(job.vacancies - (job.hired_count || 0), 0) !== 1 ? 's' : ''}
                      </span>
                    )}
                    {job.total_applications != null && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <svg width={13} height={13} fill="none" stroke="#6b7280" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        {job.total_applications} application{job.total_applications !== 1 ? 's' : ''} received
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eafaf0', color: '#0f7b3f', border: '1px solid #bce7cf', borderRadius: 4, padding: '3px 10px', fontSize: 11.5, fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                  Actively Hiring
                </span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Posted recently</span>
              </div>
            </div>

            {/* About the role */}
            {job.description && (
              <div style={{ padding: '26px 32px', borderTop: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', marginBottom: 14 }}>About the Role</h2>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, whiteSpace: 'pre-line' }}>{job.description}</p>
              </div>
            )}

            {/* Requirements */}
            {reqList.length > 0 && (
              <div style={{ padding: '26px 32px', borderTop: '1px solid #f1f5f9' }}>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Requirements</h2>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reqList.map((r, i) => <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* ── RIGHT sidebar ── */}
          <div style={{ background: '#fff', border: '1px solid #e3e6eb', borderRadius: 10, position: 'sticky', top: 76 }}>

            {/* Apply */}
            <div style={{ padding: '22px' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Apply for this role</p>
              <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16, lineHeight: 1.6 }}>Upload your resume and our AI will instantly evaluate your fit.</p>
              <button className="apply-main-btn" onClick={() => setStep('upload')}
                style={{ width: '100%', padding: '11px', background: BRAND, color: '#fff', border: 'none', borderRadius: 7, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: font }}>
                Apply Now
              </button>
            </div>

            {/* Skills */}
            {(job.skills?.length ?? job.required_skills?.length ?? 0) > 0 && (
              <div style={{ padding: '20px 22px', borderTop: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Skills Required</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {(job.skills ?? job.required_skills ?? []).map((sk: any) => (
                    <span key={sk} className="skill-pill">{sk}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Job overview */}
            <div style={{ padding: '20px 22px', borderTop: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Job Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>, label: 'Job Type', val: job.type },
                  { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>, label: 'Location', val: job.location },
                  { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><circle cx={12} cy={12} r={10}/><path strokeLinecap="round" d="M12 6v6l4 2"/></svg>, label: 'Experience', val: job.experience_years != null ? `${job.experience_years}+ years` : null },
                  { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12M6 8h12M6 13h3m3 0h6M6 13c6.667 0 6.667-10 0-10M6 13l8.5 8"/></svg>, label: 'Package', val: job.salary ? formatSalary(job.salary) : null },
                  // { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>, label: 'Open Positions', val: job.vacancies != null ? String(Math.max(job.vacancies - (job.hired_count || 0), 0)) : null },
                  // { icon: <svg width={14} height={14} fill="none" stroke={BRAND} viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>, label: 'Applications Received', val: job.total_applications != null ? String(job.total_applications) : null },
                ].filter(r => r.val).map(r => (
                  <div key={r.label} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <span style={{ marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
                    <div>
                      <p style={{ fontSize: 10.5, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{r.label}</p>
                      <p style={{ fontSize: 13.5, color: '#1e293b', fontWeight: 500, textTransform: 'capitalize' }}>{r.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  // ── Parsing ──────────────────────────────────────────────────
  if (step === 'parsing') return (
    <div style={page}>
      <style>{css}</style>
      <TopBar label="Analyzing resume" />
      <div style={wrap}>
        <div style={{ ...card(), padding: '52px 32px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 24px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, background: BRAND_SOFT, border: `1px solid ${BRAND_SOFT_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '2.5px solid transparent', borderTop: `2.5px solid ${BRAND}`, animation: 'spin 0.9s linear infinite' }} />
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Reading your resume</h2>
          <p style={{ fontSize: 13, color: BRAND, fontWeight: 500, minHeight: 20, marginBottom: 28 }}>{parseMsg}</p>

          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '14px 18px', textAlign: 'left', maxWidth: 300, margin: '0 auto' }}>
            {['Extracting name & contact', 'Reading work experience', 'Identifying skills', 'Matching with job'].map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1.5px solid ${BRAND_SOFT_BORDER}`, background: BRAND_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: BRAND, animation: `pulse ${1 + i * 0.3}s infinite` }} />
                </div>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: BRAND_SOFT, animation: `shimmer ${1.5 + i * 0.2}s ease-in-out infinite` }} />
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 20 }}>{file?.name}</p>
        </div>
      </div>
    </div>
  );

  // ── Upload Step ──────────────────────────────────────────────
  if (step === 'upload') return (
    <div style={page}>
      <style>{css}</style>
      <TopBar back={() => setStep('jd')} label="Upload resume" />
      <div style={wrap}>
        <div style={card()}>
          {job && (
            <div style={{ padding: '14px 24px', background: BRAND_SOFT, borderBottom: `1px solid ${BRAND_SOFT_BORDER}`, display: 'flex', gap: 12, alignItems: 'center', borderRadius: '12px 12px 0 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: BRAND_DARK }}>{job.title}</div>
                {job.experience_years != null && (
                  <div style={{ fontSize: 12, color: BRAND, marginTop: 2 }}>{job.experience_years}+ years experience required</div>
                )}
              </div>
            </div>
          )}

          <div style={{ padding: '24px 28px' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Upload your resume</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>AI will extract your details and check fit automatically</p>

            {error && <ErrBox msg={error} />}

            <div
              style={{
                border: `2px dashed ${dragOver ? BRAND : '#e2e8f0'}`,
                borderRadius: 12, cursor: 'pointer', background: dragOver ? '#f1f3f8' : '#f8fafc',
                transition: 'all 0.15s', textAlign: 'center', padding: '44px 24px',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              <div style={{ width: 48, height: 48, borderRadius: 12, background: dragOver ? BRAND_SOFT : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.15s' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragOver ? BRAND : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <div style={{ fontWeight: 600, color: dragOver ? BRAND : '#374151', fontSize: 14, marginBottom: 4 }}>
                {dragOver ? 'Drop it here' : 'Drag & drop your resume'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>or click to browse</div>
              <div style={{ display: 'inline-block', padding: '8px 20px', background: BRAND, color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                Choose file
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 10 }}>PDF, DOC, DOCX — max 5MB · Must be a resume/CV</div>
            </div>

            <div style={{ marginTop: 14, padding: '11px 14px', background: BRAND_SOFT, border: `1px solid ${BRAND_SOFT_BORDER}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 12, color: BRAND, lineHeight: 1.5 }}>
                Only resumes/CVs are accepted. Invoices, certificates, ID cards or other documents will be rejected.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Done ─────────────────────────────────────────────────────
  if (step === 'done') {
    const score = matchResult ? Number(matchResult.score) : null;
    const hasScore = score != null;
    const eligible = hasScore ? score >= 70 : null;
    const sc = eligible === false ? '#dc2626' : eligible ? '#16a34a' : BRAND;
    const R = 42, CIRC = 2 * Math.PI * R;
    const filled = ((score ?? 0) / 100) * CIRC;

    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f1f2f5', fontFamily: font, overflow: 'hidden' }}>
        <style>{css + `
          @keyframes ringDraw { from{stroke-dashoffset:${CIRC}px} to{stroke-dashoffset:${CIRC - filled}px} }
          @keyframes fadeUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
          .dc { animation: fadeUp .25s ease both; }
        `}</style>
        <TopBar label={eligible === false ? 'Result' : 'Submitted'} />

        {/* Full height body — no scroll */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 20px' }}>
          <div style={{ width: '100%', maxWidth: 620, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(15,23,42,.08)' }} className="dc">

            {/* Top accent */}
            <div style={{ height: 4, background: eligible === false ? '#dc2626' : '#16a34a' }} />

            <div style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: hasScore ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'start' }}>

              {/* LEFT — ring + title + pill */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                {hasScore ? (
                  <div style={{ position: 'relative', width: 100, height: 100 }}>
                    <svg width={100} height={100} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx={50} cy={50} r={R} fill="none" stroke="#f1f5f9" strokeWidth={8} />
                      <circle cx={50} cy={50} r={R} fill="none" stroke={sc} strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={`${CIRC} ${CIRC}`}
                        strokeDashoffset={CIRC - filled}
                        style={{ animation: 'ringDraw 1.1s ease forwards' }}
                      />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: sc, lineHeight: 1 }}>{score}%</span>
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 3 }}>Match</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: sc + '18', border: `2px solid ${sc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {eligible === false ? <IconX size={26} color={sc} /> : <IconCheck size={26} color={sc} />}
                  </div>
                )}

                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    {eligible === false ? 'Not a Match' : eligible ? 'Great Match!' : 'Received'}
                  </h2>
                  <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
                    {eligible === false
                      ? `Score ${score}% — need 70% to qualify.`
                      : hasScore ? `${score}% match — recruiter will contact you.`
                      : 'Under review — we will get back to you.'}
                  </p>
                </div>

                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 30, fontSize: 12, fontWeight: 600, background: sc + '12', color: sc, border: `1.5px solid ${sc}30` }}>
                  {eligible === false ? <><IconX size={12} color={sc} /> Not eligible</> : <><IconCheck size={12} color={sc} /> Eligible</>}
                </div>

                <button onClick={() => navigate('/jobs')}
                  style={{ ...btnPrimary, padding: '9px 20px', borderRadius: 8, background: BRAND, fontSize: 13, width: '100%' }}>
                  Browse Jobs <IconArrowRight />
                </button>
              </div>

              {/* RIGHT — breakdown */}
              {hasScore && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Progress */}
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>AI Match Score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: sc }}>{score}%</span>
                    </div>
                    <div style={{ height: 7, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden', marginBottom: 5 }}>
                      <div style={{ height: '100%', width: `${score}%`, background: eligible === false ? '#dc2626' : '#16a34a', borderRadius: 6, transition: 'width 1.1s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 10, color: '#cbd5e1' }}>0%</span>
                      <span style={{ fontSize: 10, color: eligible === false ? '#dc2626' : '#16a34a', fontWeight: 700 }}>Min 70%</span>
                      <span style={{ fontSize: 10, color: '#cbd5e1' }}>100%</span>
                    </div>
                  </div>

                  {/* Matched */}
                  {(matchResult?.matched?.length ?? 0) > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#15803d', margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                        Matched ({matchResult!.matched.length})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {matchResult!.matched.map(sk => (
                          <span key={sk} style={{ padding: '3px 10px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing */}
                  {(matchResult?.missing?.length ?? 0) > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', margin: '0 0 7px', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                        Missing ({matchResult!.missing.length})
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {matchResult!.missing.map(sk => (
                          <span key={sk} style={{ padding: '3px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 20, fontSize: 11.5, fontWeight: 500 }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form Step ────────────────────────────────────────────────
  return (
    <div style={page}>
      <style>{css}</style>
      <TopBar back={() => { setStep('upload'); setFile(null); setError(''); }} label={job ? `Apply — ${job.title}` : 'Your details'} />
      <div style={wrap}>
        <div style={card()}>
          {/* File chip */}
          <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: BRAND_SOFT, border: `1px solid ${BRAND_SOFT_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
              <div style={{ fontSize: 11, color: BRAND, marginTop: 1 }}>AI extracted your details — review before submitting</div>
            </div>
            <IconCheck size={16} color="#16a34a" />
          </div>

          <div style={{ padding: '24px 28px' }}>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>Review your details</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Confirm and complete your information before submitting</p>

            {error && <ErrBox msg={error} />}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Field label="Full name" required value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="Your full name" />
                <Field label="Email" required type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="you@email.com" />
                <Field label="Phone" required value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="+91 98765 43210" />
                <Field label="Experience (years)" type="number" value={form.experienceYears} onChange={v => setForm(f => ({ ...f, experienceYears: v }))} placeholder="e.g. 3" />
              </div>

              <button
                type="submit"
                disabled={step === 'submitting'}
                style={{ ...btnPrimary, width: '100%', padding: '12px', marginTop: 6, opacity: step === 'submitting' ? 0.7 : 1, cursor: step === 'submitting' ? 'not-allowed' : 'pointer' }}
              >
                {step === 'submitting' ? (
                  <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Submitting…</>
                ) : 'Submit application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyPage;