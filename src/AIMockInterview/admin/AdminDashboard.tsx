import React, { useState } from 'react';
import { AdminAttempts } from './AdminAttempts';
import { CandidatesList } from './CandidatesList';
import { AdminAnalytics } from './AdminAnalytics';
import { InterviewConfig } from './InterviewConfig';
import { SuperResumePool } from './SuperResumePool';
import { BulkResumePool } from './BulkResumePool';

type Tab = 'candidates' | 'attempts' | 'analytics' | 'round-settings' | 'super-resume-pool' | 'bulk-resume-pool';

const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'candidates',
    label: 'Candidates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'round-settings',
    label: 'Round Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'attempts',
    label: 'Attempt Management',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'super-resume-pool',
    label: 'Super Resume Pool',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: 'bulk-resume-pool',
    label: 'AI Bulk Pool',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

export const AdminDashboard: React.FC = () => {
  const [active, setActive] = useState<Tab>('candidates');

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <style>{`
        @keyframes adm-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes adm-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes adm-pulse-bar {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .adm-card {
          transition: box-shadow 0.18s, border-color 0.18s;
        }
        .adm-card:hover {
          box-shadow: 0 4px 18px rgba(79,70,229,0.07);
          border-color: #c7d2fe !important;
        }
        .adm-row-hover:hover td {
          background: #fafbff !important;
        }
        .adm-fadein {
          animation: adm-fadein 0.22s ease both;
        }
        .adm-nav-btn {
          transition: background 0.12s, color 0.12s, border-right-color 0.12s;
        }
        .adm-nav-btn:hover {
          background: #fff8ec !important;
          color: #c45500 !important;
        }
        .adm-shimmer-skel {
          background: linear-gradient(90deg, #eef0f3 25%, #f5f6f8 50%, #eef0f3 75%);
          background-size: 800px 100%;
          animation: adm-shimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
      `}</style>
      {/* ── Top Bar ── */}
      <header className="h-14 flex items-center px-6 gap-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #2d3748 0%, #3d4f6b 100%)' }}>
        <div className="flex items-center gap-3">
          <img
            src="/askoxy1.ico"
            alt="AskOxy"
            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', lineHeight: 1 }}>ASKOXY.AI</div>
            <div style={{ color: '#e94560', fontWeight: 600, fontSize: 10, letterSpacing: '0.12em', marginTop: 2 }}>SUPER ADMIN</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: '#e94560' }}>A</div>
          <span className="text-xs hidden md:block" style={{ color: '#a0aec0' }}>Admin</span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <aside style={{ width: 220, background: '#fff', borderRight: '1px solid #e5e7eb', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Navigation</p>
          </div>
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {NAV.map(item => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px', border: 'none', background: 'none',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500,
                  color: active === item.key ? '#c45500' : '#4b5563',
                  backgroundColor: active === item.key ? '#fff8ec' : 'transparent',
                  borderRight: active === item.key ? '2px solid #ff9900' : '2px solid transparent',
                  transition: 'all 0.12s',
                }}
              >
                <span style={{ color: active === item.key ? '#ff9900' : '#9ca3af', display: 'flex', flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>AI Interview Portal</p>
            <p style={{ fontSize: 10, color: '#d1d5db', margin: '2px 0 0' }}>v1.0</p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Breadcrumb */}
          <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '10px 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
              <span>Admin</span>
              <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span style={{ color: '#111827', fontWeight: 600 }}>
                {active === 'round-settings' ? 'Round Settings' : active === 'super-resume-pool' ? 'Super Resume Pool' : active === 'bulk-resume-pool' ? 'AI Bulk Resume Pool' : active.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
          </div>
          <div key={active} style={{ flex: 1, overflowY: 'auto' }} className="adm-fadein">

          {active === 'candidates' && <CandidatesList />}
          {active === 'round-settings' && <InterviewConfig />}
          {active === 'attempts' && <AdminAttempts />}
          {active === 'analytics' && <AdminAnalytics />}
          {active === 'super-resume-pool' && <SuperResumePool />}
          {active === 'bulk-resume-pool' && <BulkResumePool />}
          </div>
        </main>
      </div>
    </div>
  );
};
