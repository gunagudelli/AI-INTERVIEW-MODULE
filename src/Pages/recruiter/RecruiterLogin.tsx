import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAuth } from '../../services/recruiterAPI';

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const FEATURES = [
  { label: 'AI Resume Screening', desc: 'Auto-rank candidates against role requirements' },
  { label: 'Automated Assessments', desc: 'Multi-round AI interviews with real-time scoring' },
  { label: 'Recruitment Analytics', desc: 'Pipeline health, time-to-hire, and sourcing insights' },
];

const RecruiterLogin: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await recruiterAuth.login(form.email, form.password);
      if (res.success) {
        localStorage.setItem('recruiter_token', res.token);
        localStorage.setItem('recruiter_user', JSON.stringify(res.user));
        navigate('/recruiter/dashboard');
      } else setError('Invalid email or password');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rl-in:focus { outline: none; border-color: #4f46e5 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.09) !important; }
        .rl-btn:hover:not(:disabled) { background: #4338ca !important; }
        .rl-ghost:hover { border-color: #4f46e5 !important; color: #4f46e5 !important; }
        @media (max-width: 720px) { .rl-left { display: none !important; } .rl-card { border-radius: 12px !important; } }
      `}</style>

      {/* Card */}
      <div className="rl-card" style={{
        display: 'flex', width: '100%', maxWidth: 860,
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}>

        {/* LEFT */}
        <div className="rl-left" style={{
          width: 340, flexShrink: 0, background: '#fafafa',
          borderRight: '1px solid #e5e7eb', padding: '36px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28,
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: '#4f46e5', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.1px' }}>ASKOXY RECRUITER</span>
          </div>

          {/* Headline block */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: 5, padding: '3px 8px', marginBottom: 10,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Talent Acquisition</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              AI-Powered Hiring Platform
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Streamline hiring with intelligent screening, automated interviews, and recruitment analytics.
            </p>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#eef2ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="9" height="9" fill="none" stroke="#4f46e5" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', margin: '0 0 1px' }}>{f.label}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust */}

        </div>

        {/* RIGHT */}
        <div style={{
          flex: 1, padding: '36px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div style={{ maxWidth: 320, margin: '0 auto', width: '100%' }}>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Sign in</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Enter your credentials to continue</p>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
                background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
                padding: '8px 12px', borderRadius: 7, marginBottom: 16,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Work email</label>
                <input
                  type="email" placeholder="you@company.com" value={form.email} required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="rl-in"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} required
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="rl-in"
                    style={{ width: '100%', padding: '9px 40px 9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <EyeIcon open={showPass} />
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading} className="rl-btn"
                style={{
                  padding: '9px', background: loading ? '#818cf8' : '#4f46e5',
                  color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'background 0.15s', marginTop: 2,
                }}
              >
                {loading && <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>New here?</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>

            <button
              onClick={() => navigate('/RecruiterRegister')} className="rl-ghost"
              style={{ width: '100%', padding: '9px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            >
              Create a recruiter account
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '14px 0 0' }}>
              By signing in you agree to our <span style={{ color: '#4f46e5', cursor: 'pointer' }}>Terms</span> & <span style={{ color: '#4f46e5', cursor: 'pointer' }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
