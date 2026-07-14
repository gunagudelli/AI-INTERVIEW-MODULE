import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { candidateApi } from './api';
import { Candidate, Attempt, RoundBreakdown, ProctoringSnapshot } from './types';
import { LoadingSpinner, ErrorState } from './components';
import BASE_URL from '../../Config';

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
  n >= 60 ? { accent: '#15803D', bg: '#F0FDF4', bar: '#22C55E', border: '#BBF7D0' } :
  n >= 40 ? { accent: '#B45309', bg: '#FFFBEB', bar: '#F59E0B', border: '#FDE68A' } :
            { accent: '#B91C1C', bg: '#FEF2F2', bar: '#EF4444', border: '#FECACA' };

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
    blue:    { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
    purple:  { background: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' },
    green:   { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' },
    default: { background: '#F8FAFC', color: '#475569', border: '1px solid #E2E8F0' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 5, whiteSpace: 'nowrap', ...styles[color],
    }}>{children}</span>
  );
};

const ScoreRing: React.FC<{ pct: string; size?: number }> = ({ pct, size = 56 }) => {
  const n = clamp(pct);
  const c = scoreColor(n);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c.bar} strokeWidth={6}
        strokeDasharray={`${(n/100)*circ} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: 13, fontWeight: 700, fill: c.accent, fontFamily: 'inherit' }}>
        {n}%
      </text>
    </svg>
  );
};

const ProgressBar: React.FC<{ pct: string }> = ({ pct }) => {
  const n = clamp(pct);
  const c = scoreColor(n);
  return (
    <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ width: `${n}%`, height: '100%', background: c.bar, borderRadius: 2, transition: 'width .5s ease' }} />
    </div>
  );
};

const ResultPill: React.FC<{ result: string }> = ({ result }) => {
  const s = result === 'Selected'
    ? { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' }
    : result === 'Not Selected'
    ? { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' }
    : { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    }}>
      {result || 'Pending'}
    </span>
  );
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } }
  .cd-page { animation: fadeUp .2s ease both }
  .acc-body { animation: fadeUp .12s ease both }
  .img-thumb { transition: transform .15s ease, box-shadow .15s ease; }
  .img-thumb:hover { transform: scale(1.05); box-shadow: 0 4px 12px rgba(0,0,0,.12); }
  .filter-chip { transition: background .1s, border-color .1s, color .1s; cursor: pointer; }
  .filter-chip:hover { border-color: #93C5FD !important; }
  .acc-row { transition: background .1s; }
  .acc-row:hover { background: #F1F5F9 !important; }
  .modal-close { transition: color .1s; }
  .modal-close:hover { color: #0F172A !important; }
  .back-btn { transition: background .1s, border-color .1s; }
  .back-btn:hover { background: #F1F5F9 !important; border-color: #CBD5E1 !important; }
`;

const avatarColors = ['#1E40AF', '#065F46', '#6B21A8', '#9A3412', '#1E3A5F'];
const getAvatarBg = (name?: string) => avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', margin: '0 0 10px' }}>
    {children}
  </p>
);

interface CandidateDetailProps {
  // When rendered as a tab inside AdminDashboard (so the sidebar stays visible),
  // the parent passes these directly instead of relying on route params/history —
  // falls back to the standalone /admin/candidate/:userId route's own params/back
  // navigation when omitted, so that route keeps working unchanged.
  userId?: string;
  onBack?: () => void;
}

