import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { recruiterAPI, jdApprovalAPI } from '../../services/recruiterAPI';
import BASE_URL from '../../Config';
import { ChevronLeft, X, Wand2, Mic, MicOff, Sparkles, Copy, ExternalLink, CheckCircle } from 'lucide-react';

const TYPES = [
  { value: 'full-time',  label: 'Full Time' },
  { value: 'part-time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Other'];
const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];
const BASE = BASE_URL;

const SKILL_SUGGESTIONS = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Angular', 'Vue.js',
  'Spring Boot', 'Django', 'Express.js', 'Next.js', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST APIs', 'GraphQL',
  'HTML', 'CSS', 'Tailwind CSS', 'Redux', 'Figma', 'Agile', 'Scrum', 'Linux',
  'C++', 'C#', '.NET', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'Go', 'Rust',
  'Machine Learning', 'Data Analysis', 'Power BI', 'Tableau', 'Excel', 'Salesforce',
];

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.96)',
        border: `1px solid ${t.type === 'success' ? '#bbf7d0' : t.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
        borderRadius: 14, padding: '12px 14px',
        width: 'min(100%, 420px)', pointerEvents: 'all',
        boxShadow: '0 18px 40px rgba(15,23,42,0.14)',
      }}>
        <span style={{ fontSize: 13, flex: 1, color: '#0f172a', lineHeight: 1.5 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      </div>
    ))}
  </div>
);

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const add = useCallback((msg: string, type: ToastType = 'info', duration = 4000) => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);
  const remove = useCallback((id: number) => setToasts(t => t.filter(x => x.id !== id)), []);
  return { toasts, toast: add, remove };
}

const ApplyLinkModal: React.FC<{ link: string; onClose: () => void }> = ({ link, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  // Rendered via a portal directly on document.body — same fix as JobsList.tsx's Links
  // modal, so `position: fixed` centers relative to the real viewport, not whichever
  // ancestor (e.g. RecruiterLayout's animated .rl-main wrapper) would otherwise become
  // its containing block and push it toward the top of the screen.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440, padding: 28, border: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <CheckCircle style={{ color: '#16a34a', width: 22, height: 22 }} />
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 3px' }}>Job Published Successfully</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Share this link with candidates to apply</p>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 13px', marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Apply Link</div>
          <div style={{ fontSize: 12, color: '#0f172a', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>{link}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={copy} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: copied ? '#16a34a' : '#8B0000', color: 'white', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}>
            <Copy style={{ width: 13, height: 13 }} />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button onClick={() => window.open(link, '_blank')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
            <ExternalLink style={{ width: 13, height: 13 }} />
            Open
          </button>
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer', padding: '7px 0' }}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};

const AIModal: React.FC<{
  onClose: () => void;
  onFill: (data: any) => void;
  toast: (m: string, t?: ToastType) => void;
}> = ({ onClose, onFill, toast }) => {
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast('Voice input requires Chrome', 'error'); return; }
    if (isListening) { recRef.current?.stop(); return; }
    const r = new SR();
    r.lang = 'en-IN'; r.interimResults = false; r.continuous = false;
    r.onstart = () => setIsListening(true);
    r.onresult = (e: any) => setSentence(e.results[0][0].transcript);
    r.onend = () => setIsListening(false);
    r.onerror = () => { setIsListening(false); toast('Voice recognition failed', 'error'); };
    recRef.current = r;
    r.start();
  };

  const generate = async () => {
    const s = sentence.trim();
    if (!s) { toast('Describe the role first', 'error'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/jobs/analyze-sentence`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: s }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.jobTitle) {
        onFill(data); toast('JD generated', 'success'); onClose();
      } else {
        const res2 = await fetch(`${BASE}/api/jobs/generate-content`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobTitle: s }),
        });
        const data2 = await res2.json();
        const opt = data2.content?.option1 || data2.content?.option2;
        if (data2.success && opt) {
          onFill({ jobTitle: s, description: opt.description, skills: opt.skills, requirements: opt.requirements });
          toast('JD generated', 'success'); onClose();
        } else throw new Error(data2.error || 'Generation failed');
      }
    } catch (err: any) {
      toast(err.message || 'AI generation failed', 'error');
    } finally { setLoading(false); }
  };

  // Same portal fix as ApplyLinkModal above — keeps `position: fixed` centered on the
  // real viewport instead of an ancestor that breaks its containing block.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 50, padding: '16px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 460, border: '1px solid #e2e8f0', boxShadow: '0 8px 32px rgba(15,23,42,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, background: '#8B0000', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wand2 style={{ width: 14, height: 14, color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>AI JD GENERATOR</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Describe the role, AI fills the rest</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
        <div style={{ padding: '16px 18px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Describe The Role</div>
          <div style={{ border: `1.5px solid ${isListening ? '#8B0000' : '#e2e8f0'}`, borderRadius: 8, background: isListening ? '#FDF2F2' : '#ffffff', transition: 'border-color 0.15s', overflow: 'hidden' }}>
            <textarea
              value={sentence} onChange={e => setSentence(e.target.value)}
              placeholder="e.g. React Native developer with 2+ years in mobile apps and REST APIs"
              style={{ width: '100%', border: 'none', background: 'transparent', padding: '10px 12px 8px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', color: '#0f172a', minHeight: 80, lineHeight: 1.6, boxSizing: 'border-box' }}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate(); }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 8px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>{isListening ? '🔴 Listening…' : 'Ctrl + Enter to generate'}</span>
              <button onClick={toggleVoice} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: isListening ? '#fef2f2' : '#ffffff', border: `1px solid ${isListening ? '#fecaca' : '#e2e8f0'}`, color: isListening ? '#dc2626' : '#475569', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {isListening ? <MicOff style={{ width: 12, height: 12 }} /> : <Mic style={{ width: 12, height: 12 }} />}
                {isListening ? 'Stop' : 'Voice'}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Suggestions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['React Native dev, 2+ yrs', 'Node.js backend, 3 yrs', 'UI/UX designer, Figma'].map(ex => (
              <button key={ex} onClick={() => setSentence(ex)} style={{ padding: '3px 9px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, fontSize: 11, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit' }}>
                {ex}
              </button>
            ))}
              </div>
            </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={generate} disabled={loading || !sentence.trim()} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: loading || !sentence.trim() ? '#94a3b8' : '#8B0000', color: 'white', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: loading || !sentence.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              {loading ? (
                <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Generating…</>
              ) : (
                <><Sparkles style={{ width: 13, height: 13 }} /> Generate JD</>
              )}
            </button>
            <button onClick={onClose} style={{ padding: '10px 16px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb',
  borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#ffffff',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
};

const LOCATIONS = [
  'Remote', 'Hybrid',
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata',
  'Noida', 'Gurgaon', 'Ahmedabad', 'Jaipur', 'Kochi', 'Chandigarh',
  'Coimbatore', 'Visakhapatnam', 'Indore', 'Nagpur', 'Bhopal',
  'USA', 'UK', 'Canada', 'Australia', 'Singapore', 'Dubai', 'Germany',
];

const LocationDropdown: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const filtered = LOCATIONS.filter(l => l.toLowerCase().includes(search.toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => { setOpen(o => !o); setSearch(''); }}
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', borderColor: open ? '#8B0000' : '#e5e7eb' }}>
        <span style={{ color: value ? '#0f172a' : '#9ca3af' }}>{value || 'Select or type location'}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}><polyline points="6 9 12 15 18 9" /></svg>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 7, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', marginTop: 2 }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search location…"
              style={{ ...inputStyle, padding: '7px 10px', fontSize: 12 }}
              onClick={e => e.stopPropagation()} />
          </div>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {filtered.length === 0
              ? <div style={{ padding: '8px 12px', fontSize: 12, color: '#64748b', cursor: 'pointer' }} onClick={() => { onChange(search); setOpen(false); }}>Use "{search}"</div>
              : filtered.map(loc => (
                <div key={loc} onClick={() => { onChange(loc); setOpen(false); }}
                  style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', background: value === loc ? '#fef2f2' : 'white', color: value === loc ? '#8B0000' : '#0f172a', fontWeight: value === loc ? 600 : 400 }}
                  onMouseEnter={e => { if (value !== loc) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (value !== loc) (e.currentTarget as HTMLDivElement).style.background = 'white'; }}>
                  {loc}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
      <h3 style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</h3>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
    {children}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
  </label>
);

const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, toast, remove } = useToast();

  const [loading, setLoading]   = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [aiModal, setAiModal]   = useState(searchParams.get('ai') === 'true');
  const [applyLink, setApplyLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', location: '', type: '', workMode: '',
    experience: '', salary: '', skills: [] as string[], requirements: '', department: '',
    vacancies: '1',
  });

  // ── JD approval gate — every JD must be tied to an approved, unused request.
  // Every field captured at approval time is locked here (read-only) — the
  // recruiter cannot create something different from what Admin approved; a
  // changed detail requires a new approval request instead.
  const requestId = searchParams.get('requestId');
  interface ApprovedJdRequest {
    id: number; job_title: string; department: string | null; vacancies: number;
    experience_min: number | null; skills: string[]; employment_type: string | null;
    work_mode: string | null; location: string | null; salary: string | null;
    hiring_reason: string | null; hiring_manager: string | null; expected_joining_date: string | null;
  }
  const [jdRequest, setJdRequest] = useState<ApprovedJdRequest | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(!!requestId);
  const [requestInvalid, setRequestInvalid] = useState(false);

  useEffect(() => {
    if (!requestId) { setRequestInvalid(true); return; }
    (async () => {
      try {
        const mine = await jdApprovalAPI.listMine();
        const match = mine.find((r: any) => String(r.id) === String(requestId));
        if (match && match.status === 'approved' && !match.job_id) {
          setJdRequest(match);
          setForm(f => ({
            ...f,
            title:      match.job_title,
            department: match.department || f.department,
            vacancies:  String(match.vacancies ?? f.vacancies),
            experience: match.experience_min != null ? String(match.experience_min) : f.experience,
            skills:     match.skills?.length ? match.skills : f.skills,
            type:       match.employment_type || f.type,
            workMode:   match.work_mode || f.workMode,
            location:   match.location || f.location,
            salary:     match.salary || f.salary,
          }));
        } else {
          setRequestInvalid(true);
        }
      } catch {
        setRequestInvalid(true);
      } finally {
        setCheckingRequest(false);
      }
    })();
  }, [requestId]);

  const lockedInputStyle = (locked: boolean): React.CSSProperties =>
    locked ? { ...inputStyle, background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : inputStyle;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const addSkill = (raw: string) => {
    const tags = raw.split(',').map(s => s.trim()).filter(s => s && !form.skills.includes(s));
    if (tags.length) { setForm(f => ({ ...f, skills: [...f.skills, ...tags] })); setSkillInput(''); }
  };
  const removeSkill = (sk: string) => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }));
  const handleSkillKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
  };

  const handleAIFill = (data: any) => {
    setForm(f => {
      // Locked to an approved request — AI Generate must only fill Description
      // and Requirements (prose, not part of the approval). Everything else
      // (title, department, experience, location, type, skills) was approved
      // and stays exactly as-is, or the AI modal would be a back door around
      // the lock the recruiter isn't allowed to bypass.
      if (jdRequest) {
        return {
          ...f,
          description:  data.description || f.description,
          requirements: data.requirements?.length
            ? (Array.isArray(data.requirements) ? data.requirements.join('\n') : data.requirements)
            : f.requirements,
        };
      }
      return {
        ...f,
        title:        data.jobTitle    || f.title,
        description:  data.description || f.description,
        experience:   data.experience != null ? String(Math.floor(Number(data.experience))) : f.experience,
        department:   data.department  || f.department,
        location:     data.location    || f.location,
        type:         data.type        || f.type,
        skills: data.skills?.length ? Array.from(new Set([...f.skills, ...data.skills])) as string[] : f.skills,
        requirements: data.requirements?.length
          ? (Array.isArray(data.requirements) ? data.requirements.join('\n') : data.requirements)
          : f.requirements,
      };
    });
  };

  const [generatingDescription, setGeneratingDescription] = useState(false);

  // One-click description generator using the job title (and locked details, when
  // present) as context — no separate modal/sentence needed, unlike "AI JD Generate".
  const generateDescription = async () => {
    if (!form.title.trim()) { toast('Job title is required first', 'error'); return; }
    setGeneratingDescription(true);
    try {
      const res = await fetch(`${BASE}/api/jobs/generate-content`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: form.title.trim(),
          skills: form.skills,
          experienceMin: form.experience ? Math.floor(parseFloat(form.experience)) : undefined,
          employmentType: form.type || undefined,
          workMode: form.workMode || undefined,
          location: form.location || undefined,
        }),
      });
      const data = await res.json();
      const opt = data?.content?.option1 || data?.content?.option2;
      if (res.ok && data.success && opt?.description) {
        setForm(f => ({
          ...f,
          description: opt.description,
          requirements: !f.requirements && opt.requirements?.length
            ? (Array.isArray(opt.requirements) ? opt.requirements.join('\n') : opt.requirements)
            : f.requirements,
        }));
        toast('Description generated', 'success');
      } else {
        toast('Could not generate a description. Please try again.', 'error');
      }
    } catch {
      toast('Could not generate a description — check your connection and try again.', 'error');
    } finally { setGeneratingDescription(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())       { toast('Job title is required', 'error'); return; }
    if (!form.description.trim()) { toast('Description is required', 'error'); return; }
    if (!form.location.trim())    { toast('Location is required', 'error'); return; }
    if (!form.type)               { toast('Employment type is required', 'error'); return; }
    if (!form.experience)         { toast('Min experience is required', 'error'); return; }
    if (!form.salary.trim())      { toast('Salary range is required', 'error'); return; }
    const vacancyCount = parseInt(form.vacancies, 10);
    if (!Number.isInteger(vacancyCount) || vacancyCount < 1) { toast('Number of positions must be at least 1', 'error'); return; }
    if (!jdRequest) { toast('An approved JD approval request is required', 'error'); return; }
    setLoading(true);
    try {
      const created = await recruiterAPI.createJob({
        ...form,
        requirements: form.requirements.split('\n').filter(Boolean),
        experience: Math.floor(parseFloat(form.experience as string) || 0),
        vacancies: vacancyCount,
        jdApprovalRequestId: jdRequest.id,
      });
      const jobId = created?.job?.id || created?.id;
      if (jobId) {
        try {
          const linkData = await recruiterAPI.generateLinks(jobId);
          const link = linkData.applyLink || linkData.link || linkData.applicationLink || '';
          if (link) { setApplyLink(link); setShowLinkModal(true); }
          else { toast('Job published!', 'success'); navigate('/recruiter/jobs'); }
        } catch { toast('Job published', 'success'); navigate('/recruiter/jobs'); }
      } else { toast('Job published', 'success'); navigate('/recruiter/jobs'); }
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to create job', 'error');
    } finally { setLoading(false); }
  };

  if (checkingRequest) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
        Checking approval status…
      </div>
    );
  }

  if (requestInvalid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, fontFamily: "'Inter', sans-serif", padding: 24, textAlign: 'center' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>JD Approval Required</h2>
        <p style={{ fontSize: 13, color: '#64748b', maxWidth: 380, margin: 0 }}>
          You need an approved JD approval request before creating a Job Description.
          Submit a new request, or pick an already-approved one from your requests list.
        </p>
        <button onClick={() => navigate('/recruiter/jd-approval-requests')} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Go to JD Approval Requests
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .cj-input:focus { border-color: #8B0000 !important; background: #fff !important; }
        .cj-ai-btn:hover { background: #6B0000 !important; }
      `}</style>
      <ToastContainer toasts={toasts} remove={remove} />
      {jdRequest && (
        <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '8px 24px', fontSize: 12.5, color: '#15803d', textAlign: 'center' }}>
          ✓ Creating JD for approved request #{jdRequest.id} — all approved details below are locked. Need something different? Submit a new approval request instead.
          {(jdRequest.hiring_manager || jdRequest.expected_joining_date || jdRequest.hiring_reason) && (
            <div style={{ marginTop: 4, color: '#166534', fontSize: 12 }}>
              {jdRequest.hiring_manager && <>Hiring Manager: <strong>{jdRequest.hiring_manager}</strong>{'  '}</>}
              {jdRequest.expected_joining_date && <>· Expected Joining: <strong>{new Date(jdRequest.expected_joining_date).toLocaleDateString()}</strong>{'  '}</>}
              {jdRequest.hiring_reason && <>· Reason: <strong>{jdRequest.hiring_reason}</strong></>}
            </div>
          )}
        </div>
      )}

      <div style={{
        background: '#FAFAFA', borderBottom: '1px solid #e2e8f0',
        height: 52, display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 8, position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={() => navigate('/recruiter/jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#0f172a')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ChevronLeft style={{ width: 15, height: 15 }} /> Jobs
        </button>
        <span style={{ color: '#e2e8f0' }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Create Job Posting</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setAiModal(true)}
          className="cj-ai-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8B0000', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }}
        >
          <Wand2 style={{ width: 13, height: 13 }} /> AI JD Generate
        </button>
      </div>

      {aiModal && <AIModal onClose={() => setAiModal(false)} onFill={handleAIFill} toast={toast} />}
      {showLinkModal && applyLink && (
        <ApplyLinkModal link={applyLink} onClose={() => { setShowLinkModal(false); navigate('/recruiter/jobs'); }} />
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Section title="Basic Information">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <FieldLabel required>Job Title</FieldLabel>
                <input className="cj-input" style={{ ...inputStyle, ...(jdRequest ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}) }} value={form.title} onChange={set('title')} placeholder="e.g. Senior React Developer" required readOnly={!!jdRequest} />
              </div>
              <div>
                <FieldLabel>Department</FieldLabel>
                <select className="cj-input" style={{ ...inputStyle, ...(jdRequest ? { background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' } : {}) }} value={form.department} onChange={set('department')} disabled={!!jdRequest}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </Section>

          <Section title="Job Description">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <FieldLabel required>Description</FieldLabel>
              <button type="button" onClick={generateDescription} disabled={generatingDescription || !form.title.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', background: generatingDescription || !form.title.trim() ? '#f1f5f9' : '#FDF2F2', color: generatingDescription || !form.title.trim() ? '#94a3b8' : '#8B0000', border: `1px solid ${generatingDescription || !form.title.trim() ? '#e2e8f0' : '#8B0000'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: generatingDescription || !form.title.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                <Sparkles size={13} /> {generatingDescription ? 'Generating…' : 'Generate Description'}
              </button>
            </div>
            <textarea
              className="cj-input"
              style={{ ...inputStyle, minHeight: 140, resize: 'vertical', lineHeight: 1.65 }}
              value={form.description} onChange={set('description')}
              placeholder="Describe the role, responsibilities, and what success looks like in this position."
              rows={6} required
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Generates a full description with a "Key Responsibilities" list based on the Job Title{form.skills.length ? ', Skills' : ''}{form.experience ? ' and Experience' : ''} — you can edit it after.</div>
          </Section>

          <Section title="Required Skills">
            {!jdRequest && (
              <>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="cj-input" style={{ ...inputStyle, flex: 1 }}
                    value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKey} placeholder="Type a skill and press Enter or comma"
                  />
                  <button type="button" onClick={() => addSkill(skillInput)}
                    style={{ padding: '9px 16px', background: '#8B0000', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Add
                  </button>
                </div>
                {/* Skill suggestions */}
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Suggested Skills — click to add</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SKILL_SUGGESTIONS
                      .filter(sk => !form.skills.includes(sk) && (skillInput === '' || sk.toLowerCase().includes(skillInput.toLowerCase())))
                      .slice(0, 20)
                      .map(sk => (
                        <button
                          key={sk} type="button"
                          onClick={() => { setForm(f => ({ ...f, skills: [...f.skills, sk] })); }}
                          style={{ padding: '3px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 20, fontSize: 12, color: '#475569', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#EFF6FF'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#BFDBFE'; (e.currentTarget as HTMLButtonElement).style.color = '#1D4ED8'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; }}
                        >
                          + {sk}
                        </button>
                      ))}
                  </div>
                </div>
              </>
            )}
            {form.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: jdRequest ? 0 : 12 }}>
                {form.skills.map(sk => (
                  <span key={sk} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 20 }}>
                    {sk}
                    {!jdRequest && (
                      <button type="button" onClick={() => removeSkill(sk)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', alignItems: 'center' }}>
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '10px 0 0' }}>No skills added yet</p>
            )}
          </Section>

          <Section title="Requirements">
            <FieldLabel>Additional Requirements</FieldLabel>
            <textarea
              className="cj-input"
              style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.65 }}
              value={form.requirements} onChange={set('requirements')}
              placeholder={"One per line:\nBachelor's degree in Computer Science\nStrong communication skills"}
              rows={4}
            />
          </Section>
        </div>

        <div style={{ width: 248, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 68 }}>

          <Section title="Job Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <FieldLabel required>Employment Type</FieldLabel>
                <select className="cj-input" style={lockedInputStyle(!!jdRequest)} value={form.type} onChange={set('type')} disabled={!!jdRequest} required>
                  <option value="">Select Type</option>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel required>Work Mode</FieldLabel>
                <select className="cj-input" style={lockedInputStyle(!!jdRequest)} value={form.workMode} onChange={set('workMode')} disabled={!!jdRequest} required>
                  <option value="">Select Work Mode</option>
                  {WORK_MODES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel required>Location</FieldLabel>
                {jdRequest ? (
                  <div style={lockedInputStyle(true)}>{form.location || '—'}</div>
                ) : (
                  <LocationDropdown value={form.location} onChange={v => setForm(f => ({ ...f, location: v }))} />
                )}
              </div>
              <div>
                <FieldLabel required>Min Experience (Years)</FieldLabel>
                <input className="cj-input" style={lockedInputStyle(!!jdRequest)} type="number" min={0} max={30} step={1} value={form.experience}
                  onChange={e => setForm(f => ({ ...f, experience: String(Math.floor(parseFloat(e.target.value) || 0)) }))} placeholder="e.g. 2" readOnly={!!jdRequest} required />
              </div>
              <div>
                <FieldLabel required>Number of Positions</FieldLabel>
                <input className="cj-input" style={lockedInputStyle(!!jdRequest)} type="number" min={1} step={1} value={form.vacancies}
                  onChange={e => setForm(f => ({ ...f, vacancies: e.target.value }))} placeholder="e.g. 3" readOnly={!!jdRequest} required />
              </div>
              <div>
                <FieldLabel required>Salary Range</FieldLabel>
                <input className="cj-input" style={lockedInputStyle(!!jdRequest)} value={form.salary} onChange={set('salary')} placeholder="e.g. 12–18 LPA" readOnly={!!jdRequest} required />
              </div>
            </div>
          </Section>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '10px', background: loading ? '#94a3b8' : '#8B0000',
              color: 'white', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <><span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Publishing…</>
            ) : 'Publish & Get Apply Link'}
          </button>

          <button type="button" onClick={() => navigate('/recruiter/jobs')}
            style={{ width: '100%', padding: '9px', background: 'white', color: '#64748b', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#8B0000')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateJob;
