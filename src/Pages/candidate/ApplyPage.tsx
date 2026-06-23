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
}

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

// Layout
const page: React.CSSProperties     = { minHeight: '100vh', background: '#f8fafc', fontFamily: font, padding: '0 0 60px' };
const topbar: React.CSSProperties   = { borderBottom: '1px solid #e2e8f0', background: 'white', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 };
const wrap: React.CSSProperties     = { maxWidth: 660, margin: '0 auto', padding: '32px 20px' };

// Card
const card = (anim = true): React.CSSProperties => ({
  background: 'white', borderRadius: 16, border: '1px solid #e2e8f0',
  boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
  animation: anim ? 'fadeUp 0.22s ease' : 'none',
});

// Inputs
const inputBase = (filled: boolean): React.CSSProperties => ({
  width: '100%', padding: '10px 13px', fontSize: 14, fontFamily: font,
  background: filled ? '#faf5ff' : 'white', color: '#0f172a',
  border: `1px solid ${filled ? '#c4b5fd' : '#e2e8f0'}`,
  borderRadius: 8, outline: 'none', transition: 'border-color 0.15s',
});

// Buttons
const btnPrimary: React.CSSProperties = {
  background: '#6d28d9', color: 'white', border: 'none',
  borderRadius: 8, fontWeight: 600, cursor: 'pointer',
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

const MetaChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 6, padding: '4px 10px', fontSize: 12, color: '#475569',
  }}>
    {children}
  </span>
);

