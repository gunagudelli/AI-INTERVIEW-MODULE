import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { referralAPI } from '../../services/recruiterAPI';

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
  { label: 'Candidate Referrals', desc: 'Submit a referral in under 60 seconds' },
  { label: 'Real-time Status Tracking', desc: 'Know exactly where your referral stands' },
  { label: 'Reward Management', desc: 'Earn and track bonuses for every successful hire' },
];

const EmployeeReferralRegister: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', department: '', company: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await referralAPI.employeeRegister(form);
      if (res.success) {
        localStorage.setItem('employee_ref_token', res.token || '');
        localStorage.setItem('employee_ref_user', JSON.stringify(res.user));
        navigate('/referral/dashboard');
      } else setError(res.error || 'Registration failed');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb',
    borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#f9fafb',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: '24px 16px',
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .err-in:focus { outline: none; border-color: #0ea5e9 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.09) !important; }
        .err-btn:hover:not(:disabled) { background: #0284c7 !important; }
        @media (max-width: 720px) { .err-left { display: none !important; } }
      `}</style>

      <div style={{
        display: 'flex', width: '100%', maxWidth: 900,
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}>

        {/* LEFT */}
        <div className="err-left" style={{
          width: 320, flexShrink: 0, background: '#f8fafc',
          borderRight: '1px solid #e5e7eb', padding: '36px 30px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7, background: '#0ea5e9', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>ASKOXY EMPLOYEE PORTAL</span>
          </div>

          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#e0f2fe', border: '1px solid #bae6fd',
              borderRadius: 5, padding: '3px 8px', marginBottom: 10,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#0ea5e9' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#0369a1', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Referral Program</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.4px', margin: '0 0 7px' }}>
              Employee Referral Platform
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Refer top talent, track referral progress, and earn rewards transparently.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#e0f2fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                }}>
                  <svg width="9" height="9" fill="none" stroke="#0ea5e9" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Join the referral network and start earning</p>
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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Full name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" required placeholder="John Doe" value={form.name} onChange={set('name')} className="err-in" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Phone</label>
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} className="err-in" style={inp} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Work email <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="email" required placeholder="you@company.com" value={form.email} onChange={set('email')} className="err-in" style={inp} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} required placeholder="Min. 6 characters" value={form.password} onChange={set('password')} className="err-in" style={{ ...inp, paddingRight: 38 }} />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>

              {/* Optional */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.06em' }}>OPTIONAL</span>
                <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Department</label>
                  <input type="text" placeholder="Engineering" value={form.department} onChange={set('department')} className="err-in" style={inp} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Company</label>
                  <input type="text" placeholder="Askoxy" value={form.company} onChange={set('company')} className="err-in" style={inp} />
                </div>
              </div>

              <button
                type="submit" disabled={loading} className="err-btn"
                style={{
                  padding: '9px', background: loading ? '#38bdf8' : '#0ea5e9',
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
              <span onClick={() => navigate('/referral/login')} style={{ color: '#0ea5e9', fontWeight: 600, cursor: 'pointer' }}>Sign in</span>
            </p>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '8px 0 0' }}>
              Are you a recruiter?{' '}
              <span onClick={() => navigate('/RecruiterLogin')} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>Sign in here</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReferralRegister;
