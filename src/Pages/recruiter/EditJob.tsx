import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';

const EditJob: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', location: '', type: 'full-time',
    experience: 0, salary: '', skills: '', requirements: '', department: ''
  });

  useEffect(() => {
    if (!jobId) return;
    recruiterAPI.getJobById(jobId)
      .then(data => {
        const job = data.job || data;
        const parseSkills = (v: any) => Array.isArray(v) ? v : (typeof v === 'string' && v ? v.split(',').map((s:string)=>s.trim()).filter(Boolean) : []);
        setForm({
          title: job.title || '',
          description: job.description || '',
          location: job.location || '',
          type: job.type || 'full-time',
          experience: job.experience_min ?? job.experience ?? 0,
          salary: job.salary || '',
          skills: parseSkills(job.skills ?? job.required_skills).join(', '),
          requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || ''),
          department: job.department || '',
        });
      })
      .catch(() => setError('Failed to load job'))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await recruiterAPI.updateJob(jobId!, {
        ...form,
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        requirements: form.requirements.split('\n').filter(Boolean),
        experience: parseInt(form.experience.toString()) || 0,
      });
      navigate('/recruiter/jobs');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p>Loading job...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/recruiter/jobs')}>← Back to Jobs</button>
        <h1 style={s.title}>Edit Job</h1>
      </div>

      <div style={s.body}>
        <form onSubmit={handleSubmit} style={s.form}>
          {error && <div style={s.err}>{error}</div>}

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Job Title *</label>
              <input style={s.input} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Department</label>
              <input style={s.input} value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Job Description *</label>
            <textarea style={s.textarea} value={form.description} rows={6}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Location</label>
              <input style={s.input} value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Job Type</label>
              <select style={s.select} value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Experience (years)</label>
              <input style={s.input} type="number" min={0} max={20} value={form.experience}
                onChange={e => setForm(f => ({ ...f, experience: parseInt(e.target.value) || 0 }))} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Salary Range</label>
              <input style={s.input} value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. ₹8L - ₹15L" />
            </div>
          </div>

          <div style={s.field}>
            <label style={s.label}>Required Skills (comma separated)</label>
            <input style={s.input} value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="React, Node.js, Python" />
          </div>

          <div style={s.field}>
            <label style={s.label}>Requirements (one per line)</label>
            <textarea style={s.textarea} value={form.requirements} rows={4}
              onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} />
          </div>

          <div style={s.actions}>
            <button type="button" style={s.cancelBtn} onClick={() => navigate('/recruiter/jobs')}>Cancel</button>
            <button type="submit" style={saving ? s.btnDisabled : s.btn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 },
  spinner: { width: 32, height: 32, border: '3px solid #ddd', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 },
  back: { padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' },
  title: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  body: { padding: 24, maxWidth: 800, margin: '0 auto' },
  form: { background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 20 },
  err: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 500, color: '#374151' },
  input: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  textarea: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical' },
  select: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  actions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
  cancelBtn: { padding: '10px 20px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' },
  btn: { padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { padding: '10px 24px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed' },
};

export default EditJob;
