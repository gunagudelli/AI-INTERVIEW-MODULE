import React, { useState, useEffect } from 'react';
import { LoadingSpinner, ErrorState } from './components';
import { ResumeSuperPool } from './ResumeSuperPool';

interface AppStats {
  total: number; pending: number; screened: number;
  shortlisted: number; interview_sent: number; hired: number; rejected: number;
}
interface Job {
  id: string; title: string; status: string; createdAt: string;
  createdBy: { id: number; name: string; email: string };
  applications: AppStats;
}
interface Recruiter {
  id: number; name: string; email: string; company: string;
  totalJobs: number; activeJobs: number; totalApplications: number;
}
interface Overview {
  summary: { totalRecruiters: number; totalJobs: number; activeJobs: number; totalApplications: number };
  recruiters: Recruiter[];
  jobs: Job[];
}

const STATUS_PILL: Record<string, { color: string; bg: string; border: string }> = {
  active:   { color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  inactive: { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  closed:   { color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  draft:    { color: '#92400e', bg: '#fffbeb', border: '#fde68a' },
};

export const SuperResumePool: React.FC = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:3000/api/admin/overview');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  if (showAnalyze) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ResumeSuperPool adminMode onBack={() => setShowAnalyze(false)} />
      </div>
    );
  }

  const { summary, recruiters, jobs } = data;
  const filteredJobs = selectedRecruiterId
    ? jobs.filter(j => j.createdBy?.id === selectedRecruiterId)
    : jobs;
  const selectedRecruiter = recruiters.find(r => r.id === selectedRecruiterId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f6f8' }}>

      {/* Page header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '12px 24px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Super Resume Pool</p>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Recruiters, job descriptions and application pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAnalyze(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', background: '#3b82f6', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analyze Pool
          </button>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 12px', background: '#fff', color: '#374151',
            border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e7eb', flexShrink: 0 }}>
        {[
          { label: 'Recruiters', value: summary.totalRecruiters, color: '#3b82f6' },
          { label: 'Total JDs', value: summary.totalJobs, color: '#111827' },
          { label: 'Active JDs', value: summary.activeJobs, color: '#15803d' },
          { label: 'Applications', value: summary.totalApplications, color: '#d97706' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, padding: '10px 20px',
            borderRight: i < 3 ? '1px solid #f3f4f6' : 'none',
          }}>
            <p style={{ fontSize: 22, fontWeight: 600, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '3px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

        {/* Recruiters */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>Recruiters ({recruiters.length})</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Name', 'Email', 'Company', 'Total JDs', 'Active', 'Applications'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recruiters.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No recruiters found</td></tr>
                ) : recruiters.map((r, i) => (
                  <tr key={r.id}
                    onClick={() => setSelectedRecruiterId(selectedRecruiterId === r.id ? null : r.id)}
                    style={{
                      borderBottom: '1px solid #f9fafb',
                      background: selectedRecruiterId === r.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'background .1s',
                    }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: selectedRecruiterId === r.id ? '#3b82f6' : '#1e293b',
                          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 600, flexShrink: 0,
                        }}>{r.name?.charAt(0).toUpperCase() || '?'}</div>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.name || '—'}</span>
                          {selectedRecruiterId === r.id && (
                            <span style={{ fontSize: 10, color: '#3b82f6', marginLeft: 8 }}>showing jobs ↓</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>{r.email || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#6b7280' }}>{r.company || '—'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{r.totalJobs}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0' }}>{r.activeJobs}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>{r.totalApplications}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Jobs table */}
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: 0 }}>
              {selectedRecruiter
                ? `Jobs by ${selectedRecruiter.name} (${filteredJobs.length})`
                : `All Job Listings (${jobs.length})`}
            </p>
            {selectedRecruiterId && (
              <button onClick={() => setSelectedRecruiterId(null)} style={{
                fontSize: 11, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
                borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
              }}>Clear filter</button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Job Title', 'Status', 'Created By', 'Date', 'Total', 'Screened', 'Shortlisted', 'Sent', 'Hired', 'Rejected'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#9ca3af' }}>No jobs found</td></tr>
                ) : filteredJobs.map((j, i) => {
                  const a = j.applications;
                  const sp = STATUS_PILL[j.status] || STATUS_PILL.inactive;
                  return (
                    <tr key={j.id} style={{ borderBottom: '1px solid #f9fafb', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{j.title}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 4, color: sp.color, background: sp.bg, border: `1px solid ${sp.border}`, textTransform: 'capitalize' }}>{j.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#111827', margin: 0 }}>{j.createdBy?.name || '—'}</p>
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>{j.createdBy?.email || ''}</p>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{a.total}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#3b82f6' }}>{a.screened}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#d97706' }}>{a.shortlisted}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#8b5cf6' }}>{a.interview_sent}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500, color: '#15803d' }}>{a.hired}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#ef4444' }}>{a.rejected}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