export const CandidateDetail: React.FC<CandidateDetailProps> = ({ userId: userIdProp, onBack }) => {
  const { userId: userIdParam } = useParams<{ userId: string }>();
  const userId = userIdProp ?? userIdParam;
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
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
  const BASE = `${BASE_URL}/api/admin`;

  const examImages: ExamImage[] = (candidate as any).examImages || [];
  const copyPaste = examImages.filter(e => e.type === 'COPY_PASTE_VIOLATION' || e.violationType === 'COPY_PASTE');
  const photos = examImages.filter(e => e.type !== 'COPY_PASTE_VIOLATION' && e.violationType !== 'COPY_PASTE');
  const vioTypes = Array.from(new Set(photos.filter(e => e.violationType).map(e => e.violationType))) as string[];
  const filteredPhotos = examFilter === 'NONE' ? photos.filter(e => !e.violationType)
    : examFilter ? photos.filter(e => e.violationType === examFilter) : photos;

  const avatarBg = getAvatarBg(candidate.name);

  return (
    <div className="cd-page" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", fontSize: 14, color: '#0F172A', background: '#F1F5F9', minHeight: '100vh' }}>
      <style>{CSS}</style>

      {/* ── Top bar ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="back-btn" onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, color: '#374151', fontWeight: 500, fontFamily: 'inherit' }}>
          <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span style={{ fontSize: 12.5, color: '#94A3B8' }}>Candidates</span>
        <span style={{ color: '#CBD5E1' }}>›</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{candidate.name}</span>
      </div>

      {/* ── Profile hero banner ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
          {/* Left: identity */}
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: 12, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {candidate.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#0F172A', letterSpacing: '-0.02em' }}>{candidate.name}</h1>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                  {candidate.experience > 0 ? `${candidate.experience} yr${candidate.experience !== 1 ? 's' : ''} experience` : 'Fresher'}
                </span>
                <span style={{ color: '#E2E8F0' }}>·</span>
                <Tag color={candidate.isTechnical ? 'blue' : 'purple'}>{candidate.isTechnical ? 'Technical' : 'Non-Technical'}</Tag>
                {candidate.domains?.map((d, i) => <Tag key={i}>{d}</Tag>)}
              </div>
              {candidate.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {candidate.skills.map((sk, i) => <Tag key={i} color="blue">{sk}</Tag>)}
                </div>
              )}
            </div>
          </div>

          {/* Right: score + result + resume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {candidate.summary?.latestScore && candidate.summary.latestScore !== 'N/A' && (
              <div style={{ textAlign: 'center' }}>
                <ScoreRing pct={candidate.summary.latestScore} size={64} />
                <p style={{ margin: '4px 0 0', fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Latest Score</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <ResultPill result={candidate.summary?.bestResult || ''} />
              {candidate.resumeUrl && (
                <button onClick={() => setShowResume(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>
                  <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Resume
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 28px', display: 'flex', gap: 0 }}>
        {[
          { label: 'Total Attempts', value: String(candidate.summary?.totalAttempts ?? 0), accent: '#0F172A' },
          { label: 'Completed', value: String(candidate.summary?.completedAttempts ?? 0), accent: '#0F172A' },
          { label: 'Copy-Paste', value: String(copyPaste.length), accent: copyPaste.length > 0 ? '#C2410C' : '#94A3B8' },
        ].map((s, i, arr) => (
          <div key={s.label} style={{ flex: 1, padding: '16px 20px', borderRight: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
            <p style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 5px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.accent, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Left column: attempts ── */}
        <div>
          {(candidate.attempts?.length || 0) === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '48px 24px', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: 13, margin: 0 }}>No interview attempts recorded.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              {/* Attempt tabs */}
              {candidate.attempts.length > 1 && (
                <div style={{ display: 'flex', padding: '0 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', overflowX: 'auto' }}>
                  {candidate.attempts.map((a, i) => {
                    const active = selAttempt === i;
                    const n = clamp(a.overallScore);
                    const c = scoreColor(n);
                    return (
                      <button key={i} onClick={() => { setSelAttempt(i); setExpanded(new Set()); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontSize: 13, fontWeight: active ? 600 : 400, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: 'transparent', color: active ? '#0F172A' : '#64748B', borderBottom: `2px solid ${active ? '#1D4ED8' : 'transparent'}`, marginBottom: -1, fontFamily: 'inherit', transition: 'color .1s' }}>
                        Attempt {a.attemptNumber}
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 4, background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>{a.overallScore}%</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {attempt && (
                <div style={{ padding: '22px 24px' }}>
                  {/* Attempt meta */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: '#0F172A' }}>Attempt {attempt.attemptNumber}</h2>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
                        {new Date(attempt.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        <span style={{ margin: '0 6px', color: '#E2E8F0' }}>·</span>{attempt.status}
                        <span style={{ margin: '0 6px', color: '#E2E8F0' }}>·</span>{attempt.totalQuestions} questions
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <ScoreRing pct={attempt.overallScore} size={52} />
                      <ResultPill result={attempt.result} />
                    </div>
                  </div>

                  {/* Round cards */}
                  <SectionLabel>Round Breakdown</SectionLabel>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 24 }}>
                    {attempt.roundBreakdown.map(rb => {
                      const n = clamp(rb.percentage);
                      const c = scoreColor(n);
                      return (
                        <div key={rb.round} style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 9, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600, lineHeight: 1.4, maxWidth: '60%' }}>{rb.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c.accent, background: c.bg, padding: '1px 7px', borderRadius: 4, border: `1px solid ${c.border}` }}>{n}%</span>
                          </div>
                          <ProgressBar pct={rb.percentage} />
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: '7px 0 0' }}>{rb.scored} / {rb.maxScore} pts</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Q&A accordion */}
                  <SectionLabel>Questions & Feedback</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attempt.roundBreakdown.map((rb: RoundBreakdown) => {
                      const n = clamp(rb.percentage);
                      const c = scoreColor(n);
                      const open = expanded.has(rb.round);
                      return (
                        <div key={rb.round} style={{ border: '1px solid #E2E8F0', borderRadius: 9, overflow: 'hidden' }}>
                          <button className="acc-row" onClick={() => toggle(rb.round)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', background: open ? '#F8FAFC' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: open ? '1px solid #F1F5F9' : 'none', fontFamily: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ width: 24, height: 24, borderRadius: 6, background: '#F1F5F9', color: '#475569', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                R{rb.round}
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{rb.label}</span>
                              <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 4, fontWeight: 600, background: c.bg, color: c.accent, border: `1px solid ${c.border}` }}>
                                {n}% · {rb.scored}/{rb.maxScore}
                              </span>
                              <span style={{ fontSize: 11, color: '#94A3B8' }}>{rb.questionsAnswered} questions</span>
                            </div>
                            <svg width={13} height={13} fill="none" stroke="#94A3B8" viewBox="0 0 24 24"
                              style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {open && (
                            <div className="acc-body">
                              {rb.questions.map((q, idx) => {
                                const qs = parseFloat(q.score);
                                const qc = scoreColor(qs >= 7 ? 80 : qs >= 4 ? 50 : 20);
                                return (
                                  <div key={idx} style={{ padding: '18px 20px', borderBottom: idx < rb.questions.length - 1 ? '1px solid #F8FAFC' : 'none', background: '#fff' }}>
                                    {/* Q */}
                                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 5, background: '#EFF6FF', color: '#1D4ED8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                                      <p style={{ margin: 0, fontSize: 13.5, color: '#0F172A', fontWeight: 500, lineHeight: 1.7 }}>{renderMd(q.question)}</p>
                                    </div>
                                    {/* A */}
                                    <div style={{ marginLeft: 34, marginBottom: 12, background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 7, padding: '10px 14px' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Answer</p>
                                      <p style={{ margin: 0, fontSize: 13, color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{q.answer || '—'}</p>
                                    </div>
                                    {/* Score + feedback */}
                                    <div style={{ marginLeft: 34, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                      <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 5, background: qc.bg, color: qc.accent, border: `1px solid ${qc.border}`, whiteSpace: 'nowrap' }}>
                                        {q.score} / 10
                                      </span>
                                      <p style={{ margin: 0, fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{q.feedback}</p>
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
        </div>

        {/* ── Right column: proctoring sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Proctoring card */}
          {examImages.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>Proctoring</span>
                <button onClick={() => setShowImages(v => !v)}
                  style={{ padding: '4px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 6, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {showImages ? 'Hide' : 'View'}
                </button>
              </div>

              {/* Summary badges */}
              <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 6, background: '#F1F5F9', color: '#374151', border: '1px solid #E2E8F0', fontWeight: 500 }}>{photos.length} photos</span>
                {photos.filter(e => e.violationType).length > 0 &&
                  <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', fontWeight: 600 }}>
                    {photos.filter(e => e.violationType).length} violations
                  </span>
                }
                {copyPaste.length > 0 &&
                  <span style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 6, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA', fontWeight: 600 }}>
                    {copyPaste.length} copy-paste
                  </span>
                }
              </div>

              {showImages && (
                <div style={{ padding: '0 16px 16px' }}>
                  {/* Filter chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {[
                      { label: `All (${photos.length})`, val: null },
                      ...vioTypes.map(v => ({ label: `${v.replace(/_/g, ' ')} (${photos.filter(e => e.violationType === v).length})`, val: v })),
                      ...(photos.some(e => !e.violationType) ? [{ label: `Normal (${photos.filter(e => !e.violationType).length})`, val: 'NONE' }] : []),
                    ].map(f => {
                      const active = examFilter === f.val;
                      return (
                        <button key={String(f.val)} className="filter-chip"
                          onClick={() => setExamFilter(active ? null : f.val)}
                          style={{ padding: '2px 9px', fontSize: 11, fontWeight: 600, borderRadius: 20, fontFamily: 'inherit', border: `1px solid ${active ? '#1D4ED8' : '#E2E8F0'}`, background: active ? '#1D4ED8' : '#fff', color: active ? '#fff' : '#64748B' }}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 7 }}>
                    {filteredPhotos.map((img, i) => (
                      <button key={img.id} className="img-thumb" onClick={() => setExamLightbox(img)}
                        style={{ position: 'relative', borderRadius: 7, overflow: 'hidden', border: `2px solid ${img.violationType ? '#FECACA' : '#E2E8F0'}`, cursor: 'pointer', padding: 0, background: 'none', aspectRatio: '1' }}>
                        <img src={img.imageUrl} alt={`Exam ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23F1F5F9'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394A3B8' font-size='7'>No img</text></svg>`; }} />
                        {img.violationType && (
                          <div style={{ position: 'absolute', top: 2, right: 2, width: 12, height: 12, background: '#EF4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>!</span>
                          </div>
                        )}
                        {img.type === 'CANDIDATE_IMAGE' && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(29,78,216,.85)', padding: '2px 0', textAlign: 'center' }}>
                            <span style={{ color: '#fff', fontSize: 7, fontWeight: 700 }}>ID</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {copyPaste.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: 10.5, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>
                        Copy-Paste ({copyPaste.length})
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {copyPaste.map((v, i) => (
                          <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', borderRadius: 6, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C' }}>Violation #{i + 1}</span>
                            <span style={{ fontSize: 10.5, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
                              {new Date(v.capturedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attempt summary card (only if multiple attempts) */}
          {(candidate.attempts?.length || 0) > 1 && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>All Attempts</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidate.attempts.map((a, i) => {
                  const n = clamp(a.overallScore);
                  const c = scoreColor(n);
                  const active = selAttempt === i;
                  return (
                    <button key={i} onClick={() => { setSelAttempt(i); setExpanded(new Set()); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, border: `1px solid ${active ? '#BFDBFE' : '#F1F5F9'}`, background: active ? '#EFF6FF' : '#F8FAFC', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: active ? '#1D4ED8' : '#374151' }}>Attempt {a.attemptNumber}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>
                          {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.accent, background: c.bg, padding: '1px 8px', borderRadius: 4, border: `1px solid ${c.border}` }}>{a.overallScore}%</span>
                        <ResultPill result={a.result} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Resume Modal ── */}
      {showResume && (() => {
        const url = candidate.resumeUrl || '';
        const previewUrl = url?.match(/\.docx?$/i) ? `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true` : url;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setShowResume(false)}>
            <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', width: '92%', maxWidth: 900, height: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Resume — {candidate.name}</span>
                <button className="modal-close" onClick={() => setShowResume(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1, fontFamily: 'inherit' }}>×</button>
              </div>
              <iframe src={previewUrl} title="Resume" style={{ flex: 1, border: 'none', width: '100%' }} />
            </div>
          </div>
        );
      })()}

      {/* ── Exam Image Lightbox ── */}
      {examLightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setExamLightbox(null)}>
          <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', maxWidth: 340, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: examLightbox.violationType ? '#B91C1C' : '#0F172A' }}>
                  {examLightbox.violationType ? examLightbox.violationType.replace(/_/g, ' ') : examLightbox.type === 'CANDIDATE_IMAGE' ? 'Candidate ID Photo' : 'Exam Photo'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#94A3B8' }}>{new Date(examLightbox.capturedAt).toLocaleString('en-IN')}</p>
              </div>
              <button className="modal-close" onClick={() => setExamLightbox(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <img src={examLightbox.imageUrl} alt="Exam" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block', background: '#F8FAFC' }} />
            <div style={{ padding: '10px 18px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
                {examLightbox.sessionStatsId?.slice(0, 18)}…
              </span>
              <a href={examLightbox.imageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: '#1D4ED8', textDecoration: 'none', fontWeight: 600 }}>
                Open in new tab ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Proctoring Snapshot Lightbox ── */}
      {lightbox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setLightbox(null)}>
          <div style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', maxWidth: 340, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: lightbox.violationType ? '#B91C1C' : '#0F172A' }}>
                  {lightbox.violationType ? lightbox.violationType.replace(/_/g, ' ') : 'Normal snapshot'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11.5, color: '#94A3B8' }}>{new Date(lightbox.capturedAt).toLocaleString('en-IN')}</p>
              </div>
              <button className="modal-close" onClick={() => setLightbox(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <img src={lightbox.imageUrl.startsWith('http') ? lightbox.imageUrl : BASE + lightbox.imageUrl} alt="Snapshot" style={{ width: '100%', maxHeight: 380, objectFit: 'contain', display: 'block', background: '#F8FAFC' }} />
          </div>
        </div>
      )}
    </div>
  );
};