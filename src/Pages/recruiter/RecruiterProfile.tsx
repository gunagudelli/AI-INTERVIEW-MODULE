import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';
import BASE_URL from '../../Config';

const RecruiterProfile: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Resume match state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState('');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    recruiterAPI.getProfile()
      .then(data => {
        const p = data.recruiter || data;
        setProfile(p);
        setForm({ name: p.name || '', phone_number: p.phone_number || p.phone || '' });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await recruiterAPI.updateProfile(form);
      setMsg('Profile updated successfully!');
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleMatchResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile || !jobId) return;
    setMatching(true);
    setMatchResult(null);
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      fd.append('jobId', jobId);
      const BASE = BASE_URL;
      const token = localStorage.getItem('recruiter_token');
      const res = await fetch(`${BASE}/api/applications/match-jd`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      }).then(r => r.json());
      setMatchResult(res);
    } catch {
      setError('Resume match failed');
    } finally {
      setMatching(false);
    }
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/recruiter/dashboard')}>← Dashboard</button>
        <h1 style={s.title}>My Profile</h1>
      </div>

      <div style={s.body}>
        {/* Profile Card */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Profile Information</h2>
          {msg && <div style={s.success}>{msg}</div>}
          {error && <div style={s.err}>{error}</div>}

          <div style={s.infoRow}>
            <span style={s.infoLabel}>Email:</span>
            <span style={s.infoVal}>{profile?.email}</span>
          </div>
          {profile?.company && (
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Company:</span>
              <span style={s.infoVal}>{profile.company}</span>
            </div>
          )}

          <form onSubmit={handleSave} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input
                style={s.input}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Phone Number</label>
              <input
                style={s.input}
                value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
              />
            </div>
            <button style={saving ? s.btnDisabled : s.btn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Resume ↔ JD Match */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Resume ↔ JD Match</h2>
          <p style={s.hint}>Upload a candidate resume and enter a Job ID to check match score.</p>
          <form onSubmit={handleMatchResume} style={s.form}>
            <div style={s.field}>
              <label style={s.label}>Resume File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                style={s.input}
                onChange={e => setResumeFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div style={s.field}>
              <label style={s.label}>Job ID</label>
              <input
                style={s.input}
                value={jobId}
                onChange={e => setJobId(e.target.value)}
                placeholder="Enter Job ID"
                required
              />
            </div>
            <button style={matching ? s.btnDisabled : s.btn} type="submit" disabled={matching}>
              {matching ? 'Matching...' : 'Check Match'}
            </button>
          </form>

          {matchResult && (
            <div style={s.matchBox}>
              <div style={s.matchScore}>
                Match Score: <strong>{matchResult.matchScore ?? matchResult.score ?? 'N/A'}%</strong>
              </div>
              {matchResult.skills && (
                <div style={s.matchDetail}>
                  <strong>Matched Skills:</strong> {matchResult.skills.join(', ')}
                </div>
              )}
              {matchResult.summary && (
                <div style={s.matchDetail}>{matchResult.summary}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#ffffff', fontFamily: 'Inter, sans-serif' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12 },
  spinner: { width: 32, height: 32, border: '3px solid #ddd', borderTop: '3px solid #667eea', borderRadius: '50%', animation: 'spin 1s linear infinite' },
  header: { background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 },
  back: { padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' },
  title: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  body: { padding: 24, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },
  card: { background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 },
  infoRow: { display: 'flex', gap: 12, marginBottom: 12 },
  infoLabel: { fontWeight: 600, color: '#64748b', minWidth: 80 },
  infoVal: { color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 500, color: '#374151' },
  input: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  btn: { padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
  btnDisabled: { padding: '12px 24px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', alignSelf: 'flex-start' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 12 },
  err: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 12 },
  hint: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  matchBox: { marginTop: 20, padding: 16, background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8 },
  matchScore: { fontSize: 18, color: '#0369a1', marginBottom: 8 },
  matchDetail: { fontSize: 14, color: '#334155', marginTop: 6 },
};

export default RecruiterProfile;
