import React, { useState, useEffect } from 'react';
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

const EmployeeReferralLogin: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('employee_ref_token');
    if (token) navigate('/referral/dashboard');
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await referralAPI.employeeLogin(form.email, form.password);
      if (res.success) {
        localStorage.setItem('employee_ref_token', res.token || '');
        localStorage.setItem('employee_ref_user', JSON.stringify(res.user));
        navigate('/referral/dashboard');
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
        .erl-in:focus { outline: none; border-color: #0ea5e9 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(14,165,233,0.09) !important; }
        .erl-btn:hover:not(:disabled) { background: #0284c7 !important; }
        .erl-ghost:hover { border-color: #0ea5e9 !important; color: #0ea5e9 !important; }
        @media (max-width: 720px) { .erl-left { display: none !important; } }
      `}</style>

      <div style={{
        display: 'flex', width: '100%', maxWidth: 860,
        background: 'white', border: '1px solid #e5e7eb',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}>

        {/* LEFT */}
        <div className="erl-left" style={{
          width: 340, flexShrink: 0, background: '#f8fafc',
          borderRight: '1px solid #e5e7eb', padding: '36px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28,
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
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.25, letterSpacing: '-0.5px', margin: '0 0 8px' }}>
              Employee Referral Platform
            </h2>
            <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Refer top talent, track referral progress, and earn rewards through a transparent process.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        }}>
          <div style={{ maxWidth: 320, margin: '0 auto', width: '100%' }}>

            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Welcome back</h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Sign in to your referral account</p>
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
                  className="erl-in"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password} required
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="erl-in"
                    style={{ width: '100%', padding: '9px 40px 9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, color: '#0f172a', background: '#f9fafb', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                  />
                  <button type="button" onClick={() => setShow(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    <EyeIcon open={show} />
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading} className="erl-btn"
                style={{
                  padding: '9px', background: loading ? '#38bdf8' : '#0ea5e9',
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
              <span style={{ fontSize: 11, color: '#cbd5e1' }}>New employee?</span>
              <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
            </div>

            <button
              onClick={() => navigate('/referral/register')} className="erl-ghost"
              style={{ width: '100%', padding: '9px', background: 'white', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: 13, fontWeight: 500, color: '#374151', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            >
              Create a referral account
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', margin: '14px 0 0' }}>
              Are you a recruiter?{' '}
              <span onClick={() => navigate('/RecruiterLogin')} style={{ color: '#4f46e5', fontWeight: 600, cursor: 'pointer' }}>Sign in here</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReferralLogin;
