import React, { useState, useEffect, useMemo } from 'react';
import { candidateApi } from './api';
import { Candidate } from './types';
import { COLORS, RADIUS, SHADOW } from './adminTheme';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

type RangeKey = 'today' | '7d' | '30d' | 'custom';

function startOfDay(d: Date) { const n = new Date(d); n.setHours(0, 0, 0, 0); return n; }
function endOfDay(d: Date) { const n = new Date(d); n.setHours(23, 59, 59, 999); return n; }
function addDays(d: Date, n: number) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

function getRangeBounds(range: RangeKey, customFrom: string, customTo: string) {
  const today = endOfDay(new Date());
  if (range === 'today') return { start: startOfDay(new Date()), end: today };
  if (range === '7d') return { start: startOfDay(addDays(today, -6)), end: today };
  if (range === '30d') return { start: startOfDay(addDays(today, -29)), end: today };
  const start = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(addDays(today, -6));
  const end = customTo ? endOfDay(new Date(customTo)) : today;
  return { start, end };
}

function inRange(iso: string | undefined, start: Date, end: Date) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function pct(part: number, whole: number) { return whole > 0 ? (part / whole) * 100 : 0; }

function computeKpis(cands: Candidate[]) {
  const total = cands.length;
  const completed = cands.filter(c => (c.completedAttempts ?? 0) > 0).length;
  const selected = cands.filter(c => c.examStatus === 'selected').length;
  const flagged = cands.filter(c => (c.copyPasteViolations ?? 0) > 0).length;
  const scores = cands.map(c => parseFloat(c.bestScore || '0')).filter(n => !isNaN(n) && n > 0);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return { total, completionRate: pct(completed, total), avgScore, selectionRate: pct(selected, total), flagged };
}

