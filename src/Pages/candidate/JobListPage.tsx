import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee } from 'lucide-react';
import applicationAPI from '../../services/applicationAPI';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }
  .jl-page { font-family: 'Inter', -apple-system, sans-serif; min-height: 100vh; background: #f5f6f8; }
  .jl-topbar { background: #1E293B; padding: 0 32px; height: 60px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 50; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .jl-body { max-width: 1200px; margin: 0 auto; padding: 28px 20px; }
  .jl-card { background: #fff; border-radius: 10px; border: 1px solid #e3e6eb; padding: 20px; display: flex; flex-direction: column; gap: 13px; box-shadow: 0 1px 2px rgba(16,24,40,.04); transition: border-color .15s, box-shadow .15s; cursor: pointer; animation: fadeUp .2s ease both; }
  .jl-card:hover { box-shadow: 0 4px 14px rgba(16,24,40,.08); border-color: #c7cdd6; }
  .jl-apply-btn { margin-top: auto; padding: 10px 18px; background: #2b3550; color: #fff; border: none; border-radius: 7px; cursor: pointer; font-weight: 600; font-size: 13.5px; font-family: inherit; transition: background .15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .jl-apply-btn:hover { background: #1e2433; }
  .jl-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
  .jl-searchbar { background: #fff; border: 1px solid #e3e6eb; border-radius: 12px; padding: 5px; display: flex; align-items: stretch; box-shadow: 0 1px 2px rgba(16,24,40,.04); flex: 1 1 480px; max-width: 520px; }
  .jl-search-field { position: relative; flex: 1; display: flex; align-items: center; gap: 9px; padding: 9px 14px; min-width: 0; }
  .jl-search-field svg { flex-shrink: 0; }
  .jl-search-field input { border: none; outline: none; font-size: 13.5px; width: 100%; background: transparent; font-family: inherit; color: #0f172a; }
  .jl-search-field input::placeholder { color: #94a3b8; }
  .jl-search-loc { flex: 0 0 200px; }
  .jl-search-divider { width: 1px; background: #e3e6eb; margin: 8px 0; flex-shrink: 0; }
  .jl-search-btn { background: #2b3550; color: #fff; border: none; border-radius: 8px; padding: 0 22px; font-weight: 600; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 7px; white-space: nowrap; transition: background .15s; font-family: inherit; flex-shrink: 0; }
  .jl-search-btn:hover { background: #1e2433; }
  .jl-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #475569; background: #f8fafc; padding: 3px 9px; border-radius: 6px; border: 1px solid #e2e8f0; }
  .jl-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 700px) {
    .jl-topbar { padding: 0 16px; }
    .jl-searchbar { flex-direction: column; padding: 10px; gap: 8px; max-width: 100%; flex-basis: 100%; }
    .jl-search-field { padding: 6px 14px; }
    .jl-search-loc { flex: 1; }
    .jl-search-divider { display: none; }
    .jl-search-btn { width: 100%; padding: 11px; justify-content: center; }
    .jl-grid { grid-template-columns: 1fr; }
  }
`;


const IconSearchPlain = ({ color = 'currentColor' }: { color?: string }) => (
  <svg width={14} height={14} fill="none" stroke={color} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconLocation = () => (
  <svg width={12} height={12} fill="none" stroke="#64748b" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconBriefcase = () => (
  <svg width={12} height={12} fill="none" stroke="#64748b" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-2 0h12a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
  </svg>
);

const IconClock = () => (
  <svg width={12} height={12} fill="none" stroke="#64748b" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconCurrency = () => <IndianRupee size={12} color="#64748b" />;

// Salaries are always in LPA (lakhs per annum) on this platform — make sure the
// label shows even if the recruiter typed just a plain range like "4-6".
const formatSalary = (salary: string) => /lpa|lakh|₹/i.test(salary) ? salary : `${salary} LPA`;

const IconArrowRight = () => (
  <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const IconEmpty = () => (
  <svg width={40} height={40} fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconUsers = () => (
  <svg width={12} height={12} fill="none" stroke="#64748b" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const JobListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    applicationAPI.getPublicJobs()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchesKeyword = !q ||
      j.title?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q) ||
      j.skills?.some((s: string) => s.toLowerCase().includes(q));
    const matchesLocation = !location || j.location?.toLowerCase().includes(location.toLowerCase());
    return matchesKeyword && matchesLocation;
  });

  const handleApply = (job: any) => {
    if (job.applyToken) {
      navigate(`/apply?token=${job.applyToken}`);
    } else {
      const token = btoa(`${job.id}:${Date.now()}`);
      navigate(`/apply?token=${token}&jobId=${job.id}`);
    }
  };

  return (
    <div className="jl-page">
      <style>{CSS}</style>

      {/* ── Top Bar ── */}
      <header className="jl-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '0.03em', lineHeight: 1 }}>ASKOXY.AI</div>
            <div style={{ color: '#8a93a6', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', marginTop: 2 }}>JOBS PORTAL</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: '#8a93a6', fontWeight: 500 }}>
          {jobs.length} open position{jobs.length !== 1 ? 's' : ''}
        </span>
      </header>

      <div className="jl-body">
        {/* ── Section header + search bar ── */}
        <div className="jl-header-row">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Open Positions</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Find your next opportunity — apply in minutes</p>
          </div>

          <div className="jl-searchbar">
            <div className="jl-search-field">
              <IconSearchPlain color="#94a3b8" />
              <input placeholder="Job title, skill, or keyword" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="jl-search-divider" />
            <div className="jl-search-field jl-search-loc">
              <IconLocation />
              <input placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <button className="jl-search-btn" onClick={() => { /* filtering is already live as you type */ }}>
              <IconSearchPlain />Search
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 2px 24px' }}>
          <span style={{ fontSize: 12.5, color: '#94a3b8' }}>
            {loading ? 'Loading…' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
          </span>
          {(search || location) && (
            <button onClick={() => { setSearch(''); setLocation(''); }} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12.5, color: '#64748b', fontFamily: 'inherit' }}>Clear filters</button>
          )}
        </div>

        {/* ── Loading ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #2b3550', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
            <p style={{ color: '#94a3b8', marginTop: 14, fontSize: 13 }}>Loading jobs…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '70px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e3e6eb' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}><IconEmpty /></div>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>No jobs found matching your search</p>
          </div>
        ) : (
          <div className="jl-grid">
            {filtered.map((job, idx) => (
              <div key={job.id} className="jl-card" style={{ animationDelay: `${Math.min(idx * 0.05, 0.4)}s` }} onClick={() => handleApply(job)}>

                {/* Card top */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: job.status === 'active' ? '#eafaf0' : '#fdecec',
                    color: job.status === 'active' ? '#0f7b3f' : '#9c2b2b',
                    border: `1px solid ${job.status === 'active' ? '#bce7cf' : '#f5c6c6'}`,
                  }}>
                    {job.status === 'active' ? 'Active' : job.status || 'Active'}
                  </span>
                </div>

                {/* Title + desc */}
                <div>
                  <h2 style={{ fontSize: 16.5, fontWeight: 700, color: '#0f172a', margin: '0 0 6px', lineHeight: 1.3 }}>{job.title}</h2>
                  <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
                    {job.description?.slice(0, 110)}{(job.description?.length || 0) > 110 ? '…' : ''}
                  </p>
                </div>

                {/* Meta chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {job.location && <span className="jl-chip"><IconLocation />{job.location}</span>}
                  {job.type && <span className="jl-chip"><IconBriefcase />{job.type}</span>}
                  {job.experience_years != null && <span className="jl-chip"><IconClock />{job.experience_years}+ yrs</span>}
                  {job.salary && <span className="jl-chip"><IconCurrency />{formatSalary(job.salary)}</span>}
                </div>

                {/* Vacancy / applications — kept visually distinct from the static
                    meta chips above since this is live recruiting status, not a fixed job attribute */}
                {(job.vacancies != null || job.total_applications != null) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {job.vacancies != null && (() => {
                      const remaining = Math.max(job.vacancies - (job.hired_count || 0), 0);
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, background: '#eff3fb', color: '#2b3550', padding: '3px 10px', borderRadius: 6, border: '1px solid #d3dcf0' }}>
                          <IconUsers />{remaining} position{remaining !== 1 ? 's' : ''}
                        </span>
                      );
                    })()}
                    {job.total_applications != null && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b', padding: '3px 10px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        {job.total_applications} applicant{job.total_applications !== 1 ? 's' : ''} so far
                      </span>
                    )}
                  </div>
                )}

                {/* Skills */}
                {job.skills?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {job.skills.slice(0, 4).map((s: string, i: number) => (
                      <span key={i} style={{ fontSize: 11.5, background: '#eff3fb', color: '#2b3550', padding: '2px 9px', borderRadius: 20, border: '1px solid #d3dcf0', fontWeight: 500 }}>{s}</span>
                    ))}
                    {job.skills.length > 4 && (
                      <span style={{ fontSize: 11.5, background: '#f8fafc', color: '#64748b', padding: '2px 9px', borderRadius: 20, border: '1px solid #e2e8f0' }}>+{job.skills.length - 4}</span>
                    )}
                  </div>
                )}

                <button className="jl-apply-btn" onClick={e => { e.stopPropagation(); handleApply(job); }}>
                  Apply Now <IconArrowRight />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListPage;