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
  { label: 'Employee Referral Management', desc: 'End-to-end referral tracking and rewards' },
  { label: 'Recruitment Analytics', desc: 'Pipeline health, time-to-hire, sourcing insights' },
];

const RecruiterRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await recruiterAuth.register({
        name: form.name, email: form.email, password: form.password,
        phone_number: form.phone, phone: form.phone,
        company_name: form.company, company: form.company,
      });
      if (res.success) {
        setShowSuccess(true);
      } else setError('Registration failed. Please try again.');
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb',
    borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#ffffff',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .rr-in:focus { outline: none; border-color: #8B0000 !important; background: #fff !important; }
        .rr-btn:hover:not(:disabled) { background: #6B0000 !important; }
        @media (max-width: 720px) { .rr-left { display: none !important; } }
      `}</style>

      {showSuccess && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: 16, animation: 'fadeIn 0.18s ease',
        }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: '36px 32px',
            maxWidth: 400, width: '100%', textAlign: 'center',
            border: '1px solid #e5e7eb',
            animation: 'scaleIn 0.22s ease',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: '#f0fdf4',
              border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <svg width="22" height="22" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>Account created!</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
              Your recruiter account has been created successfully.<br />
              Please sign in with your credentials to continue.
            </p>
            <button
              onClick={() => navigate('/RecruiterLogin')}
              style={{
                width: '100%', padding: '10px', background: '#8B0000', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go to Sign In →
            </button>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', width: '100%', maxWidth: 900,
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
      }}>

        {/* LEFT */}
        <div className="rr-left" style={{
          width: 320, flexShrink: 0, background: '#ffffff',
          borderRight: '1px solid #e5e7eb', padding: '36px 30px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: '#8B0000', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>ASKOXY RECRUITER</span>
          </div>

          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#ffffff', border: '1px solid #e2e8f0',
              borderRadius: 5, padding: '3px 8px', marginBottom: 10,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#475569' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Talent Acquisition</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.4px', margin: '0 0 7px' }}>
              AI-Powered Hiring Platform
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Intelligent candidate screening, automated interviews, and referral management in one place.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#FDF2F2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="9" height="9" fill="none" stroke="#8B0000" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', margin: '0 0 1px' }}>{f.label}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{
          flex: 1, padding: '36px 40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          overflowY: 'auto',
        }}>
          <div style={{ maxWidth: 380, margin: '0 auto', width: '100%' }}>

            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Create your account</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Get started with your organization's hiring platform</p>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
                background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
                padding: '8px 12px', borderRadius: 7, marginBottom: 14,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Full name</label>
                  <input type="text" placeholder="Jane Smith" value={form.name} onChange={set('name')} required className="rr-in" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Company</label>
                  <input type="text" placeholder="Acme Corp" value={form.company} onChange={set('company')} required className="rr-in" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Work email</label>
                <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} required className="rr-in" style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Phone</label>
                  <input type="tel" placeholder="+91 9999 999999" value={form.phone} onChange={set('phone')} required className="rr-in" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} placeholder="Create password" value={form.password} onChange={set('password')} required className="rr-in" style={{ ...inp, paddingRight: 38 }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                      <EyeIcon open={showPass} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={loading} className="rr-btn"
                style={{
                  padding: '9px', background: loading ? '#94a3b8' : '#8B0000',
                  color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'background 0.15s', marginTop: 3,
                }}
              >
                {loading && <div style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: '14px 0 0' }}>
              Already have an account?{' '}
              <span onClick={() => navigate('/RecruiterLogin')} style={{ color: '#1D4ED8', fontWeight: 600, cursor: 'pointer' }}>Sign in</span>
            </p>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
              By creating an account you agree to our <span style={{ color: '#475569', cursor: 'pointer', textDecoration: 'underline' }}>Terms</span> & <span style={{ color: '#475569', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterRegister;
