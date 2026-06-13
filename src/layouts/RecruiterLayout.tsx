import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, BarChart3,
  LogOut, Users, Database, ChevronDown, Bell,
} from 'lucide-react';

const NAV = [
  { path: '/recruiter/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/recruiter/jobs',         icon: Briefcase,       label: 'Jobs' },
  { path: '/recruiter/applications', icon: FileText,        label: 'Applications' },
  { path: '/recruiter/referrals',    icon: Users,           label: 'Referrals' },
  { path: '/recruiter/analytics',    icon: BarChart3,       label: 'Analytics' },
  { path: '/recruiter/resume-pool',  icon: Database,        label: 'Resume Pool',  badge: 'AI' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; }
  @keyframes rl-in { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
  @keyframes rl-page { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .nav-item { transition: background 120ms ease, color 120ms ease; }
  .nav-item:hover { background: #F1F5F9 !important; }
  .nav-item:hover .nav-ico { color: #475569 !important; }
  .nav-item:hover .nav-lbl { color: #0F172A !important; }
  .sign-out:hover { background: #FEF2F2 !important; color: #DC2626 !important; }
  .sign-out:hover svg { color: #DC2626 !important; }
  .rl-nav-link { animation: rl-in .18s ease both; }
  .rl-main { animation: rl-page .2s ease both; }
`;

const RecruiterLayout: React.FC = () => {
  const location = useLocation();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const user     = JSON.parse(localStorage.getItem('recruiter_user') || '{}');
  const initials = (user.name || 'R').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    if (!window.confirm('Sign out?')) return;
    localStorage.removeItem('recruiter_token');
    localStorage.removeItem('recruiter_user');
    navigate('/RecruiterLogin');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      <style>{CSS}</style>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside style={{
        width: 232, minWidth: 232, background: '#FFFFFF',
        borderRight: '1px solid #E5E7EB',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 40,
      }}>

        {/* Brand */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Briefcase size={14} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                ASKOXY
              </div>
              <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 1 }}>
                Talent Platform
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <Bell size={15} style={{ color: '#CBD5E1', cursor: 'pointer' }} />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          <p style={{
            fontSize: 9.5, fontWeight: 600, color: '#94A3B8',
            textTransform: 'uppercase', letterSpacing: '0.09em',
            padding: '6px 10px 8px', margin: 0,
          }}>Menu</p>

          {NAV.map(({ path, icon: Icon, label, badge }, ni) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                className={active ? '' : 'nav-item rl-nav-link'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px',
                  marginBottom: 2,
                  borderRadius: 6,
                  textDecoration: 'none',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? '#2563EB' : '#64748B',
                  background: active ? '#EFF6FF' : 'transparent',
                  borderLeft: active ? '3px solid #2563EB' : '3px solid transparent',
                  transition: 'all 120ms ease',
                  position: 'relative',
                  animationDelay: `${ni * 0.05}s`,
                }}
              >
                <Icon size={15} className="nav-ico" style={{ color: active ? '#2563EB' : '#94A3B8', flexShrink: 0 }} />
                <span className="nav-lbl" style={{ flex: 1 }}>{label}</span>
                {badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    background: active ? '#DBEAFE' : '#F1F5F9',
                    color: active ? '#1D4ED8' : '#64748B',
                    letterSpacing: '0.04em',
                  }}>{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 8px 12px' }}>
          <div
            onClick={() => setMenuOpen(p => !p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 10px', borderRadius: 6,
              cursor: 'pointer', marginBottom: 2,
              background: menuOpen ? '#F8FAFC' : 'transparent',
              transition: 'background 120ms',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: '#2563EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10.5, fontWeight: 700,
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'Recruiter'}
              </div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email || 'Recruiter'}
              </div>
            </div>
            <ChevronDown size={12} style={{ color: '#94A3B8', flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </div>

          {menuOpen && (
            <button
              onClick={handleLogout}
              className="sign-out"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 10px',
                borderRadius: 6, border: 'none',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12.5, color: '#64748B', fontFamily: 'inherit',
                transition: 'background 120ms, color 120ms',
              }}
            >
              <LogOut size={13} style={{ transition: 'color 120ms' }} />
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="rl-main" style={{ flex: 1, marginLeft: 232, overflowY: 'auto', overflowX: 'hidden', background: '#F8FAFC' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterLayout;
