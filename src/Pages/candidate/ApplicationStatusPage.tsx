import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import applicationAPI from '../../services/applicationAPI';

const ELIGIBILITY_CONFIG: Record<string, { label: string; color: string; bg: string; min: number }> = {
  excellent: { label: 'Excellent Match', color: '#166534', bg: '#dcfce7', min: 90 },
  strong:    { label: 'Strong Match',    color: '#1e40af', bg: '#dbeafe', min: 80 },
  good:      { label: 'Good Match',      color: '#92400e', bg: '#fef3c7', min: 70 },
  not_eligible: { label: 'Not Eligible', color: '#991b1b', bg: '#fee2e2', min: 0 },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  pending:     { color: '#92400e', bg: '#fef3c7' },
  reviewing:   { color: '#1e40af', bg: '#dbeafe' },
  shortlisted: { color: '#166534', bg: '#dcfce7' },
  rejected:    { color: '#991b1b', bg: '#fee2e2' },
  hired:       { color: '#166534', bg: '#bbf7d0' },
};

const ApplicationStatusPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    applicationAPI.getById(id)
      .then(setApp)
      .catch(() => setError('Application not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: '#6b7280', marginTop: 12 }}>Loading application...</p>
    </div>
  );

  if (error || !app) return (
    <div style={styles.center}>
      <div style={{ fontSize: 48 }}>😕</div>
      <p style={{ color: '#6b7280', marginTop: 12 }}>{error || 'Application not found'}</p>
      <button style={styles.btnPrimary} onClick={() => navigate('/jobs')}>Browse Jobs</button>
    </div>
  );

  const score = Number(app.matchScore ?? app.match_score ?? 0);
  const eligibility = score >= 90 ? 'excellent' : score >= 80 ? 'strong' : score >= 70 ? 'good' : 'not_eligible';
  const status = app.status || 'pending';
  const elig = ELIGIBILITY_CONFIG[eligibility] || ELIGIBILITY_CONFIG.not_eligible;
  const stat = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/jobs')}>← Browse Jobs</button>

      <div style={styles.card}>
        <h1 style={styles.title}>Application Status</h1>

        {/* Candidate Info */}
        <div style={styles.infoRow}>
          <div style={styles.avatar}>{app.name?.[0]?.toUpperCase() || 'C'}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 18, color: '#111827' }}>{app.name}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{app.email} · {app.phone}</div>
          </div>
          <span style={{ ...styles.badge, color: stat.color, background: stat.bg, marginLeft: 'auto' }}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div style={styles.divider} />

        {/* Score + Eligibility */}
        <div style={styles.scoreSection}>
          {/* Circular Score */}
          <div style={styles.scoreWrap}>
            <svg width={120} height={120} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
              <circle cx="50" cy="50" r="45" fill="none"
                stroke={score >= 90 ? '#059669' : score >= 70 ? '#2563EB' : score >= 50 ? '#f59e0b' : '#dc2626'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
              <text x="50" y="46" textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{score}</text>
              <text x="50" y="62" textAnchor="middle" fontSize="10" fill="#6b7280">/ 100</text>
            </svg>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>AI Match Score</div>
            </div>
          </div>

          {/* Eligibility + Details */}
          <div style={{ flex: 1 }}>
            <span style={{ ...styles.badge, color: elig.color, background: elig.bg, fontSize: 14, padding: '6px 16px' }}>
              {elig.label}
            </span>

            <div style={styles.detailGrid}>
              {app.location && <Detail label="Location" value={app.location} />}
              {app.experienceYears && <Detail label="Experience" value={`${app.experienceYears} years`} />}
              {app.expectedSalary && <Detail label="Expected Salary" value={app.expectedSalary} />}
              {app.appliedAt && <Detail label="Applied" value={new Date(app.appliedAt).toLocaleDateString()} />}
            </div>
          </div>
        </div>

        {/* Score Bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Match Score</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: score >= 70 ? '#059669' : '#dc2626' }}>{score}%</span>
          </div>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: `${score}%`, background: score >= 90 ? '#059669' : score >= 70 ? '#2563EB' : score >= 50 ? '#f59e0b' : '#dc2626' }} />
          </div>
          <div style={styles.barLabels}>
            <span>0</span><span>Not Eligible</span><span>Good</span><span>Strong</span><span>Excellent</span>
          </div>
        </div>

        {app.resumeUrl && (
          <a href={app.resumeUrl} target="_blank" rel="noreferrer" style={styles.resumeLink}>
            View Uploaded Resume
          </a>
        )}

        {/* AI Summary */}
        {app.aiSummary && (
          <div style={styles.aiBox}>
            <div style={styles.aiDot} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>AI Screening Summary</div>
              <div style={{ fontSize: 13, color: '#1e3a8a', lineHeight: 1.6 }}>{app.aiSummary}</div>
            </div>
          </div>
        )}

        {/* Matched / Missing Skills */}
        {((app.matchedSkills?.length > 0) || (app.missingSkills?.length > 0)) && (
          <div style={styles.skillsRow}>
            {app.matchedSkills?.length > 0 && (
              <div style={styles.skillsBlock}>
                <div style={styles.skillsTitle}>Matched Skills</div>
                <div style={styles.skillsWrap}>
                  {app.matchedSkills.map((s: string) => (
                    <span key={s} style={styles.skillPillGreen}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {app.missingSkills?.length > 0 && (
              <div style={styles.skillsBlock}>
                <div style={styles.skillsTitle}>Skills to Improve</div>
                <div style={styles.skillsWrap}>
                  {app.missingSkills.map((s: string) => (
                    <span key={s} style={styles.skillPillRed}>{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{value}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 700, margin: '0 auto', padding: '32px 20px' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 },
  spinner: { width: 40, height: 40, border: '3px solid #e5e7eb', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  back: { background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 20 },
  card: { background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 24 },
  infoRow: { display: 'flex', alignItems: 'center', gap: 16 },
  avatar: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0 },
  badge: { padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  divider: { height: 1, background: '#f3f4f6', margin: '20px 0' },
  scoreSection: { display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' },
  scoreWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginTop: 16 },
  barBg: { height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, transition: 'width 1s ease' },
  barLabels: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#9ca3af', marginTop: 4 },
  resumeLink: { display: 'inline-block', marginTop: 20, color: '#4f46e5', fontSize: 14, textDecoration: 'none' },
  btnPrimary: { padding: '10px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 },
  aiBox: { display: 'flex', gap: 12, alignItems: 'flex-start', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 16px', marginTop: 20 },
  aiDot: { width: 8, height: 8, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 3, animation: 'pulse 1.4s ease-in-out infinite' },
  skillsRow: { display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' },
  skillsBlock: { flex: 1, minWidth: 200 },
  skillsTitle: { fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  skillsWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  skillPillGreen: { padding: '4px 10px', borderRadius: 20, background: '#dcfce7', color: '#166534', fontSize: 12, fontWeight: 500 },
  skillPillRed: { padding: '4px 10px', borderRadius: 20, background: '#fee2e2', color: '#991b1b', fontSize: 12, fontWeight: 500 },
};

export default ApplicationStatusPage;
