import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, FileText, BarChart3,
  LogOut, Users, Database, ChevronDown, Bell, Menu, X, Layers,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { jdApprovalAPI } from '../services/recruiterAPI';

const NAV = [
  { path: '/recruiter/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/recruiter/jobs',         icon: Briefcase,       label: 'Jobs' },
  { path: '/recruiter/applications', icon: FileText,        label: 'Applications' },
  { path: '/recruiter/referrals',    icon: Users,           label: 'Referrals' },
  { path: '/recruiter/analytics',    icon: BarChart3,       label: 'Analytics' },
  { path: '/recruiter/resume-pool',  icon: Database,        label: 'Resume Pool' },
  { path: '/recruiter/bulk-pool',    icon: Layers,          label: 'AI Bulk Pool', badge: 'AI' },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; margin: 0; }
  @keyframes rl-in   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:none} }
  @keyframes rl-page { from{opacity:0;transform:translateY(5px)}  to{opacity:1;transform:none} }
  @keyframes rl-drawer { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  .nav-item { transition: background 120ms ease, color 120ms ease; }
  .nav-item:hover { background: #FDF2F2 !important; }
  .nav-item:hover .nav-ico { color: #8B0000 !important; }
  .nav-item:hover .nav-lbl { color: #0F172A !important; }
  .sign-out:hover { background: #FDF2F2 !important; color: #8B0000 !important; }
  .sign-out:hover svg { color: #8B0000 !important; }
  .rl-nav-link { animation: rl-in .18s ease both; }
  .rl-main { animation: rl-page .2s ease both; }
  .rl-drawer { animation: rl-drawer .22s ease both; }
  .rl-overlay { animation: rl-page .15s ease both; }

  /* ── desktop: show sidebar, hide mobile header & bottom nav ── */
  .rl-sidebar   { display: flex; }
  .rl-mob-hdr   { display: none; }
  .rl-bot-nav   { display: none; }
  .rl-main      { margin-left: 232px; }

  /* ── mobile ── */
  @media (max-width: 768px) {
    .rl-sidebar  { display: none !important; }
    .rl-mob-hdr  { display: flex !important; }
    .rl-bot-nav  { display: flex !important; }
    .rl-main     { margin-left: 0 !important; padding-top: 52px !important; padding-bottom: 64px; }
    .rl-drawer   { display: flex !important; }
  }
`;

interface JdNotification {
  id: number;
  job_title: string;
  status: 'approved' | 'rejected';
  rejection_reason: string | null;
  recruiter_seen: boolean;
}

const NotificationDropdown: React.FC<{
  items: JdNotification[];
  onClose: () => void;
  onItemClick: (id: number) => void;
}> = ({ items, onClose, onItemClick }) => createPortal(
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
    <div style={{ position: 'fixed', top: 60, right: 16, width: 320, maxHeight: 420, overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 12px 32px rgba(15,23,42,0.15)', zIndex: 91 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #f1f5f9', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
        JD Approval Updates
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '24px 14px', fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>No new updates</div>
      ) : items.map(n => (
        <div key={n.id} onClick={() => onItemClick(n.id)} style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          {n.status === 'approved'
            ? <CheckCircle2 size={14} style={{ color: '#15803d', marginTop: 2, flexShrink: 0 }} />
            : <XCircle size={14} style={{ color: '#b91c1c', marginTop: 2, flexShrink: 0 }} />}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>
              {n.status === 'approved' ? 'JD approval request approved' : 'JD approval request rejected'}
            </div>
            <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{n.job_title}</div>
            {n.status === 'rejected' && n.rejection_reason && (
              <div style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>Reason: {n.rejection_reason}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  </>,
  document.body
);

const RecruiterLayout: React.FC = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [notifItems,  setNotifItems]  = useState<JdNotification[]>([]);

  const user     = JSON.parse(localStorage.getItem('recruiter_user') || '{}');
  const initials = (user.name || 'R').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const loadBadge = useCallback(async () => {
    try { setUnseenCount(await jdApprovalAPI.getBadge()); } catch { /* not logged in yet, or offline */ }
  }, []);

  useEffect(() => {
    loadBadge();
    const t = setInterval(loadBadge, 30000);
    return () => clearInterval(t);
  }, [loadBadge]);

  const openNotifications = async () => {
    if (notifOpen) { setNotifOpen(false); return; }
    try {
      const all: JdNotification[] = await jdApprovalAPI.listMine();
      setNotifItems(all.filter(r => (r.status === 'approved' || r.status === 'rejected') && !r.recruiter_seen));
    } catch { setNotifItems([]); }
    setNotifOpen(true);
  };

  const handleNotifClick = async (id: number) => {
    try { await jdApprovalAPI.markSeen(id); } catch { /* best-effort */ }
    setNotifOpen(false);
    setUnseenCount(c => Math.max(0, c - 1));
    navigate('/recruiter/jd-approval-requests');
  };

  const BellButton: React.FC<{ size: number }> = ({ size }) => (
    <div onClick={openNotifications} style={{ position: 'relative', cursor: 'pointer', display: 'flex' }}>
      <Bell size={size} style={{ color: unseenCount > 0 ? '#8B0000' : '#CBD5E1' }} />
      {unseenCount > 0 && (
        <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 14, height: 14, padding: '0 3px', borderRadius: 7, background: '#8B0000', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          {unseenCount > 9 ? '9+' : unseenCount}
        </span>
      )}
    </div>
  );

  const handleLogout = () => {
    if (!window.confirm('Sign out?')) return;
    localStorage.removeItem('recruiter_token');
    localStorage.removeItem('recruiter_user');
    navigate('/RecruiterLogin');
  };

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {NAV.map(({ path, icon: Icon, label, badge }, ni) => {
        const active = location.pathname === path || location.pathname.startsWith(path + '/');
        return (
          <Link
            key={path}
            to={path}
            onClick={onNav}
            className={active ? '' : 'nav-item rl-nav-link'}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '9px 12px', marginBottom: 2, borderRadius: 6,
              textDecoration: 'none', fontSize: 13,
              fontWeight: active ? 600 : 400,
              color: active ? '#8B0000' : '#64748B',
              background: active ? '#FDF2F2' : 'transparent',
              borderLeft: active ? '3px solid #8B0000' : '3px solid transparent',
              transition: 'all 120ms ease',
              animationDelay: `${ni * 0.04}s`,
            }}
          >
            <Icon size={15} className="nav-ico" style={{ color: active ? '#8B0000' : '#94A3B8', flexShrink: 0 }} />
            <span className="nav-lbl" style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                background: active ? '#8B0000' : '#F1F5F9',
                color: active ? '#fff' : '#64748B',
              }}>{badge}</span>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF', fontFamily: "'Inter', sans-serif" }}>
      <style>{CSS}</style>
      {notifOpen && <NotificationDropdown items={notifItems} onClose={() => setNotifOpen(false)} onItemClick={handleNotifClick} />}

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="rl-sidebar" style={{
        width: 232, minWidth: 232, background: '#FAFAFA',
        borderRight: '1px solid #F0F0F0',
        flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
      }}>
        {/* Brand */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #F0F0F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Briefcase size={14} color="#fff" strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.3px', lineHeight: 1.2 }}>ASKOXY</div>
              <div style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 500, letterSpacing: '0.07em', textTransform: 'uppercase', marginTop: 1 }}>Recruiter Platform</div>
            </div>
            <div style={{ marginLeft: 'auto' }}><BellButton size={15} /></div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          <p style={{ fontSize: 9.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '6px 10px 8px', margin: 0 }}>Menu</p>
          <NavLinks />
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid #F0F0F0', padding: '10px 8px 12px' }}>
          <div onClick={() => setMenuOpen(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 2, background: menuOpen ? '#F5F5F5' : 'transparent', transition: 'background 120ms' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10.5, fontWeight: 700 }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Recruiter'}</div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || 'Recruiter'}</div>
            </div>
            <ChevronDown size={12} style={{ color: '#94A3B8', flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
          </div>
          {menuOpen && (
            <button onClick={handleLogout} className="sign-out" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12.5, color: '#64748B', fontFamily: 'inherit', transition: 'background 120ms, color 120ms' }}>
              <LogOut size={13} style={{ transition: 'color 120ms' }} />Sign out
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile Top Header ───────────────────────────── */}
      <header className="rl-mob-hdr" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 52, background: '#FFFFFF', borderBottom: '1px solid #F0F0F0',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
      }}>
        <button onClick={() => setDrawerOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#0F172A' }}>
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 5, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={11} color="#fff" strokeWidth={2.2} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>ASKOXY</span>
        </div>
        <BellButton size={18} />
      </header>

      {/* ── Mobile Drawer Overlay ────────────────────────── */}
      {drawerOpen && (
        <>
          <div className="rl-overlay" onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 60 }} />
          <aside className="rl-drawer" style={{
            position: 'fixed', top: 0, left: 0, bottom: 0, width: 260,
            background: '#FAFAFA', zIndex: 70,
            flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.12)',
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={13} color="#fff" strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>ASKOXY</div>
                  <div style={{ fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recruiter Platform</div>
                </div>
              </div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Nav */}
            <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
              <p style={{ fontSize: 9.5, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.09em', padding: '6px 10px 8px', margin: 0 }}>Menu</p>
              <NavLinks onNav={() => setDrawerOpen(false)} />
            </nav>

            {/* Drawer User */}
            <div style={{ borderTop: '1px solid #F0F0F0', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8B0000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || 'Recruiter'}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email || ''}</div>
                </div>
              </div>
              <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 6, border: 'none', background: '#FEF2F2', cursor: 'pointer', fontSize: 13, color: '#DC2626', fontFamily: 'inherit' }}>
                <LogOut size={14} />Sign out
              </button>
            </div>
          </aside>
        </>
      )}

      {/* ── Mobile Bottom Nav ────────────────────────────── */}
      <nav className="rl-bot-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: '#FFFFFF', borderTop: '1px solid #F0F0F0',
        height: 56, alignItems: 'center', justifyContent: 'space-around',
        padding: '0 4px',
      }}>
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path || location.pathname.startsWith(path + '/');
          return (
            <Link key={path} to={path} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', flex: 1, padding: '6px 0' }}>
              <Icon size={18} style={{ color: active ? '#8B0000' : '#94A3B8' }} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? '#8B0000' : '#94A3B8' }}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="rl-main" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#FFFFFF' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default RecruiterLayout;
