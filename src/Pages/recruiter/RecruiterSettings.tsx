import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';

const RecruiterSettings: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    recruiterAPI.getProfile()
      .then(data => {
        const p = data.recruiter || data;
        setProfile(p);
        setForm({ name: p.name || '', phone_number: p.phone_number || p.phone || '' });
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      await recruiterAPI.updateProfile(form);
      localStorage.setItem('recruiter_user', JSON.stringify({ ...profile, ...form }));
      setMsg('Settings saved successfully!');
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('recruiter_token');
      localStorage.removeItem('recruiter_user');
      navigate('/RecruiterLogin');
    }
  };

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p>Loading settings...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => navigate('/recruiter/dashboard')}>← Dashboard</button>
        <h1 style={s.title}>Settings</h1>
      </div>

      <div style={s.body}>
        {/* Account Info */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Account Information</h2>
          {msg && <div style={s.success}>{msg}</div>}
          {error && <div style={s.err}>{error}</div>}

          <div style={s.infoGrid}>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Email</span>
              <span style={s.infoVal}>{profile?.email || '—'}</span>
            </div>
            <div style={s.infoItem}>
              <span style={s.infoLabel}>Company</span>
              <span style={s.infoVal}>{profile?.company || '—'}</span>
            </div>
          </div>

          <form onSubmit={handleSave} style={s.form}>
            <div style={s.row}>
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
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <button style={saving ? s.btnDisabled : s.btn} type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div style={{ ...s.card, border: '1px solid #fecaca' }}>
          <h2 style={{ ...s.cardTitle, color: '#dc2626' }}>Account Actions</h2>
          <div style={s.dangerRow}>
            <div>
              <p style={s.dangerLabel}>Logout</p>
              <p style={s.dangerDesc}>Sign out from your recruiter account</p>
            </div>
            <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
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
  body: { padding: 24, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 },
  card: { background: 'white', borderRadius: 12, padding: 28, border: '1px solid #e2e8f0' },
  cardTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
  infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 },
  infoItem: { display: 'flex', flexDirection: 'column', gap: 4 },
  infoLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' },
  infoVal: { fontSize: 15, color: '#1e293b', fontWeight: 500 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 14, fontWeight: 500, color: '#374151' },
  input: { padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14 },
  btn: { padding: '12px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' },
  btnDisabled: { padding: '12px 24px', background: '#9ca3af', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', alignSelf: 'flex-start' },
  success: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 16 },
  err: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16 },
  dangerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dangerLabel: { fontSize: 15, fontWeight: 600, color: '#1e293b', margin: 0 },
  dangerDesc: { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  logoutBtn: { padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};

export default RecruiterSettings;
