import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateApi } from './api';
import { Candidate, Attempt, RoundBreakdown, ProctoringSnapshot } from './types';
import { LoadingSpinner, ErrorState } from './components';

interface ExamImage {
  id: string;
  sessionStatsId: string;
  imageUrl: string;
  type: string;
  violationType: string | null;
  capturedAt: string;
}

const clamp = (v: string) => Math.min(parseFloat(v) || 0, 100);

const scoreColor = (n: number) =>
  n >= 60 ? { accent: '#16a34a', bg: '#f0fdf4', bar: '#22c55e', border: '#bbf7d0' } :
  n >= 40 ? { accent: '#d97706', bg: '#fffbeb', bar: '#f59e0b', border: '#fde68a' } :
            { accent: '#dc2626', bg: '#fef2f2', bar: '#ef4444', border: '#fecaca' };

const renderMd = (text: string): React.ReactNode[] =>
  text.split('\n').map((line, li) => {
    const parts: React.ReactNode[] = [];
    const re = /\*\*(.+?)\*\*/g;
    let last = 0, m;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) parts.push(line.slice(last, m.index));
      parts.push(<strong key={m.index}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < line.length) parts.push(line.slice(last));
    return <span key={li}>{parts}{li < text.split('\n').length - 1 && <br />}</span>;
  });

