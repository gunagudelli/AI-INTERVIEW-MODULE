import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { jdApprovalAPI } from '../../services/recruiterAPI';
import BASE_URL from '../../Config';
import { ChevronLeft, Plus, X, Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';

const BASE = BASE_URL;

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Other'];
const EMPLOYMENT_TYPES = [
  { value: 'full-time',  label: 'Full Time' },
  { value: 'part-time',  label: 'Part Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];
// Cities/countries only — Remote/Hybrid live in Work Mode above, not here.
const LOCATIONS = [
  'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune', 'Kolkata',
  'Noida', 'Gurgaon', 'Ahmedabad', 'Jaipur', 'Kochi', 'Chandigarh',
  'Coimbatore', 'Visakhapatnam', 'Indore', 'Nagpur', 'Bhopal',
  'USA', 'UK', 'Canada', 'Australia', 'Singapore', 'Dubai', 'Germany',
];
const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; msg: string; type: ToastType; }

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

// Portaled directly to document.body — same as the modal below. Without this, this
// container renders inside the app's normal React tree, and if any ancestor creates a
// CSS stacking context, its z-index only competes *within* that trapped context; the
// body-portaled modal would then sit visually on top of it regardless of z-index value.
const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => createPortal(
  <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', width: 'min(92vw, 420px)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(255,255,255,0.96)',
        border: `1px solid ${t.type === 'success' ? '#bbf7d0' : t.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
        borderRadius: 14, padding: '12px 14px', width: '100%', pointerEvents: 'all', boxSizing: 'border-box',
        boxShadow: '0 18px 40px rgba(15,23,42,0.14)',
      }}>
        <span style={{ fontSize: 13, flex: 1, color: '#0f172a', lineHeight: 1.5 }}>{t.msg}</span>
        <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
      </div>
    ))}
  </div>,
  document.body
);

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb',
  borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#ffffff',
  boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
};

const fieldLabel = (text: string, required?: boolean): React.ReactNode => (
  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
    {text}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
  </label>
);

// Searchable location dropdown — same pattern as CreateJob.tsx's LocationDropdown,
// so typing/selecting a location feels identical across both forms.
const LocationDropdown: React.FC<{ value: string; onChange: (v: string) => void; error?: boolean }> = ({ value, onChange, error }) => {
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
        style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', borderColor: open ? '#8B0000' : error ? '#ef4444' : '#e5e7eb', background: error ? '#fef2f2' : inputStyle.background }}>
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

interface JdRequest {
  id: number;
  job_title: string;
  department: string | null;
  vacancies: number;
  experience_min: number | null;
  skills: string[];
  employment_type: string | null;
  work_mode: string | null;
  location: string | null;
  salary: string | null;
  hiring_reason: string | null;
  hiring_manager: string | null;
  expected_joining_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  requested_at: string;
  decided_at: string | null;
  job_id: number | null;
}

const STATUS_META: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  bg: '#fffbeb', color: '#b45309', icon: <Clock size={12} /> },
  approved: { label: 'Approved', bg: '#f0fdf4', color: '#15803d', icon: <CheckCircle2 size={12} /> },
  rejected: { label: 'Rejected', bg: '#fef2f2', color: '#b91c1c', icon: <XCircle size={12} /> },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '3px 9px', borderRadius: 20, background: m.bg, color: m.color }}>
      {m.icon}{m.label}
    </span>
  );
};

const NewRequestModal: React.FC<{ onClose: () => void; onSubmitted: () => void; toast: (m: string, t?: ToastType) => void }> = ({ onClose, onSubmitted, toast }) => {
  const [jobTitle, setJobTitle]         = useState('');
  const [department, setDepartment]     = useState('');
  const [vacancies, setVacancies]       = useState('1');
  const [experience, setExperience]     = useState('');
  const [skillInput, setSkillInput]     = useState('');
  const [skills, setSkills]             = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState('');
  const [workMode, setWorkMode]         = useState('');
  const [location, setLocation]         = useState('');
  const [salary, setSalary]             = useState('');
  const [hiringReason, setHiringReason] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [joiningDate, setJoiningDate]   = useState('');
  const [saving, setSaving]             = useState(false);
  const [suggesting, setSuggesting]     = useState(false);
  // Per-field validation errors — shown as "This field is required" directly under the
  // specific empty field, with a red border on that field, instead of a generic toast.
  const [errors, setErrors]             = useState<Record<string, string>>({});

  const clearError = (field: string) => setErrors(e => (e[field] ? { ...e, [field]: '' } : e));
  const fieldStyle = (field: string, base: React.CSSProperties = inputStyle): React.CSSProperties =>
    errors[field] ? { ...base, borderColor: '#ef4444', background: '#fef2f2' } : base;
  const FieldError: React.FC<{ field: string }> = ({ field }) =>
    errors[field] ? <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>{errors[field]}</div> : null;

  const addSkill = () => {
    const tags = skillInput.split(',').map(s => s.trim()).filter(s => s && !skills.includes(s));
    if (tags.length) { setSkills(s => [...s, ...tags]); setSkillInput(''); }
  };

  // AI-suggest Job Title + Skills + Experience from whatever's typed in the Job Title
  // field — same endpoint CreateJob.tsx's "AI JD Generate" already uses. Handles both
  // a bare title ("Java Developer") and a full sentence ("Java Developer with 2 years
  // of experience") — in the sentence case, the AI-cleaned title replaces the raw text.
  const suggestFromTitle = async () => {
    if (!jobTitle.trim()) { toast('Type a job title first', 'error'); return; }
    setSuggesting(true);
    try {
      const res = await fetch(`${BASE}/api/jobs/analyze-sentence`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: jobTitle.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.jobTitle && data.jobTitle.trim() && data.jobTitle.trim() !== jobTitle.trim()) {
          setJobTitle(data.jobTitle.trim());
        }
        if (Array.isArray(data.skills) && data.skills.length) {
          setSkills(s => Array.from(new Set([...s, ...data.skills])));
        }
        if (data.experience != null) {
          setExperience(String(Math.floor(Number(data.experience)) || 0));
        }
        toast('Job title, skills and experience suggested', 'success');
      } else {
        toast('Could not generate suggestions. Please try again.', 'error');
      }
    } catch {
      toast('Could not generate suggestions — check your connection and try again.', 'error');
    } finally { setSuggesting(false); }
  };

  const submit = async () => {
    const positions = parseInt(vacancies, 10);
    const nextErrors: Record<string, string> = {};
    if (!jobTitle.trim())                                    nextErrors.jobTitle = 'This field is required.';
    if (!Number.isInteger(positions) || positions < 1)        nextErrors.vacancies = 'This field is required.';
    if (!experience)                                          nextErrors.experience = 'This field is required.';
    if (!employmentType)                                      nextErrors.employmentType = 'This field is required.';
    if (!workMode)                                            nextErrors.workMode = 'This field is required.';
    if (!location.trim())                                     nextErrors.location = 'This field is required.';
    if (!salary.trim())                                       nextErrors.salary = 'This field is required.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast('Please fill in the required fields highlighted below.', 'error');
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const created = await jdApprovalAPI.submit({
        jobTitle: jobTitle.trim(),
        department: department || undefined,
        vacancies: positions,
        experienceMin: Math.floor(parseFloat(experience) || 0),
        skills,
        employmentType,
        workMode,
        location: location.trim(),
        salary: salary.trim(),
        hiringReason: hiringReason.trim() || undefined,
        hiringManager: hiringManager.trim() || undefined,
        expectedJoiningDate: joiningDate || undefined,
      });
      if (!created?.id) {
        // Request didn't actually 400/500, but also didn't come back with a
        // saved row — treat as a failure instead of silently closing the modal.
        toast('Submission did not complete. Please try again.', 'error');
        return;
      }
      await onSubmitted();
      toast(`Request for "${created.job_title}" submitted successfully`, 'success');
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error || 'Failed to submit request. Please check your connection and try again.', 'error');
    } finally { setSaving(false); }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 60, padding: '24px 16px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 620, border: '1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Request JD Approval</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div>
            {fieldLabel('Job Title', true)}
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...fieldStyle('jobTitle'), flex: 1 }} value={jobTitle} onChange={e => { setJobTitle(e.target.value); clearError('jobTitle'); }} placeholder="e.g. Java Developer with 2 years of experience" autoFocus />
              <button type="button" onClick={suggestFromTitle} disabled={suggesting || !jobTitle.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px', background: suggesting || !jobTitle.trim() ? '#f1f5f9' : '#FDF2F2', color: suggesting || !jobTitle.trim() ? '#94a3b8' : '#8B0000', border: `1px solid ${suggesting || !jobTitle.trim() ? '#e2e8f0' : '#8B0000'}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: suggesting || !jobTitle.trim() ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Sparkles size={13} /> {suggesting ? 'Suggesting…' : 'Suggest'}
              </button>
            </div>
            <FieldError field="jobTitle" />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 5 }}>Type a title or a full sentence (e.g. "Java Developer with 2 years of experience") — Suggest will clean up the title and fill Skills + Experience</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {fieldLabel('Department')}
              <select style={inputStyle} value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              {fieldLabel('Number of Positions', true)}
              <input type="number" min={1} step={1} style={fieldStyle('vacancies')} value={vacancies} onChange={e => { setVacancies(e.target.value); clearError('vacancies'); }} />
              <FieldError field="vacancies" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {fieldLabel('Experience Required (Years)', true)}
              <input type="number" min={0} max={30} step={1} style={fieldStyle('experience')} value={experience} onChange={e => { setExperience(e.target.value); clearError('experience'); }} placeholder="e.g. 2" />
              <FieldError field="experience" />
            </div>
            <div>
              {fieldLabel('Employment Type', true)}
              <select style={fieldStyle('employmentType')} value={employmentType} onChange={e => { setEmploymentType(e.target.value); clearError('employmentType'); }}>
                <option value="">Select Type</option>
                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <FieldError field="employmentType" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {fieldLabel('Work Mode', true)}
              <select style={fieldStyle('workMode')} value={workMode} onChange={e => { setWorkMode(e.target.value); clearError('workMode'); }}>
                <option value="">Select Work Mode</option>
                {WORK_MODES.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
              </select>
              <FieldError field="workMode" />
            </div>
            <div>
              {fieldLabel('Job Location', true)}
              <LocationDropdown value={location} onChange={v => { setLocation(v); clearError('location'); }} error={!!errors.location} />
              <FieldError field="location" />
            </div>
          </div>

          <div>
            {fieldLabel('Salary Range', true)}
            <input style={fieldStyle('salary')} value={salary} onChange={e => { setSalary(e.target.value); clearError('salary'); }} placeholder="e.g. 12–18 LPA" />
            <FieldError field="salary" />
          </div>

          <div>
            {fieldLabel('Required Skills')}
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={inputStyle} value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }}
                placeholder="Type a skill and press Enter" />
              <button type="button" onClick={addSkill} style={{ padding: '9px 14px', background: '#8B0000', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Add</button>
            </div>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {skills.map(sk => (
                  <span key={sk} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '3px 9px', borderRadius: 20 }}>
                    {sk}
                    <button type="button" onClick={() => setSkills(s => s.filter(x => x !== sk))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {fieldLabel('Hiring Manager')}
              <input style={inputStyle} value={hiringManager} onChange={e => setHiringManager(e.target.value)} placeholder="e.g. Priya Sharma" />
            </div>
            <div>
              {fieldLabel('Expected Joining Date')}
              <input type="date" style={inputStyle} value={joiningDate} onChange={e => setJoiningDate(e.target.value)} />
            </div>
          </div>

          <div>
            {fieldLabel('Hiring Reason')}
            <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={hiringReason} onChange={e => setHiringReason(e.target.value)} placeholder="Why is this role needed? (backfill, new team, expansion...)" />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={submit} disabled={saving} style={{ flex: 1, padding: '10px 0', background: saving ? '#94a3b8' : '#8B0000', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
            <button onClick={onClose} style={{ padding: '10px 16px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const WORK_MODE_LABEL: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

const JDApprovalRequests: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, toast, remove } = useToast();
  const [requests, setRequests] = useState<JdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await jdApprovalAPI.listMine();
      setRequests(data);
    } catch {
      toast('Failed to load requests', 'error');
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <ToastContainer toasts={toasts} remove={remove} />
      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onSubmitted={load} toast={toast} />}

      <div style={{ background: '#FAFAFA', borderBottom: '1px solid #e2e8f0', height: 52, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 8, position: 'sticky', top: 0, zIndex: 20 }}>
        <button onClick={() => navigate('/recruiter/jobs')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13, padding: 0 }}>
          <ChevronLeft size={15} /> Jobs
        </button>
        <span style={{ color: '#e2e8f0' }}>|</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>JD Approval Requests</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#8B0000', color: 'white', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> New Request
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading…</p>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: 14, margin: '0 0 12px' }}>No JD approval requests yet.</p>
            <button onClick={() => setShowModal(true)} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Request Approval
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map(r => (
              <div key={r.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.job_title}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {r.department || 'No department'} · {r.vacancies} position{r.vacancies !== 1 ? 's' : ''} · {r.experience_min ?? 0}+ yrs · {EMPLOYMENT_TYPES.find(t => t.value === r.employment_type)?.label || r.employment_type} · {WORK_MODE_LABEL[r.work_mode || ''] || r.work_mode} · {r.location} · {r.salary}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                    Requested {new Date(r.requested_at).toLocaleDateString()}
                    {r.hiring_manager && ` · Hiring Manager: ${r.hiring_manager}`}
                    {r.expected_joining_date && ` · Joining: ${new Date(r.expected_joining_date).toLocaleDateString()}`}
                  </div>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 10px' }}>
                      Reason: {r.rejection_reason}
                    </div>
                  )}
                </div>
                {r.status === 'approved' && !r.job_id && (
                  <button onClick={() => navigate(`/recruiter/jobs/create?requestId=${r.id}`)} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Create JD
                  </button>
                )}
                {r.status === 'approved' && r.job_id && (
                  <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>JD created</span>
                )}
                {r.status === 'rejected' && (
                  <button onClick={() => setShowModal(true)} style={{ background: 'white', color: '#8B0000', border: '1px solid #8B0000', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                    Resubmit
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JDApprovalRequests;