const SkillTag: React.FC<{ children: React.ReactNode; variant?: 'blue' | 'green' | 'red' }> = ({ children, variant = 'blue' }) => {
  const colors = {
    blue:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
    green: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
    red:   { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
  }[variant];
  return (
    <span style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
      {children}
    </span>
  );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10 }}>{children}</div>
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

  const handleFile = (f: File) => {
    if (!/\.(pdf|doc|docx)$/i.test(f.name)) { setError('Only PDF, DOC, DOCX files are allowed'); return; }
    setError(''); setFile(f); parseResume(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
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
      setApplicationId(res.application?.id || res.id || res.applicationId || '');
      const appData = res.application || res;
      const applyScore = appData?.match_score ?? appData?.matchScore;
      if (applyScore != null) {
        setMatchResult({ score: Number(applyScore), matched: Array.isArray(appData?.matched_skills) ? appData.matched_skills : (appData?.matchedSkills ?? []), missing: Array.isArray(appData?.missing_skills) ? appData.missing_skills : (appData?.missingSkills ?? []), reasoning: appData?.reasoning ?? '' });
      }
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Submission failed. Please try again.');
      setStep('form');
    }
  };

  const reqList: string[] = job?.requirements
    ? (Array.isArray(job.requirements) ? job.requirements : (job.requirements as string).split('\n').filter(Boolean))
    : [];

  // ── Top bar ─────────────────────────────────────────────────
  const TopBar = ({ back, label }: { back?: () => void; label: string }) => (
    <div style={topbar}>
      {back && (
        <button onClick={back} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: font }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      )}
      {back && <span style={{ color: '#e2e8f0' }}>|</span>}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{label}</span>
    </div>
  );

  // ── JD Step ─────────────────────────────────────────────────
  if (step === 'jd') return (
    <div style={page}>
      <style>{css}</style>
      <TopBar back={() => navigate('/jobs')} label="Job details" />
      <div style={wrap}>
        {jobLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTop: '2.5px solid #6d28d9', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ marginTop: 14, color: '#94a3b8', fontSize: 13 }}>Loading…</p>
          </div>
        ) : !jobId ? (
          <ErrBox msg="Invalid job link. Please use the link provided by the recruiter." />
        ) : !job ? (
          <ErrBox msg="Job not found or may have been closed." />
        ) : (
          <div style={card()}>
            {/* JD Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 20, padding: '3px 10px', marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', letterSpacing: '0.3px' }}>Actively hiring</span>
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 14, lineHeight: 1.25 }}>{job.title}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {job.type             && <MetaChip>💼 {job.type}</MetaChip>}
                {job.location         && <MetaChip>📍 {job.location}</MetaChip>}
                {job.department       && <MetaChip>🏢 {job.department}</MetaChip>}
                {job.experience_years != null && <MetaChip>⏱ {job.experience_years}+ yrs exp</MetaChip>}
              </div>
            </div>

            {/* JD Body */}
            <div style={{ padding: '24px 28px' }}>
              {job.description && (
                <div style={{ marginBottom: 24 }}>
                  <SectionLabel>About the role</SectionLabel>
                  <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{job.description}</p>
                </div>
              )}

              {(job.skills?.length ?? job.required_skills?.length) ? (
                <div style={{ marginBottom: 24 }}>
                  <SectionLabel>Skills required</SectionLabel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {(job.skills ?? job.required_skills ?? []).map((sk:any) => <SkillTag key={sk}>{sk}</SkillTag>)}
                  </div>
                </div>
              ) : null}

              {reqList.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <SectionLabel>Requirements</SectionLabel>
                  <ul style={{ paddingLeft: 16, margin: 0, listStyleType: 'disc' }}>
                    {reqList.map((r, i) => (
                      <li key={i} style={{ fontSize: 14, color: '#334155', lineHeight: 1.9, paddingLeft: 4 }}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>Interested in this role?</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Upload your resume — AI checks your fit instantly</div>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  style={{ ...btnPrimary, padding: '11px 22px', whiteSpace: 'nowrap', borderRadius: 8 }}
                >
                  Apply now →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
            <div style={{ width: 64, height: 64, borderRadius: 14, background: '#f5f3ff', border: '1px solid #ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', border: '2.5px solid transparent', borderTop: '2.5px solid #7c3aed', animation: 'spin 0.9s linear infinite' }} />
          </div>

          <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Reading your resume</h2>
          <p style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, minHeight: 20, marginBottom: 28 }}>{parseMsg}</p>

          <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 10, padding: '14px 18px', textAlign: 'left', maxWidth: 300, margin: '0 auto' }}>
            {['Extracting name & contact', 'Reading work experience', 'Identifying skills', 'Matching with job'].map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 3 ? 10 : 0 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid #c4b5fd', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#7c3aed', animation: `pulse ${1 + i * 0.3}s infinite` }} />
                </div>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#ede9fe', animation: `shimmer ${1.5 + i * 0.2}s ease-in-out infinite` }} />
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
            <div style={{ padding: '14px 24px', background: '#f5f3ff', borderBottom: '1px solid #e9d5ff', display: 'flex', gap: 12, alignItems: 'center', borderRadius: '16px 16px 0 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95' }}>{job.title}</div>
                {job.experience_years != null && (
                  <div style={{ fontSize: 12, color: '#7c3aed', marginTop: 2 }}>{job.experience_years}+ years experience required</div>
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
                border: `2px dashed ${dragOver ? '#7c3aed' : '#e2e8f0'}`,
                borderRadius: 12, cursor: 'pointer', background: dragOver ? '#faf5ff' : '#f8fafc',
                transition: 'all 0.15s', textAlign: 'center', padding: '44px 24px',
              }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

              <div style={{ width: 48, height: 48, borderRadius: 12, background: dragOver ? '#ede9fe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', transition: 'all 0.15s' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={dragOver ? '#7c3aed' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <div style={{ fontWeight: 600, color: dragOver ? '#7c3aed' : '#374151', fontSize: 14, marginBottom: 4 }}>
                {dragOver ? 'Drop it here' : 'Drag & drop your resume'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>or click to browse</div>
              <div style={{ display: 'inline-block', padding: '8px 20px', background: '#6d28d9', color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                Choose file
              </div>
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 10 }}>PDF, DOC, DOCX — max 5MB</div>
            </div>

            <div style={{ marginTop: 14, padding: '11px 14px', background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <svg style={{ flexShrink: 0, marginTop: 1 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p style={{ fontSize: 12, color: '#6d28d9', lineHeight: 1.5 }}>
                AI extracts your details automatically and scores your resume against the job requirements.
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
    const eligible = hasScore ? score >= 50 : null;

    return (
      <div style={page}>
        <style>{css}</style>
        <TopBar label="Application submitted" />
        <div style={wrap}>
          <div style={{ ...card(), padding: '40px 32px', textAlign: 'center' }}>
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: eligible === false ? '#dc2626' : '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: eligible === false ? '0 6px 20px rgba(220,38,38,0.25)' : '0 6px 20px rgba(22,163,74,0.25)',
            }}>
              {eligible === false ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              {eligible === false ? 'Not eligible for this role' : 'Application submitted'}
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 20px' }}>
              {eligible === false
                ? `AI analyzed your resume — your match score is ${score}%. Your skills did not meet the requirements for this position.`
                : hasScore
                  ? `Your resume matched ${score}% with this job. The recruiter will review and contact you shortly.`
                  : 'Your application has been received. The recruiter will review and contact you soon.'
              }
            </p>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: eligible === false ? '#fef2f2' : '#f0fdf4',
              border: `1px solid ${eligible === false ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: 20, padding: '7px 16px', marginBottom: 24,
            }}>
              {eligible === false
                ? <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>❌ Resume did not match this job requirements</span>
                : <><div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s infinite' }} /><span style={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>✅ Eligible — recruiter will reach out soon</span></>
              }
            </div>

            {/* Score card */}
            {hasScore && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI match score</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: eligible ? '#16a34a' : '#dc2626' }}>{score}%</span>
                </div>
                <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
                  <div style={{ height: '100%', width: `${score}%`, background: eligible ? '#16a34a' : '#dc2626', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>

                {matchResult!.matched.length > 0 && (
                  <div style={{ marginBottom: matchResult!.missing.length > 0 ? 12 : 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', marginBottom: 7 }}>Matched skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {matchResult!.matched.slice(0, 6).map(sk => <SkillTag key={sk} variant="green">{sk}</SkillTag>)}
                    </div>
                  </div>
                )}

                {!eligible && matchResult!.missing.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', marginBottom: 7 }}>Missing skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {matchResult!.missing.slice(0, 5).map(sk => <SkillTag key={sk} variant="red">{sk}</SkillTag>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={{ ...btnPrimary, padding: '10px 22px' }} onClick={() => navigate('/jobs')}>
                Browse more jobs
              </button>
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
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', border: '1px solid #e9d5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</div>
              <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 1 }}>AI extracted your details — review before submitting</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
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