function deltaOf(curr: number, prev: number): { text: string; positive: boolean } | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return { text: 'new', positive: true };
  const diff = ((curr - prev) / prev) * 100;
  if (Math.abs(diff) < 0.5) return { text: '±0%', positive: true };
  return { text: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`, positive: diff > 0 };
}

function computeTrend(cands: Candidate[], start: Date, end: Date) {
  const days: { date: string; label: string; Started: number; Selected: number }[] = [];
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      Started: 0, Selected: 0,
    });
  }
  const byDay = new Map(days.map(d => [d.date, d]));
  cands.forEach(c => {
    if (!c.createdAt) return;
    const row = byDay.get(c.createdAt.slice(0, 10));
    if (!row) return;
    row.Started += 1;
    if (c.examStatus === 'selected') row.Selected += 1;
  });
  return days;
}

function computeFunnel(cands: Candidate[]) {
  const total = cands.length;
  const reachedCoding = cands.filter(c => (c.maxRound ?? 0) >= 3).length;
  const completedAll = cands.filter(c => (c.completedAttempts ?? 0) > 0).length;
  const selected = cands.filter(c => c.examStatus === 'selected').length;
  return [
    { label: 'Started', value: total, color: COLORS.brand },
    { label: 'Reached Coding Round', value: reachedCoding, color: '#7C3AED' },
    { label: 'Completed All Rounds', value: completedAll, color: COLORS.warningDark },
    { label: 'Selected', value: selected, color: COLORS.successDark },
  ];
}

function computeHistogram(cands: Candidate[]) {
  const buckets = [
    { label: '0-40%', min: 0, max: 40, count: 0 },
    { label: '40-60%', min: 40, max: 60, count: 0 },
    { label: '60-80%', min: 60, max: 80, count: 0 },
    { label: '80-100%', min: 80, max: 100.01, count: 0 },
  ];
  cands.forEach(c => {
    const s = parseFloat(c.bestScore || '0');
    if (!s) return;
    const b = buckets.find(b => s >= b.min && s < b.max);
    if (b) b.count += 1;
  });
  return buckets;
}

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' },
];

export const AdminAnalytics: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    candidateApi.getCandidates().then(setCandidates).catch(() => setCandidates([])).finally(() => setLoading(false));
  }, []);

  const { start, end } = useMemo(() => getRangeBounds(range, customFrom, customTo), [range, customFrom, customTo]);

  const inWindow = useMemo(() => candidates.filter(c => inRange(c.createdAt, start, end)), [candidates, start, end]);

  const previous = useMemo(() => {
    const spanMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - spanMs);
    return candidates.filter(c => inRange(c.createdAt, prevStart, prevEnd));
  }, [candidates, start, end]);

  const kpis = useMemo(() => computeKpis(inWindow), [inWindow]);
  const prevKpis = useMemo(() => computeKpis(previous), [previous]);
  const trend = useMemo(() => computeTrend(inWindow, start, end), [inWindow, start, end]);
  const funnel = useMemo(() => computeFunnel(inWindow), [inWindow]);
  const histogram = useMemo(() => computeHistogram(inWindow), [inWindow]);

  const KPI_CARDS = [
    { label: 'Total Candidates', value: String(kpis.total), delta: deltaOf(kpis.total, prevKpis.total), accent: COLORS.brand },
    { label: 'Completion Rate', value: `${kpis.completionRate.toFixed(0)}%`, delta: deltaOf(kpis.completionRate, prevKpis.completionRate), accent: COLORS.warningDark },
    { label: 'Avg Score', value: `${kpis.avgScore.toFixed(1)}%`, delta: deltaOf(kpis.avgScore, prevKpis.avgScore), accent: '#7C3AED' },
    { label: 'Selection Rate', value: `${kpis.selectionRate.toFixed(0)}%`, delta: deltaOf(kpis.selectionRate, prevKpis.selectionRate), accent: COLORS.successDark },
    { label: 'Copy-Paste Flags', value: String(kpis.flagged), delta: deltaOf(kpis.flagged, prevKpis.flagged), accent: COLORS.dangerDark, inverse: true },
  ];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: `2.5px solid ${COLORS.brand}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'an-spin .7s linear infinite' }} />
      <style>{`@keyframes an-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes an-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .an-card{animation:an-in .2s ease both;transition:box-shadow .15s,border-color .15s}
        .an-range-btn{transition:background .12s,color .12s}
      `}</style>

      {/* Header + range selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 3px' }}>Analytics</h1>
          <p style={{ fontSize: 12.5, color: COLORS.textMuted, margin: 0 }}>Interview performance overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: COLORS.neutralTint, borderRadius: RADIUS.sm, padding: 3, gap: 2 }}>
            {RANGE_OPTIONS.map(o => (
              <button key={o.key} className="an-range-btn" onClick={() => setRange(o.key)}
                style={{
                  padding: '6px 12px', border: 'none', borderRadius: RADIUS.sm - 2, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: range === o.key ? '#fff' : 'transparent',
                  color: range === o.key ? COLORS.brand : COLORS.textSecondary,
                  boxShadow: range === o.key ? SHADOW.sm : 'none',
                }}>
                {o.label}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ padding: '6px 8px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 12.5 }} />
              <span style={{ color: COLORS.textMuted, fontSize: 12 }}>to</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ padding: '6px 8px', border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 12.5 }} />
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
        {KPI_CARDS.map((s, i) => (
          <div key={s.label} className="an-card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.sm, padding: '14px 16px', animationDelay: `${i * 0.05}s` }}>
            <p style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{s.label}</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.accent, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
              {s.delta && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: (s.inverse ? !s.delta.positive : s.delta.positive) ? COLORS.successDark : COLORS.dangerDark,
                }}>
                  {s.delta.text}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="an-card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.sm, padding: '18px 20px', marginBottom: 16 }}>
        <h3 style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 14px' }}>Candidates Started vs Selected</h3>
        {trend.length <= 1 ? (
          <p style={{ fontSize: 12.5, color: COLORS.textMuted, margin: 0, padding: '30px 0', textAlign: 'center' }}>Select a wider range to see a trend.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="anStarted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.brand} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.brand} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="anSelected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.success} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="Started" stroke={COLORS.brand} fill="url(#anStarted)" strokeWidth={2} />
              <Area type="monotone" dataKey="Selected" stroke={COLORS.success} fill="url(#anSelected)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Funnel + histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Funnel */}
        <div className="an-card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.sm, padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 14px' }}>Interview Funnel</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {funnel.map(stage => {
              const width = pct(stage.value, funnel[0].value || 1);
              return (
                <div key={stage.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: COLORS.textSecondary, fontWeight: 500 }}>{stage.label}</span>
                    <span style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{stage.value}</span>
                  </div>
                  <div style={{ height: 8, background: COLORS.neutralTint, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: stage.color, borderRadius: 4, transition: 'width .4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Score histogram */}
        <div className="an-card" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.sm, padding: '18px 20px' }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 14px' }}>Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histogram} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderSoft} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: COLORS.textMuted }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
              <Bar dataKey="count" name="Candidates" fill={COLORS.brand} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