const Tag: React.FC<{ children: React.ReactNode; color?: 'blue' | 'purple' | 'green' | 'default' }> = ({ children, color = 'default' }) => {
  const styles = {
    blue:    { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    purple:  { background: '#faf5ff', color: '#7c3aed', border: '1px solid #ddd6fe' },
    green:   { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
    default: { background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 5, whiteSpace: 'nowrap', ...styles[color],
    }}>{children}</span>
  );
};

const ScoreRing: React.FC<{ pct: string; size?: number }> = ({ pct, size = 48 }) => {
  const n = clamp(pct);
  const c = scoreColor(n);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c.bar} strokeWidth={5}
        strokeDasharray={`${(n/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size < 50 ? 11 : 12, fontWeight: 700, fill: c.accent, fontFamily: 'inherit' }}>
        {n}%
      </text>
    </svg>
  );
};

const ProgressBar: React.FC<{ pct: string }> = ({ pct }) => {
  const n = clamp(pct);
  const c = scoreColor(n);
  return (
    <div style={{ height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ width: `${n}%`, height: '100%', background: c.bar, borderRadius: 2, transition: 'width .5s ease' }} />
    </div>
  );
};

const CSS = `
  @keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }
  .cd-page { animation: fadeUp .18s ease both }
  .cd-card { transition: border-color .15s }
  .cd-card:hover { border-color: #cbd5e1 !important }
  .acc-body { animation: fadeUp .1s ease both }
`;

export const CandidateDetail: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selAttempt, setSelAttempt] = useState(0);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [lightbox, setLightbox] = useState<ProctoringSnapshot | null>(null);
  const [examLightbox, setExamLightbox] = useState<ExamImage | null>(null);
  const [showImages, setShowImages] = useState(false);
  const [examFilter, setExamFilter] = useState<string | null>(null);
  const [showResume, setShowResume] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    candidateApi.getCandidateById(userId)
      .then(d => { setCandidate(d); setLoading(false); })
      .catch(() => { setError('Failed to load candidate'); setLoading(false); });
  }, [userId]);

  const toggle = (r: number) => {
    const s = new Set(expanded);
    s.has(r) ? s.delete(r) : s.add(r);
    setExpanded(s);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!candidate) return <ErrorState message="Candidate not found" />;

  const attempt: Attempt | undefined = candidate.attempts?.[selAttempt];
  const BASE = 'http://localhost:3000/api/admin';

  const examImages: ExamImage[] = (candidate as any).examImages || [];
  const copyPaste = examImages.filter(e => e.type === 'COPY_PASTE_VIOLATION' || e.violationType === 'COPY_PASTE');
  const photos = examImages.filter(e => e.type !== 'COPY_PASTE_VIOLATION' && e.violationType !== 'COPY_PASTE');
  const vioTypes = Array.from(new Set(photos.filter(e => e.violationType).map(e => e.violationType))) as string[];
  const filteredPhotos = examFilter === 'NONE' ? photos.filter(e => !e.violationType) :
                         examFilter ? photos.filter(e => e.violationType === examFilter) : photos;

  return (
    <div className="cd-page" style={{ padding: '20px 24px', maxWidth: 980, margin: '0 auto', fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: 14, color: '#111827' }}>
      <style>{CSS}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#374151', fontWeight: 500 }}>
          <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        <span style={{ color: '#cbd5e1' }}>›</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>Candidates</span>
        <span style={{ color: '#cbd5e1' }}>›</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{candidate.name}</span>
      </div>

      {/* Profile Header */}
      <div className="cd-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {candidate.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>{candidate.name}</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{candidate.experience > 0 ? `${candidate.experience} yrs` : 'Fresher'}</span>
              <span style={{ color: '#e2e8f0' }}>·</span>
              <Tag color={candidate.isTechnical ? 'blue' : 'purple'}>{candidate.isTechnical ? 'Technical' : 'Non-Technical'}</Tag>
              {candidate.domains?.map((d, i) => <Tag key={i}>{d}</Tag>)}
            </div>
            {candidate.skills?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {candidate.skills.map((sk, i) => <Tag key={i} color="blue">{sk}</Tag>)}
              </div>
            )}
          </div>
        </div>
        {((candidate as any).resumeUrl || candidate.resumePath) && (
          <button onClick={() => setShowResume(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            View Resume
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Attempts', value: String(candidate.summary?.totalAttempts ?? 0), ring: false },
          { label: 'Completed', value: String(candidate.summary?.completedAttempts ?? 0), ring: false },
          { label: 'Best Score', value: candidate.summary?.bestScore ?? 'N/A', ring: true },
          { label: 'Latest Score', value: candidate.summary?.latestScore ?? 'N/A', ring: true },
        ].map(s => (
          <div key={s.label} className="cd-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>{s.label}</p>
            {s.ring && s.value !== 'N/A'
              ? <div style={{ display: 'flex', justifyContent: 'center' }}><ScoreRing pct={s.value} size={50} /></div>
              : <p style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{s.value}</p>
            }
          </div>
        ))}
        <div className="cd-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>Result</p>
          {(() => {
            const r = candidate.summary?.bestResult || '';
            const s = r === 'Selected' ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' } :
                      r === 'Not Selected' ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' } :
                      { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
            return <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{r || 'N/A'}</span>;
          })()}
        </div>
      </div>

      {/* Exam Images */}
      {examImages.length > 0 && (
        <div className="cd-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', background: '#f8fafc', borderBottom: showImages ? '1px solid #f1f5f9' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Proctoring</span>
              <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>{photos.length} photos</span>
              {photos.filter(e => e.violationType).length > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{photos.filter(e => e.violationType).length} violations</span>}
              {copyPaste.length > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>{copyPaste.length} copy-paste</span>}
            </div>
            <button onClick={() => setShowImages(v => !v)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#374151', cursor: 'pointer' }}>
              {showImages ? 'Hide' : 'Show Images'}
            </button>
          </div>

          {showImages && (
            <div style={{ padding: 16 }}>
              {/* Filter tabs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {[{ label: `All (${photos.length})`, val: null }, ...vioTypes.map(v => ({ label: `${v.replace(/_/g,' ')} (${photos.filter(e=>e.violationType===v).length})`, val: v })), photos.some(e=>!e.violationType) ? { label: `Normal (${photos.filter(e=>!e.violationType).length})`, val: 'NONE' } : null].filter(Boolean).map((f: any) => (
                  <button key={String(f.val)} onClick={() => setExamFilter(examFilter === f.val ? null : f.val)}
                    style={{ padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 20, cursor: 'pointer', border: `1px solid ${examFilter === f.val ? '#667eea' : '#e2e8f0'}`, background: examFilter === f.val ? '#667eea' : '#fff', color: examFilter === f.val ? '#fff' : '#64748b' }}>
                    {f.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(70px,1fr))', gap: 8 }}>
                {filteredPhotos.map((img, i) => (
                  <button key={img.id} onClick={() => setExamLightbox(img)} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1.5px solid ${img.violationType ? '#fca5a5' : '#e2e8f0'}`, cursor: 'pointer', padding: 0, background: 'none', aspectRatio: '1', transition: 'transform .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                    <img src={img.imageUrl} alt={`Exam ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='70' height='70'><rect width='70' height='70' fill='%23f1f5f9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='8'>No img</text></svg>`; }} />
                    {img.violationType && <div style={{ position: 'absolute', top: 3, right: 3, width: 13, height: 13, background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>!</span></div>}
                    {img.type === 'CANDIDATE_IMAGE' && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(37,99,235,.8)', padding: '2px 0', textAlign: 'center' }}><span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>ID</span></div>}
                    {img.violationType && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(185,28,28,.8)', padding: '2px 3px', textAlign: 'center' }}><span style={{ color: '#fff', fontSize: 6, fontWeight: 600 }}>{img.violationType.replace(/_/g,' ')}</span></div>}
                  </button>
                ))}
              </div>

              {copyPaste.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Copy-Paste Violations ({copyPaste.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {copyPaste.map((v, i) => (
                      <div key={v.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: '#fff7ed', border: '1px solid #fed7aa', fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#c2410c' }}>#{i+1}</span>
                        <span style={{ color: '#94a3b8' }}>{new Date(v.capturedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Attempts */}
      {(candidate.attempts?.length || 0) === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ fontSize: 13, margin: 0 }}>No interview attempts found.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {/* Attempt tabs */}
          {candidate.attempts.length > 1 && (
            <div style={{ display: 'flex', gap: 2, padding: '10px 14px 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', overflowX: 'auto' }}>
              {candidate.attempts.map((a, i) => {
                const active = selAttempt === i;
                const n = clamp(a.overallScore);
                const c = scoreColor(n);
                return (
                  <button key={i} onClick={() => { setSelAttempt(i); setExpanded(new Set()); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', fontSize: 13, fontWeight: active ? 600 : 400, borderRadius: '7px 7px 0 0', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? '#fff' : 'transparent', color: active ? '#111827' : '#64748b', borderBottom: active ? '2px solid #667eea' : '2px solid transparent', marginBottom: -1 }}>
                    Attempt {a.attemptNumber}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>{a.overallScore}%</span>
                  </button>
                );
              })}
            </div>
          )}

          {attempt && (
            <div style={{ padding: 22 }}>
              {/* Attempt header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid #f1f5f9' }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>Attempt {attempt.attemptNumber}</h2>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                    {new Date(attempt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {attempt.status} · {attempt.totalQuestions} questions
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ScoreRing pct={attempt.overallScore} size={52} />
                  {(() => {
                    const r = attempt.result;
                    const s = r === 'Selected' ? { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' } :
                              r === 'Not Selected' ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' } :
                              { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
                    return <span style={{ fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{r}</span>;
                  })()}
                </div>
              </div>

              {/* Round cards */}
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#94a3b8', margin: '0 0 10px' }}>Round Breakdown</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 8, marginBottom: 20 }}>
                {attempt.roundBreakdown.map(rb => {
                  const n = clamp(rb.percentage);
                  const c = scoreColor(n);
                  return (
                    <div key={rb.round} style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 9, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.3, maxWidth: '65%' }}>{rb.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c.accent, background: c.bg, padding: '1px 6px', borderRadius: 4, border: `1px solid ${c.border}` }}>{n}%</span>
                      </div>
                      <ProgressBar pct={rb.percentage} />
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '5px 0 0' }}>{rb.scored}/{rb.maxScore} pts</p>
                    </div>
                  );
                })}
              </div>

              {/* Q&A accordion */}
              <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#94a3b8', margin: '0 0 8px' }}>Questions & Feedback</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attempt.roundBreakdown.map((rb: RoundBreakdown) => {
                  const n = clamp(rb.percentage);
                  const c = scoreColor(n);
                  const open = expanded.has(rb.round);
                  return (
                    <div key={rb.round} style={{ border: '1px solid #e2e8f0', borderRadius: 9, overflow: 'hidden' }}>
                      <button onClick={() => toggle(rb.round)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: open ? '#fffbf5' : '#f8fafc', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: open ? '1px solid #f1f5f9' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>R{rb.round}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{rb.label}</span>
                          <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, fontWeight: 600, background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>{n}% · {rb.scored}/{rb.maxScore}</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{rb.questionsAnswered} Q</span>
                        </div>
                        <svg width={13} height={13} fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {open && (
                        <div className="acc-body">
                          {rb.questions.map((q, idx) => {
                            const qs = parseFloat(q.score);
                            const qc = scoreColor(qs >= 7 ? 80 : qs >= 4 ? 50 : 20);
                            return (
                              <div key={idx} style={{ padding: '16px 18px', borderBottom: idx < rb.questions.length - 1 ? '1px solid #f8fafc' : 'none', background: '#fff' }}>
                                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                                  <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx+1}</span>
                                  <p style={{ margin: 0, fontSize: 13, color: '#111827', fontWeight: 500, lineHeight: 1.6 }}>{renderMd(q.question)}</p>
                                </div>
                                <div style={{ marginLeft: 30, marginBottom: 10, background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 6, padding: '9px 13px' }}>
                                  <p style={{ margin: '0 0 3px', fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em' }}>Answer</p>
                                  <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{q.answer || '—'}</p>
                                </div>
                                <div style={{ marginLeft: 30, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 4, background: qc.bg, color: qc.accent, border: `1px solid ${qc.border}`, whiteSpace: 'nowrap' }}>{q.score} / 10</span>
                                  <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.65 }}>{q.feedback}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resume Modal */}
      {showResume && (() => {
        const url = (candidate as any).resumeUrl || `${BASE}${candidate.resumePath}`;
        const previewUrl = url?.match(/\.docx?$/i) ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` : url;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setShowResume(false)}>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', width: '90%', maxWidth: 800, height: '88vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Resume — {candidate.name}</span>
                <button onClick={() => setShowResume(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
              </div>
              <iframe src={previewUrl} title="Resume" style={{ flex: 1, border: 'none', width: '100%' }} />
            </div>
          </div>
        );
      })()}

      {/* Exam Image Lightbox */}
      {examLightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setExamLightbox(null)}>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: examLightbox.violationType ? '#dc2626' : '#374151' }}>
                  {examLightbox.violationType ? `${examLightbox.violationType.replace(/_/g,' ')}` : examLightbox.type === 'CANDIDATE_IMAGE' ? 'Candidate ID Photo' : 'Exam Image'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{new Date(examLightbox.capturedAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setExamLightbox(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <img src={examLightbox.imageUrl} alt="Exam" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
            <div style={{ padding: '9px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>Session: {examLightbox.sessionStatsId?.slice(0,16)}…</span>
              <a href={examLightbox.imageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>Open ↗</a>
            </div>
          </div>
        </div>
      )}

      {/* Proctoring Lightbox */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setLightbox(null)}>
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: lightbox.violationType ? '#dc2626' : '#374151' }}>
                  {lightbox.violationType ? lightbox.violationType.replace(/_/g,' ') : 'Normal snapshot'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94a3b8' }}>{new Date(lightbox.capturedAt).toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setLightbox(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>
            </div>
            <img src={lightbox.imageUrl.startsWith('http') ? lightbox.imageUrl : BASE + lightbox.imageUrl} alt="Snapshot" style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};
