import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';
import { X, ArrowLeft } from 'lucide-react';

const SKILL_SUGGESTIONS = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Angular', 'Vue.js',
  'Spring Boot', 'Django', 'Express.js', 'Next.js', 'SQL', 'MySQL', 'PostgreSQL', 'MongoDB',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'CI/CD', 'REST APIs', 'GraphQL',
  'HTML', 'CSS', 'Tailwind CSS', 'Redux', 'Figma', 'Agile', 'Scrum', 'Linux',
  'C++', 'C#', '.NET', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'Go', 'Rust',
  'Machine Learning', 'Data Analysis', 'Power BI', 'Tableau', 'Excel', 'Salesforce',
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ej-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

  .ej-section { animation: ej-in .2s ease both; }
  .ej-input, .ej-textarea, .ej-select { font-family: inherit; outline: none; transition: border-color .15s, box-shadow .15s; }
  .ej-input:focus, .ej-textarea:focus, .ej-select:focus { border-color: #93C5FD; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

  .ej-btn { transition: filter .1s, background .1s, border-color .1s; cursor: pointer; font-family: inherit; }
  .ej-btn:hover:not(:disabled) { filter: brightness(0.95); }
  .ej-btn:disabled { cursor: not-allowed; opacity: 0.6; }

  .ej-suggest { transition: background .12s, border-color .12s, color .12s; cursor: pointer; font-family: inherit; }
  .ej-suggest:hover { background: #EFF6FF !important; border-color: #BFDBFE !important; color: #1D4ED8 !important; }

  .ej-back:hover { background: #F1F5F9 !important; border-color: #CBD5E1 !important; }
  .ej-chip-remove:hover { color: #1D4ED8 !important; }
`;

const EditJob: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', type: 'full-time',
    experience: 0, salary: '', skills: [] as string[], requirements: '', department: ''
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (!jobId) return;
    recruiterAPI.getJobById(jobId)
      .then(data => {
        const job = data.job || data;
        const parseSkills = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' && v ? v.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
        const skillsArr = parseSkills(job.skills ?? job.required_skills);
        setForm({
          title: job.title || '',
          description: job.description || '',
          location: job.location || '',
          type: job.type || 'full-time',
          experience: job.experience_min ?? job.experience ?? 0,
          salary: job.salary || '',
          skills: skillsArr,
          requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || ''),
          department: job.department || '',
        });
      })
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())       { setError('Job title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }
    if (!form.location.trim())    { setError('Location is required'); return; }
    if (!form.type)               { setError('Employment type is required'); return; }
    if (form.experience === 0 || form.experience === null) { setError('Min experience is required'); return; }
    if (!form.salary.trim())      { setError('Salary range is required'); return; }
    setError('');
    setSaving(true);
    try {
      await recruiterAPI.updateJob(jobId!, {
        ...form,
        skills: form.skills,
        requirements: form.requirements.split('\n').filter(Boolean),
        experience: Math.floor(parseFloat(form.experience.toString()) || 0),
      });
      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, fontFamily: "'Inter', sans-serif", background: '#F8FAFC' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, border: '2.5px solid #E2E8F0', borderTop: '2.5px solid #1D4ED8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Loading job…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '16px 28px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="ej-back" onClick={() => navigate('/recruiter/jobs')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 600, fontFamily: 'inherit', transition: 'background .1s, border-color .1s' }}>
          <ArrowLeft size={14} /> Back to Jobs
        </button>
        <span style={{ color: '#E2E8F0' }}>|</span>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>Edit Job</h1>
      </div>

      <div style={{ padding: '28px 24px', maxWidth: 820, margin: '0 auto' }}>
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>

          {error && (
            <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', color: '#B91C1C', padding: '13px 28px', fontSize: 13.5, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Title / Department */}
            <div className="ej-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Job Title <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="ej-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Department</label>
                <input className="ej-input" value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }} />
              </div>
            </div>

            {/* Description */}
            <div className="ej-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Job Description <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea className="ej-textarea" value={form.description} rows={6}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required
                style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC', resize: 'vertical', lineHeight: 1.6 }} />
            </div>

            {/* Location / Type */}
            <div className="ej-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Location <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="ej-input" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Job Type <span style={{ color: '#EF4444' }}>*</span></label>
                <select className="ej-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }}>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Experience / Salary */}
            <div className="ej-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Experience (years) <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="ej-input" type="number" min={0} max={20} step={1} value={form.experience}
                  onChange={e => setForm(f => ({ ...f, experience: Math.floor(parseFloat(e.target.value) || 0) }))} required
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Salary Range <span style={{ color: '#EF4444' }}>*</span></label>
                <input className="ej-input" value={form.salary}
                  onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                  placeholder="e.g. ₹8L – ₹15L" required
                  style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }} />
              </div>
            </div>

            {/* Skills */}
            <div className="ej-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Required Skills</label>

              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <input className="ej-input" style={{ flex: 1, padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC' }}
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                      e.preventDefault();
                      const tags = skillInput.split(',').map(s => s.trim()).filter(s => s && !form.skills.includes(s));
                      if (tags.length) { setForm(f => ({ ...f, skills: [...f.skills, ...tags] })); setSkillInput(''); }
                    }
                  }}
                  placeholder="Type a skill and press Enter" />
                <button type="button" className="ej-btn"
                  onClick={() => {
                    const tags = skillInput.split(',').map(s => s.trim()).filter(s => s && !form.skills.includes(s));
                    if (tags.length) { setForm(f => ({ ...f, skills: [...f.skills, ...tags] })); setSkillInput(''); }
                  }}
                  style={{ padding: '10px 18px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  Add
                </button>
              </div>

              {/* Suggestions */}
              <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 8, padding: '10px 12px', marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Suggested Skills — click to add</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {SKILL_SUGGESTIONS
                    .filter(sk => !form.skills.includes(sk) && (skillInput === '' || sk.toLowerCase().includes(skillInput.toLowerCase())))
                    .slice(0, 20)
                    .map(sk => (
                      <button key={sk} type="button" className="ej-suggest"
                        onClick={() => setForm(f => ({ ...f, skills: [...f.skills, sk] }))}
                        style={{ padding: '3px 10px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 20, fontSize: 11.5, color: '#475569', fontWeight: 500 }}>
                        + {sk}
                      </button>
                    ))}
                </div>
              </div>

              {/* Selected skill chips */}
              {form.skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {form.skills.map(sk => (
                    <span key={sk} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 20 }}>
                      {sk}
                      <button type="button" className="ej-chip-remove" onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(s => s !== sk) }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex', alignItems: 'center', transition: 'color .1s' }}>
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>No skills added yet</p>
              )}
            </div>

            {/* Requirements */}
            <div className="ej-section" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151' }}>Requirements <span style={{ fontWeight: 400, color: '#94A3B8' }}>(one per line)</span></label>
              <textarea className="ej-textarea" value={form.requirements} rows={4}
                onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                style={{ padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, color: '#0F172A', background: '#F8FAFC', resize: 'vertical', lineHeight: 1.6 }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '18px 28px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
            <button type="button" className="ej-btn" onClick={() => navigate('/recruiter/jobs')}
              style={{ padding: '10px 20px', background: '#fff', color: '#374151', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 13.5, fontWeight: 600 }}>
              Cancel
            </button>
            <button type="submit" className="ej-btn" disabled={saving}
              style={{ padding: '10px 24px', background: saving ? '#94A3B8' : '#1D4ED8', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13.5, fontWeight: 700 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJob;