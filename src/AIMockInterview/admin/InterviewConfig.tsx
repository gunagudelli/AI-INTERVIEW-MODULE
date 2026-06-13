import React, { useState, useEffect } from 'react';
import { candidateApi } from './api';

interface RoundConfig {
  round: number;
  questions: number;
  time_limit: number;
  label: string;
}

const COLORS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'];

function fmt(s: number) {
  const m = Math.floor(s / 60), r = s % 60;
  if (!m) return `${s}s`;
  if (!r) return `${m}m`;
  return `${m}m ${r}s`;
}

function defaults(): RoundConfig[] {
  return [
    { round: 1, questions: 12, time_limit: 30,  label: 'Skill Check' },
    { round: 2, questions: 5,  time_limit: 120, label: 'Scenario Round' },
    { round: 3, questions: 3,  time_limit: 300, label: 'Coding Challenge' },
    { round: 4, questions: 8,  time_limit: 90,  label: 'Communication Round' },
    { round: 5, questions: 6,  time_limit: 120, label: 'HR Interview' },
  ];
}

export const InterviewConfig: React.FC = () => {
  const [rounds, setRounds]     = useState<RoundConfig[]>([]);
  const [original, setOriginal] = useState<RoundConfig[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => { load(); }, []);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await candidateApi.getInterviewConfig();
      const r = data.rounds?.length ? data.rounds : defaults();
      setRounds(r); setOriginal(JSON.parse(JSON.stringify(r)));
    } catch {
      const r = defaults();
      setRounds(r); setOriginal(JSON.parse(JSON.stringify(r)));
    } finally { setLoading(false); }
  };

  const save = async () => {
    setSaving(true);
    try {
      await candidateApi.updateInterviewConfig(rounds);
      setOriginal(JSON.parse(JSON.stringify(rounds)));
      showToast(true, 'Saved successfully');
    } catch { showToast(false, 'Failed to save'); }
    finally { setSaving(false); }
  };

  const set = (i: number, f: keyof RoundConfig, v: string | number) => {
    const n = [...rounds]; n[i] = { ...n[i], [f]: v }; setRounds(n);
  };

  const dirty = JSON.stringify(rounds) !== JSON.stringify(original);
  const totalQ = rounds.reduce((s, r) => s + r.questions, 0);
  const totalT = rounds.reduce((s, r) => s + r.questions * r.time_limit, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ width: 32, height: 32, border: '2.5px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 720, margin: '0 auto', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg) } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes rowIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        .ic-input:focus   { outline: none; border-color: #2563EB !important; }
        .ic-btn:hover     { opacity: .88; }
        .ic-row           { animation: rowIn 0.18s ease both; }
        input[type=number]::-webkit-inner-spin-button { opacity: .4; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-.4px' }}>
          Round Configuration
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          {rounds.length} rounds · {totalQ} questions · {fmt(totalT)} total
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 8, marginBottom: 20,
          background: toast.ok ? '#F0FDF4' : '#FFF1F2',
          border: `1px solid ${toast.ok ? '#BBF7D0' : '#FECDD3'}`,
          color: toast.ok ? '#15803D' : '#BE123C',
          fontSize: 13, fontWeight: 500, animation: 'fadeIn .2s ease',
        }}>
          {toast.ok ? 'Saved' : 'Error'} {toast.msg}
        </div>
      )}

      {/* Table header */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 110px 110px', gap: 12, padding: '0 16px 8px', alignItems: 'center' }}>
        {['', 'Round Name', 'Questions', 'Time / Q'].map((h, i) => (
          <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em', textAlign: i > 1 ? 'center' : 'left' }}>{h}</div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: '#E2E8F0', marginBottom: 8 }} />

      {/* Rows */}
      {rounds.map((cfg, idx) => {
        const color   = COLORS[idx] || '#2563EB';
        const changed = JSON.stringify(cfg) !== JSON.stringify(original[idx]);
        return (
          <div
            key={cfg.round}
            className="ic-row"
            style={{
              animationDelay: `${idx * 0.05}s`,
              display: 'grid', gridTemplateColumns: '32px 1fr 110px 110px',
              gap: 12, padding: '10px 16px', alignItems: 'center',
              borderRadius: 8, marginBottom: 4,
              background: changed ? '#FAFBFF' : 'transparent',
              border: `1px solid ${changed ? '#DBEAFE' : 'transparent'}`,
              transition: 'background .15s',
            }}
          >
            {/* Round number dot */}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {cfg.round}
            </div>

            {/* Label */}
            <input
              className="ic-input"
              value={cfg.label}
              onChange={e => set(idx, 'label', e.target.value)}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 6, padding: '7px 10px', fontSize: 13.5, fontWeight: 500, color: '#0F172A', background: '#fff', boxSizing: 'border-box' }}
            />

            {/* Questions stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <button className="ic-btn" onClick={() => set(idx, 'questions', Math.max(1, cfg.questions - 1))}
                style={{ width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 4, background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
              <input
                type="number" min={1} max={50}
                className="ic-input"
                value={cfg.questions}
                onChange={e => set(idx, 'questions', Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: 40, border: '1px solid #E2E8F0', borderRadius: 4, padding: '5px 4px', fontSize: 13, fontWeight: 600, color: '#0F172A', background: '#fff', textAlign: 'center' }}
              />
              <button className="ic-btn" onClick={() => set(idx, 'questions', Math.min(50, cfg.questions + 1))}
                style={{ width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 4, background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
            </div>

            {/* Time stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <button className="ic-btn" onClick={() => set(idx, 'time_limit', Math.max(10, cfg.time_limit - 15))}
                style={{ width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 4, background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>−</button>
              <div style={{ width: 44, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{fmt(cfg.time_limit)}</div>
              <button className="ic-btn" onClick={() => set(idx, 'time_limit', Math.min(600, cfg.time_limit + 15))}
                style={{ width: 24, height: 24, border: '1px solid #E2E8F0', borderRadius: 4, background: '#fff', color: '#475569', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
            </div>
          </div>
        );
      })}

      {/* Divider */}
      <div style={{ height: 1, background: '#E2E8F0', margin: '12px 0 20px' }} />

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="ic-btn"
          style={{
            padding: '9px 22px', borderRadius: 7, border: 'none',
            background: dirty && !saving ? '#2563EB' : '#E2E8F0',
            color: dirty && !saving ? '#fff' : '#94A3B8',
            fontSize: 13.5, fontWeight: 600,
            cursor: dirty && !saving ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 7, transition: 'background .15s',
          }}
        >
          {saving
            ? <><div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />Saving…</>
            : 'Save Changes'
          }
        </button>

        <button onClick={load} className="ic-btn"
          style={{ padding: '9px 16px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>
          Discard
        </button>

        {dirty && !saving && (
          <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
            Unsaved changes
          </span>
        )}
      </div>
    </div>
  );
};
