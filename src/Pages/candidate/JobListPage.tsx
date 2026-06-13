import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import applicationAPI from '../../services/applicationAPI';

const JobListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    applicationAPI.getPublicJobs()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = (job: any) => {
    if (job.applyToken) {
      navigate(`/apply?token=${job.applyToken}`);
    } else {
      // fallback: encode jobId as token
      const token = btoa(`${job.id}:${Date.now()}`);
      navigate(`/apply?token=${token}&jobId=${job.id}`);
    }
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280', marginTop: 12 }}>Loading jobs...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Open Positions</h1>
          <p style={styles.subtitle}>{filtered.length} job{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
        <input
          style={styles.search}
          placeholder="Search jobs, skills, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Job Cards */}
      {filtered.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p style={{ color: '#6b7280' }}>No jobs found matching your search</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map(job => (
            <div key={job.id} style={styles.card}>
              <div style={styles.cardTop}>
                <div style={styles.jobIcon}>{job.title?.[0]?.toUpperCase() || '💼'}</div>
                <span style={{ ...styles.badge, background: job.status === 'active' ? '#dcfce7' : '#fee2e2', color: job.status === 'active' ? '#166534' : '#991b1b' }}>
                  {job.status || 'active'}
                </span>
              </div>

              <h2 style={styles.jobTitle}>{job.title}</h2>
              <p style={styles.jobDesc}>{job.description?.slice(0, 120)}{job.description?.length > 120 ? '...' : ''}</p>

              <div style={styles.meta}>
                {job.location && <span style={styles.metaItem}>📍 {job.location}</span>}
                {job.type && <span style={styles.metaItem}>💼 {job.type}</span>}
                {job.experience && <span style={styles.metaItem}>⏱ {job.experience}+ yrs</span>}
                {job.salary && <span style={styles.metaItem}>💰 {job.salary}</span>}
              </div>

              {job.skills?.length > 0 && (
                <div style={styles.skills}>
                  {job.skills.slice(0, 4).map((s: string, i: number) => (
                    <span key={i} style={styles.skill}>{s}</span>
                  ))}
                  {job.skills.length > 4 && <span style={styles.skill}>+{job.skills.length - 4}</span>}
                </div>
              )}

              <button style={styles.applyBtn} onClick={() => handleApply(job)}>
                Apply Now →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '32px 20px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' },
  spinner: { width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 },
  title: { fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  search: { padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, width: 280, outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 },
  card: { background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', gap: 12, transition: 'box-shadow 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  jobIcon: { width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18 },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  jobTitle: { fontSize: 18, fontWeight: 600, color: '#111827', margin: 0 },
  jobDesc: { fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, margin: 0 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  metaItem: { fontSize: 12.5, color: '#374151', background: '#f3f4f6', padding: '4px 10px', borderRadius: 6 },
  skills: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skill: { fontSize: 11.5, background: '#eff6ff', color: '#1e40af', padding: '3px 10px', borderRadius: 20, border: '1px solid #bfdbfe' },
  applyBtn: { marginTop: 'auto', padding: '11px 20px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  empty: { textAlign: 'center', padding: '80px 20px' },
};

export default JobListPage;
