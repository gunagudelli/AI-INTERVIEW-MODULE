import React, { useState, useRef, useMemo, useCallback } from 'react';

const BASE = process.env.REACT_APP_RECRUITER_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

// ── Types ──────────────────────────────────────────────────────
interface BulkCandidate {
  id: string;
  candidateName: string;
  resumeFileName: string;
  resumeUrl?: string;
  bestMatchingJD: string;
  bestMatchingJDId: string;
  matchPct: number;
  skillsMatched: number;
  totalSkills: number;
  experienceMatched: string;
  status: 'Matched' | 'Partially Matched' | 'Not Matched';
  matchedSkills: string[];
  missingSkills: string[];
  aiExplanation: string;
  email?: string;
  phone?: string;
  experienceYears: number;
  isDuplicate?: boolean;
  alreadyAssigned?: boolean;
  dbStatus?: string;
}

interface BulkPoolResult {
  candidates: BulkCandidate[];
  totalProcessed: number;
  totalMatched: number;
  totalPartial: number;
  totalUnmatched: number;
  duplicatesFound: number;
}

type Phase = 'upload' | 'processing' | 'done' | 'error';

// ── Colors ─────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E5E7EB', borderLt: '#F1F5F9',
  text: '#0F172A', textSec: '#475569', dim: '#94A3B8',
  indigo: '#4F46E5', indigoBg: '#EEF2FF', indigoBd: '#C7D2FE',
  green: '#16A34A', greenBg: '#DCFCE7', greenBd: '#BBF7D0',
  amber: '#D97706', amberBg: '#FEF3C7', amberBd: '#FDE68A',
  red: '#DC2626', redBg: '#FEE2E2', redBd: '#FECACA',
  blue: '#2563EB', blueBg: '#DBEAFE', blueBd: '#BFDBFE',
};

const matchColor = (pct: number) => pct >= 80 ? C.green : pct >= 60 ? C.amber : C.red;
const matchBg    = (pct: number) => pct >= 80 ? C.greenBg : pct >= 60 ? C.amberBg : C.redBg;

const CSS = `
  @keyframes bp-spin { to { transform: rotate(360deg); } }
  @keyframes bp-in   { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  @keyframes bp-ping { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.2);opacity:0} }
  @keyframes bp-shimmer { 0%{background-position:-600px 0} 100%{background-position:600px 0} }
  .bp-row:hover td { background:#F9FAFB !important; }
  .bp-btn:hover { filter: brightness(0.93); }
  .bp-drop:hover { border-color: ${C.indigo} !important; background: ${C.indigoBg} !important; }
  .bp-sk { background: linear-gradient(90deg,#eef0f3 25%,#f5f6f8 50%,#eef0f3 75%); background-size:800px 100%; animation:bp-shimmer 1.4s ease-in-out infinite; border-radius:4px; }
`;

// ── Atoms ───────────────────────────────────────────────────────
const Spin = ({ s = 14, c = C.indigo }: { s?: number; c?: string }) => (
  <div style={{ width: s, height: s, border: `2px solid ${c}22`, borderTop: `2px solid ${c}`, borderRadius: '50%', animation: 'bp-spin .7s linear infinite', flexShrink: 0 }} />
);

const ScorePill = ({ pct }: { pct: number }) => (
  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: matchBg(pct), color: matchColor(pct) }}>
    {pct}%
  </span>
);

const StatusPill = ({ status }: { status: BulkCandidate['status'] }) => {
  const map: Record<string, [string, string]> = {
    'Matched':          [C.greenBg, C.green],
    'Partially Matched':[C.amberBg, C.amber],
    'Not Matched':      [C.redBg,   C.red],
  };
  const [bg, fg] = map[status] ?? [C.redBg, C.red];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: bg, color: fg, whiteSpace: 'nowrap' as const }}>
      {status}
    </span>
  );
};

// ── Upload Screen ───────────────────────────────────────────────
const UploadScreen = ({ onUpload, uploading }: { onUpload: (files: File[]) => void; uploading: boolean }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<File[]>([]);

  const accept = '.pdf,.doc,.docx';

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f =>
      f.name.match(/\.(pdf|doc|docx)$/i)
    );
    setSelected(valid);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 40, background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <style>{CSS}</style>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} fill="none" stroke="#fff" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>AI Bulk Resume Pool</h1>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff' }}>AI</span>
        </div>
        <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>
          Upload multiple resumes — AI extracts data & matches against all active JDs automatically
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className="bp-drop"
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          width: '100%', maxWidth: 520, padding: '36px 24px', borderRadius: 12,
          border: `2px dashed ${dragging ? C.indigo : C.border}`,
          background: dragging ? C.indigoBg : C.card,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          cursor: 'pointer', transition: 'all .15s', marginBottom: 16,
        }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 12, background: C.indigoBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={24} height={24} fill="none" stroke={C.indigo} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: '0 0 4px' }}>
            {selected.length > 0 ? `${selected.length} resume${selected.length > 1 ? 's' : ''} selected` : 'Drop resumes here or click to browse'}
          </p>
          <p style={{ fontSize: 11, color: C.dim, margin: 0 }}>PDF, DOC, DOCX — select multiple files at once</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Selected file list preview */}
      {selected.length > 0 && (
        <div style={{ width: '100%', maxWidth: 520, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 16, maxHeight: 160, overflowY: 'auto' }}>
          {selected.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', borderBottom: i < selected.length - 1 ? `1px solid ${C.borderLt}` : 'none' }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: C.greenBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width={10} height={10} fill="none" stroke={C.green} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span style={{ fontSize: 12, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>{(f.size / 1024).toFixed(0)} KB</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <button
        disabled={selected.length === 0 || uploading}
        className="bp-btn"
        onClick={() => onUpload(selected)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 28px',
          background: selected.length === 0 ? '#E2E8F0' : 'linear-gradient(135deg,#4F46E5,#7C3AED)',
          color: selected.length === 0 ? C.dim : '#fff',
          border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: selected.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
        }}
      >
        {uploading ? <Spin s={13} c="#fff" /> : (
          <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
        {uploading ? 'Processing…' : `Analyze ${selected.length > 0 ? selected.length + ' Resumes' : 'Resumes'} with AI`}
      </button>

      {/* Info chips */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['AI skill extraction', 'JD auto-matching', 'Duplicate detection', 'Bulk actions'].map(t => (
          <span key={t} style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: C.indigoBg, color: C.indigo, border: `1px solid ${C.indigoBd}` }}>
            ✓ {t}
          </span>
        ))}
      </div>
    </div>
  );
};

// ── Processing Screen ───────────────────────────────────────────
const PS_STAGES = [
  { label: 'Reading',     text: 'Reading Resume...' },
  { label: 'Extracting',  text: 'Extracting Skills & Experience...' },
  { label: 'Analyzing',   text: 'Analyzing Candidate Profile...' },
  { label: 'Matching JD', text: 'Matching Against JDs...' },
  { label: 'Scoring',     text: 'Calculating Match Score...' },
  { label: 'Ranking',     text: 'Ranking Candidate...' },
];

const PS_JD_LIST = ['React Developer', 'ML Engineer', 'Backend Dev', 'Data Analyst'];

const PS_DEMO = [
  { name: 'Resume_1', matchedSkills: ['React','TypeScript','Node.js','Redux'],       missingSkills: ['GraphQL','Docker'], score: 84, jd: 'React Developer', exp: 4, status: 'Matched' },
  { name: 'Resume_2', matchedSkills: ['Python','TensorFlow','Pandas','SQL'],          missingSkills: ['Spark','K8s'],      score: 67, jd: 'ML Engineer',     exp: 2, status: 'Partially Matched' },
  { name: 'Resume_3', matchedSkills: ['Java','Spring Boot','PostgreSQL','Kafka'],     missingSkills: ['Go'],              score: 91, jd: 'Backend Dev',      exp: 6, status: 'Matched' },
];

function psCountUp(setter: React.Dispatch<React.SetStateAction<number>>, target: number, ms: number) {
  let v = 0; const step = target / (ms / 16);
  const id = setInterval(() => { v = Math.min(v + step, target); setter(Math.round(v)); if (v >= target) clearInterval(id); }, 16);
  return id;
}

const PS_CSS = `
  @keyframes ps-floatIn  { 0%{transform:translateY(-20px) scale(.9);opacity:0} 70%{transform:translateY(2px) scale(1.01)} 100%{transform:none;opacity:1} }
  @keyframes ps-scan     { 0%{top:-10%;} 100%{top:110%;} }
  @keyframes ps-flowDot  { 0%{left:0%;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{left:92%;opacity:0} }
  @keyframes ps-chipIn   { 0%{transform:scale(.7) translateY(4px);opacity:0} 100%{transform:none;opacity:1} }
  @keyframes ps-glow     { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} 50%{box-shadow:0 0 16px 4px rgba(34,197,94,.3)} }
  @keyframes ps-shine    { 0%{left:-40%} 100%{left:110%} }
  @keyframes ps-stageIn  { 0%{opacity:0;transform:translateX(12px)} 100%{opacity:1;transform:none} }
  @keyframes ps-orb-rot  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  @keyframes ps-orb-rrev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
  @keyframes ps-orb-pulse{ 0%,100%{box-shadow:0 0 0 2px #fde68a,0 4px 18px rgba(245,158,11,.28)} 50%{box-shadow:0 0 0 4px #fcd34d,0 6px 26px rgba(245,158,11,.48)} }
  @keyframes ps-ping-o   { 0%{transform:scale(1);opacity:.55} 100%{transform:scale(2.1);opacity:0} }
`;

const ProcessingScreen = ({ total, done, fileNames }: { total: number; done: number; fileNames: string[]; currentStage: string }) => {
  const pct = total > 0 ? Math.min(99, Math.round((done / total) * 100)) : 0;
  const stopRef = React.useRef(false);

  const [activeStage,   setActiveStage]   = React.useState(-1);
  const [doneStages,    setDoneStages]    = React.useState<number[]>([]);
  const [stageText,     setStageText]     = React.useState('Initializing AI...');
  const [matchedSkills, setMatchedSkills] = React.useState<string[]>([]);
  const [missingSkills, setMissingSkills] = React.useState<string[]>([]);
  const [score,         setScore]         = React.useState<number | null>(null);
  const [scoreDisp,     setScoreDisp]     = React.useState(0);
  const [bestJD,        setBestJD]        = React.useState('Analyzing...');
  const [expYears,      setExpYears]      = React.useState<number | null>(null);
  const [statusLabel,   setStatusLabel]   = React.useState('—');
  const [matchedJDs,    setMatchedJDs]    = React.useState<number[]>([]);
  const [cardGlow,      setCardGlow]      = React.useState(false);
  const [visibleCards,  setVisibleCards]  = React.useState<number[]>([]);
  const [activeCard,    setActiveCard]    = React.useState(-1);
  const [scanCard,      setScanCard]      = React.useState(-1);

  const displayNames = fileNames.slice(0, 3).map(n => n.replace(/\.[^.]+$/, ''));

  const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

  React.useEffect(() => {
    stopRef.current = false;
    async function runDemo(ci: number) {
      if (stopRef.current) return;
      const c = PS_DEMO[ci % PS_DEMO.length];
      setActiveStage(-1); setDoneStages([]); setMatchedSkills([]); setMissingSkills([]);
      setScore(null); setScoreDisp(0); setBestJD('Analyzing...'); setExpYears(null);
      setStatusLabel('—'); setCardGlow(false);
      const ri = ci % 3;
      setVisibleCards(p => Array.from(new Set([...p, ri])));
      setActiveCard(ri); setScanCard(ri);
      await sleep(400);
      for (let s = 0; s < PS_STAGES.length; s++) {
        if (stopRef.current) return;
        setStageText(PS_STAGES[s].text); setActiveStage(s);
        if (s > 0) setDoneStages(p => [...p, s - 1]);
        if (s === 1) {
          for (const sk of c.matchedSkills) { if (stopRef.current) return; await sleep(150); setMatchedSkills(p => [...p, sk]); }
          for (const sk of c.missingSkills) { if (stopRef.current) return; await sleep(180); setMissingSkills(p => [...p, sk]); }
          await sleep(200);
        } else if (s === 3) {
          const ji = PS_JD_LIST.indexOf(c.jd); if (ji >= 0) setMatchedJDs(p => Array.from(new Set([...p, ji])));
          setBestJD(c.jd); await sleep(600);
        } else if (s === 4) {
          setScore(c.score); setExpYears(c.exp); psCountUp(setScoreDisp, c.score, 900); await sleep(1000);
        } else if (s === 5) {
          setStatusLabel(c.status); setCardGlow(true); await sleep(600);
        } else { await sleep(600); }
      }
      setDoneStages(p => [...p, 5]); setStageText(`${c.name} processed!`); setScanCard(-1);
      await sleep(1200);
    }
    async function loop() {
      let ci = 0;
      while (!stopRef.current) {
        await runDemo(ci);
        ci++;
        if (ci % 3 === 0) { setVisibleCards([]); setActiveCard(-1); setMatchedJDs([]); await sleep(500); }
      }
    }
    loop();
    return () => { stopRef.current = true; };
  }, []);

  const scoreColor = score === null ? '#4f46e5' : score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%', background: 'linear-gradient(135deg,#fff7ed 0%,#fff3e0 50%,#fef9f0 100%)', padding: '20px 16px', gap: 14, fontFamily: "'Inter',-apple-system,sans-serif", overflowY: 'auto' }}>
      <style>{`${CSS}${PS_CSS}`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#92400e', margin: '0 0 3px' }}>AI Analyzing Resumes</p>
        <p style={{ fontSize: 11, color: '#b45309', margin: 0 }}>
          <span style={{ color: '#d97706', fontWeight: 600 }}>{done}</span> of <span style={{ color: '#d97706', fontWeight: 600 }}>{total > 0 ? total : '—'}</span> processed
        </p>
      </div>

      {/* Pipeline row: Resume cards → AI Engine → JD panel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', maxWidth: 560 }}>

        {/* Resume cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
          {[0, 1, 2].map(i => {
            const name    = displayNames[i] || PS_DEMO[i].name;
            const visible = visibleCards.includes(i);
            const active  = activeCard === i;
            const scanning = scanCard === i;
            return (
              <div key={i} style={{
                width: 88, background: active ? '#fffbeb' : '#fff7ed',
                border: `1px solid ${active ? '#f59e0b' : '#fde68a'}`,
                borderRadius: 7, padding: '6px 8px', position: 'relative', overflow: 'hidden',
                opacity: visible ? 1 : 0,
                animation: visible ? 'ps-floatIn .5s cubic-bezier(.34,1.4,.64,1) forwards' : 'none',
                transition: 'border-color .3s, background .3s',
              }}>
                {scanning && (
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#f59e0b,transparent)', top: 0, animation: 'ps-scan .9s ease-in-out infinite' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <svg width={9} height={9} fill="none" stroke={active ? '#d97706' : '#f59e0b'} viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span style={{ fontSize: 8, fontWeight: 600, color: active ? '#92400e' : '#b45309', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{name}</span>
                </div>
                {[80, 55, 90].map((w, li) => (
                  <div key={li} style={{ height: 3, borderRadius: 2, marginBottom: 2, background: scanning ? (li % 2 === 0 ? '#f59e0b' : '#fbbf24') : '#fde68a', width: `${w}%`, transition: 'background .3s' }} />
                ))}
              </div>
            );
          })}
        </div>

        {/* Flow arrow 1 */}
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#fde68a,#f59e0b,#fde68a)', borderRadius: 1, position: 'relative', overflow: 'visible', flexShrink: 0, minWidth: 20 }}>
          <div style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', top: -2.5, animation: 'ps-flowDot 1.8s ease-in-out infinite', boxShadow: '0 0 6px #d97706' }} />
        </div>

        {/* AI Engine orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            {/* rotating dashed outer ring */}
            <svg width={60} height={60} style={{ position: 'absolute', inset: 0, animation: 'ps-orb-rot 5s linear infinite' }}>
              <circle cx={30} cy={30} r={27} fill="none" stroke="#fcd34d" strokeWidth={1.5} strokeDasharray="6 5" strokeLinecap="round" opacity={0.7}/>
            </svg>
            {/* counter-rotating inner ring */}
            <svg width={60} height={60} style={{ position: 'absolute', inset: 0, animation: 'ps-orb-rrev 8s linear infinite' }}>
              <circle cx={30} cy={30} r={21} fill="none" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 9" strokeLinecap="round" opacity={0.45}/>
            </svg>
            {/* ping rings */}
            {[0, 1].map(i => (
              <div key={i} style={{ position: 'absolute', inset: -(i * 6 + 3), borderRadius: '50%', border: '1px solid #f59e0b', opacity: 0, animation: `ps-ping-o ${1.8 + i * 0.7}s ease-out infinite`, animationDelay: `${i * 0.65}s` }} />
            ))}
            {/* inner filled orb */}
            <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', background: 'linear-gradient(135deg,#fef3c7,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'ps-orb-pulse 2.2s ease-in-out infinite' }}>
              {/* scan line */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent)', animation: 'ps-scan 1.5s linear infinite' }} />
              </div>
              <svg width={18} height={18} fill="none" stroke="#92400e" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
          <span style={{ fontSize: 7, fontWeight: 700, color: '#d97706', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>AI Engine</span>
        </div>

        {/* Flow arrow 2 */}
        <div style={{ flex: 1, height: 2, background: 'linear-gradient(90deg,#fde68a,#f59e0b,#fde68a)', borderRadius: 1, position: 'relative', overflow: 'visible', flexShrink: 0, minWidth: 20 }}>
          <div style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', top: -2.5, animation: 'ps-flowDot 1.8s ease-in-out infinite', animationDelay: '.6s', boxShadow: '0 0 6px #d97706' }} />
        </div>

        {/* JD Panel */}
        <div style={{ width: 92, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px', flexShrink: 0 }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>Active JDs</div>
          {PS_JD_LIST.map((jd, i) => (
            <div key={i} style={{
              fontSize: 7, padding: '3px 5px', borderRadius: 4, marginBottom: 2,
              color:      matchedJDs.includes(i) ? '#065f46' : '#b45309',
              background: matchedJDs.includes(i) ? '#d1fae5' : 'transparent',
              border:     `1px solid ${matchedJDs.includes(i) ? '#6ee7b7' : 'transparent'}`,
              whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis',
              transition: 'all .3s',
            }}>{jd}</div>
          ))}
        </div>
      </div>

      {/* Stage text */}
      <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', textAlign: 'center', animation: 'ps-stageIn .3s ease', minHeight: 16 }}>
        {stageText}
      </div>

      {/* Stage tracker */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 560 }}>
        {PS_STAGES.map((st, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%', transition: 'all .3s',
                background:  doneStages.includes(i) ? '#16a34a' : activeStage === i ? '#f59e0b' : '#fde68a',
                border:      `1px solid ${doneStages.includes(i) ? '#15803d' : activeStage === i ? '#d97706' : '#fcd34d'}`,
                boxShadow:   activeStage === i ? '0 0 0 3px rgba(245,158,11,.25)' : 'none',
              }} />
              <span style={{ fontSize: 7, color: doneStages.includes(i) ? '#15803d' : activeStage === i ? '#d97706' : '#b45309', fontWeight: activeStage === i ? 700 : 400, transition: 'color .3s', textAlign: 'center' as const }}>{st.label}</span>
            </div>
            {i < PS_STAGES.length - 1 && (
              <div style={{ flex: 1, height: 1, background: doneStages.includes(i) ? '#16a34a' : '#fde68a', transition: 'background .3s', marginBottom: 12, minWidth: 4 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Skills row */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560 }}>
        {[
          { title: 'Matched Skills', chips: matchedSkills, bg: '#d1fae5', color: '#065f46', bd: '#6ee7b7' },
          { title: 'Missing Skills',  chips: missingSkills, bg: '#fee2e2', color: '#991b1b', bd: '#fca5a5' },
        ].map(({ title, chips, bg, color, bd }) => (
          <div key={title} style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', minHeight: 60 }}>
            <div style={{ fontSize: 7, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 5 }}>{title}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3 }}>
              {chips.map((sk, i) => (
                <span key={sk + i} style={{ fontSize: 8, fontWeight: 600, padding: '2px 6px', borderRadius: 8, background: bg, color, border: `1px solid ${bd}`, animation: 'ps-chipIn .3s cubic-bezier(.34,1.56,.64,1) forwards' }}>{sk}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Score / JD / Exp row */}
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 560 }}>
        <div style={{ flex: 1, background: '#fffbeb', borderRadius: 8, padding: '10px 12px', border: `1px solid ${cardGlow ? scoreColor : '#fde68a'}`, animation: cardGlow ? 'ps-glow 1.5s ease 2' : 'none', transition: 'border-color .3s' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>Match Score</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 5 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: score !== null ? scoreColor : '#92400e', transition: 'color .3s' }}>{score !== null ? scoreDisp : '--'}</span>
            <span style={{ fontSize: 9, color: '#b45309' }}>/100</span>
          </div>
          <div style={{ height: 4, background: '#fde68a', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: scoreColor, width: score !== null ? `${scoreDisp}%` : '0%', transition: 'width 1.2s ease, background .3s' }} />
          </div>
        </div>
        <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>Best JD Match</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', marginBottom: 3 }}>{bestJD}</div>
          <div style={{ fontSize: 8, color: statusLabel === 'Matched' ? '#15803d' : statusLabel === 'Partially Matched' ? '#d97706' : '#b45309' }}>{statusLabel}</div>
        </div>
        <div style={{ flex: 1, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 7, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>Experience</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#92400e', marginBottom: 2 }}>{expYears !== null ? expYears : '--'}</div>
          <div style={{ fontSize: 8, color: '#b45309' }}>years detected</div>
        </div>
      </div>

      {/* Real progress bar */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#b45309', marginBottom: 4 }}>
          <span>{done} of {total > 0 ? total : '—'} resumes</span>
          <span style={{ color: '#d97706', fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: '#fde68a', borderRadius: 3, overflow: 'hidden', border: '1px solid #fcd34d', position: 'relative' }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#f59e0b,#d97706,#b45309)', width: `${pct}%`, transition: 'width .6s ease', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, width: '35%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)', animation: 'ps-shine 1.4s ease-in-out infinite' }} />
          </div>
        </div>
      </div>

      <p style={{ fontSize: 9, color: '#d97706', margin: 0, letterSpacing: '0.05em' }}>Do not close this window</p>
    </div>
  );
};

// ── Results Table ───────────────────────────────────────────────
const ResultsTable = ({
  results, onAssign, onTalentPool, onReject, onNewUpload, busy,
}: {
  results: BulkPoolResult;
  onAssign: (c: BulkCandidate) => void;
  onTalentPool: (c: BulkCandidate) => void;
  onReject: (c: BulkCandidate) => void;
  onNewUpload: () => void;
  busy: string | null;
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPct, setFilterPct] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'matchPct' | 'name'>('matchPct');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkJD, setBulkJD] = useState('');

  const jdOptions = useMemo(() => {
    const jds = new Map<string, string>();
    results.candidates.forEach(c => { if (c.bestMatchingJDId) jds.set(c.bestMatchingJDId, c.bestMatchingJD); });
    return Array.from(jds.entries());
  }, [results.candidates]);

  const filtered = useMemo(() => {
    let list = [...results.candidates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.candidateName.toLowerCase().includes(q) ||
        c.resumeFileName.toLowerCase().includes(q) ||
        c.bestMatchingJD.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') list = list.filter(c => c.status === filterStatus);
    if (filterPct === '80') list = list.filter(c => c.matchPct >= 80);
    else if (filterPct === '70') list = list.filter(c => c.matchPct >= 70);
    else if (filterPct === '60') list = list.filter(c => c.matchPct >= 60);
    list.sort((a, b) => sortBy === 'matchPct' ? b.matchPct - a.matchPct : a.candidateName.localeCompare(b.candidateName));
    return list;
  }, [results.candidates, search, filterStatus, filterPct, sortBy]);

  const toggleBulk = (id: string) => setBulkSelected(p => {
    const n = new Set(p);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const selectAll = () => setBulkSelected(filtered.every(c => bulkSelected.has(c.id)) ? new Set() : new Set(filtered.map(c => c.id)));

  const [bulkAssigning, setBulkAssigning] = useState(false);

  const handleBulkAssign = useCallback(async () => {
    if (!bulkJD) return alert('Select a JD first');
    if (bulkAssigning) return;
    setBulkAssigning(true);
    const selected = filtered.filter(c => bulkSelected.has(c.id));
    for (const c of selected) {
      await onAssign({ ...c, bestMatchingJDId: bulkJD });
    }
    setBulkSelected(new Set());
    setBulkAssigning(false);
  }, [bulkJD, bulkSelected, filtered, onAssign, bulkAssigning]);

  const summaryCards = [
    { l: 'Processed',      v: results.totalProcessed,  c: C.indigo, bg: C.indigoBg },
    { l: 'Matched ≥80%',  v: results.totalMatched,    c: C.green,  bg: C.greenBg },
    { l: 'Partial 60-79%', v: results.totalPartial,    c: C.amber,  bg: C.amberBg },
    { l: 'Not Matched',    v: results.totalUnmatched,  c: C.red,    bg: C.redBg },
    { l: 'Already in DB',  v: results.duplicatesFound, c: C.textSec,bg: C.borderLt },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif", animation: 'bp-in .2s ease' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>AI Bulk Resume Pool</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: '#fff' }}>AI</span>
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{results.totalProcessed} resumes analyzed · auto-ranked by match score</div>
        </div>
        <button onClick={onNewUpload} className="bp-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: C.indigoBg, color: C.indigo, border: `1px solid ${C.indigoBd}`, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          <svg width={11} height={11} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Upload
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {summaryCards.map((s, i) => (
          <div key={i} style={{ flex: 1, padding: '9px 16px', borderRight: i < summaryCards.length - 1 ? `1px solid ${C.borderLt}` : 'none', background: s.bg }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 9, color: C.dim, marginTop: 3, fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '8px 20px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <svg width={10} height={10} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: C.dim, pointerEvents: 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidate, JD…"
            style={{ width: '100%', paddingLeft: 24, paddingRight: 8, paddingTop: 5, paddingBottom: 5, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, outline: 'none', color: C.text, background: C.card }} />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, color: C.textSec, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Status</option>
          <option value="Matched">Matched</option>
          <option value="Partially Matched">Partially Matched</option>
          <option value="Not Matched">Not Matched</option>
        </select>

        {/* Score filter */}
        <select value={filterPct} onChange={e => setFilterPct(e.target.value)}
          style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, color: C.textSec, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All Scores</option>
          <option value="80">80%+</option>
          <option value="70">70%+</option>
          <option value="60">60%+</option>
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          style={{ padding: '5px 8px', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, color: C.textSec, outline: 'none', cursor: 'pointer' }}>
          <option value="matchPct">Sort: Best Match</option>
          <option value="name">Sort: Name A-Z</option>
        </select>

        <span style={{ fontSize: 11, color: C.dim, marginLeft: 'auto' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bulk action bar */}
      {bulkSelected.size > 0 && (
        <div style={{ background: C.indigoBg, borderBottom: `1px solid ${C.indigoBd}`, padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, animation: 'bp-in .15s ease' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.indigo }}>{bulkSelected.size} selected</span>
          <select value={bulkJD} onChange={e => setBulkJD(e.target.value)}
            style={{ padding: '4px 8px', border: `1px solid ${C.indigoBd}`, borderRadius: 5, fontSize: 11, outline: 'none', color: C.indigo, background: '#fff' }}>
            <option value="">Select JD to assign…</option>
            {jdOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
          <button onClick={handleBulkAssign} disabled={bulkAssigning} className="bp-btn"
            style={{ padding: '4px 12px', background: bulkAssigning ? C.dim : C.indigo, color: '#fff', border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: bulkAssigning ? 'not-allowed' : 'pointer' }}>
            {bulkAssigning ? <Spin s={9} c="#fff" /> : 'Bulk Assign'}
          </button>
          <button onClick={() => setBulkSelected(new Set())}
            style={{ padding: '4px 8px', background: 'none', color: C.dim, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: C.dim }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>No candidates match the current filters</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
              <tr style={{ background: '#F1F5F9', borderBottom: `1px solid ${C.border}` }}>
                <th style={{ padding: '8px 12px', width: 32 }}>
                  <input type="checkbox" checked={filtered.length > 0 && filtered.every(c => bulkSelected.has(c.id))} onChange={selectAll}
                    style={{ cursor: 'pointer' }} />
                </th>
                {['#', 'Candidate', 'Resume', 'Best Matching JD', 'Match %', 'Skills Match', 'Experience', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', background: '#F1F5F9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => {
                const isExp = expanded === c.id;
                const isBusy = busy === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <tr className="bp-row" style={{ borderBottom: `1px solid ${C.borderLt}`, background: C.card, cursor: 'pointer' }} onClick={() => setExpanded(isExp ? null : c.id)}>
                      <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={bulkSelected.has(c.id)} onChange={() => toggleBulk(c.id)} style={{ cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '10px 8px', fontSize: 10, fontWeight: 700, color: idx < 3 ? C.amber : C.dim }}>#{idx + 1}</td>
                      <td style={{ padding: '10px 10px', minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: c.alreadyAssigned ? '#E2E8F0' : `linear-gradient(135deg,#4F46E5,#7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.alreadyAssigned ? C.dim : '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                            {c.candidateName.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: c.alreadyAssigned ? C.dim : C.text }}>{c.candidateName}</div>
                            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' as const, marginTop: 2 }}>
                              {c.alreadyAssigned && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background:
                                  c.dbStatus === 'shortlisted' ? '#16A34A' :
                                  c.dbStatus === 'rejected'    ? '#DC2626' :
                                  c.dbStatus === 'hired'       ? '#7C3AED' :
                                  '#475569',
                                  padding: '1px 5px', borderRadius: 3 }}>
                                  {c.dbStatus === 'shortlisted' ? 'Assigned' :
                                   c.dbStatus === 'rejected'    ? 'Rejected' :
                                   c.dbStatus === 'hired'       ? 'Hired' :
                                   'In DB'}
                                </span>
                              )}
                              {c.isDuplicate && !c.alreadyAssigned && (
                                <span style={{ fontSize: 9, fontWeight: 600, color: C.amber, background: C.amberBg, padding: '1px 5px', borderRadius: 3 }}>Batch Dup</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ fontSize: 11, color: C.textSec, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {c.resumeFileName}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 12, fontWeight: 500, color: C.text, maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.bestMatchingJD || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 10px' }}><ScorePill pct={c.matchPct} /></td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ fontSize: 11, color: C.textSec }}>{c.skillsMatched}/{c.totalSkills}</span>
                      </td>
                      <td style={{ padding: '10px 10px', fontSize: 11, color: C.textSec, whiteSpace: 'nowrap' }}>
                        {c.experienceYears > 0 ? `${c.experienceYears} yrs` : c.experienceMatched || '—'}
                      </td>
                      <td style={{ padding: '10px 10px' }}><StatusPill status={c.status} /></td>
                      <td style={{ padding: '10px 10px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                          {c.resumeUrl && (
                            <a href={c.resumeUrl} target="_blank" rel="noreferrer"
                              style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3, border: `1px solid ${C.border}`, color: C.textSec, textDecoration: 'none' }}>
                              CV
                            </a>
                          )}
                          {c.alreadyAssigned ? (
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3,
                              background:
                                c.dbStatus === 'shortlisted' ? C.greenBg :
                                c.dbStatus === 'rejected'    ? C.redBg :
                                c.dbStatus === 'hired'       ? '#EDE9FE' :
                                C.borderLt,
                              color:
                                c.dbStatus === 'shortlisted' ? C.green :
                                c.dbStatus === 'rejected'    ? C.red :
                                c.dbStatus === 'hired'       ? '#7C3AED' :
                                C.dim,
                              border: `1px solid ${
                                c.dbStatus === 'shortlisted' ? C.greenBd :
                                c.dbStatus === 'rejected'    ? C.redBd :
                                c.dbStatus === 'hired'       ? '#DDD6FE' :
                                C.border
                              }` }}>
                              {c.dbStatus === 'shortlisted' ? '✓ Assigned' :
                               c.dbStatus === 'rejected'    ? '✕ Rejected' :
                               c.dbStatus === 'hired'       ? '★ Hired' :
                               'In DB'}
                            </span>
                          ) : (
                            <>
                              <button disabled={isBusy} onClick={() => onAssign(c)} className="bp-btn"
                                style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3, border: 'none', background: isBusy ? '#F1F5F9' : C.indigo, color: isBusy ? C.dim : '#fff', cursor: 'pointer' }}>
                                {isBusy ? <Spin s={8} c={C.dim} /> : 'Assign'}
                              </button>
                              <button disabled={isBusy} onClick={() => onTalentPool(c)} className="bp-btn"
                                style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3, border: `1px solid ${C.blueBd}`, background: C.blueBg, color: C.blue, cursor: 'pointer' }}>
                                Pool
                              </button>
                              <button disabled={isBusy} onClick={() => onReject(c)} className="bp-btn"
                                style={{ fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 3, border: `1px solid ${C.redBd}`, background: '#fff', color: C.red, cursor: 'pointer' }}>
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded AI reasoning row */}
                    {isExp && (
                      <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td colSpan={10} style={{ padding: 0, background: '#FAFBFF' }}>
                          <div style={{ padding: '12px 16px 14px 60px', borderLeft: `3px solid ${matchColor(c.matchPct)}`, animation: 'bp-in .15s ease' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: c.aiExplanation ? 10 : 0 }}>
                              {c.matchedSkills.length > 0 && (
                                <div style={{ background: C.greenBg, borderRadius: 6, padding: '8px 11px', border: `1px solid ${C.greenBd}` }}>
                                  <div style={{ fontSize: 8, fontWeight: 700, color: C.green, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 5 }}>
                                    Matched Skills ({c.matchedSkills.length})
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3 }}>
                                    {c.matchedSkills.map(s => <span key={s} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: '#fff', color: C.green, border: `1px solid ${C.greenBd}` }}>{s}</span>)}
                                  </div>
                                </div>
                              )}
                              {c.missingSkills.length > 0 && (
                                <div style={{ background: C.redBg, borderRadius: 6, padding: '8px 11px', border: `1px solid ${C.redBd}` }}>
                                  <div style={{ fontSize: 8, fontWeight: 700, color: C.red, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 5 }}>
                                    Missing Skills ({c.missingSkills.length})
                                  </div>
                                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 3 }}>
                                    {c.missingSkills.map(s => <span key={s} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: '#fff', color: C.red, border: `1px solid ${C.redBd}` }}>{s}</span>)}
                                  </div>
                                </div>
                              )}
                            </div>
                            {c.aiExplanation && (
                              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.indigo}`, borderRadius: 5, padding: '8px 12px' }}>
                                <div style={{ fontSize: 8, fontWeight: 700, color: C.indigo, textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 3 }}>
                                  AI Explanation
                                </div>
                                <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.65 }}>{c.aiExplanation}</div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Root Component ──────────────────────────────────────────────
export const BulkResumePool: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('upload');
  const [results, setResults] = useState<BulkPoolResult | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleUpload = async (files: File[]) => {
    if (!files.length) return;
    setTotalCount(files.length);
    setProcessedCount(0);
    setFileNames(files.map(f => f.name));
    setPhase('processing');

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('resumes', f));

      // Cycle through AI stages per resume to keep animation alive
      const STAGES = [
        'Reading Resume…',
        'Extracting Skills…',
        'Analyzing Experience…',
        'Matching with Job Description…',
        'Calculating Match Score…',
        'Ranking Candidate…',
        'Generating Recommendation…',
      ];
      const totalStages = files.length * STAGES.length;
      let stageIndex = 0;
      const stageInterval = setInterval(() => {
        stageIndex++;
        const resumeIdx = Math.floor(stageIndex / STAGES.length);
        const stage = STAGES[stageIndex % STAGES.length];
        setCurrentStage(stage);
        setProcessedCount(Math.min(resumeIdx, files.length - 1));
        if (stageIndex >= totalStages - 1) clearInterval(stageInterval);
      }, Math.max(200, Math.round((files.length * 4000) / totalStages)));

      const token = localStorage.getItem('recruiter_token') || localStorage.getItem('admin_token');
      const res = await fetch(`${BASE}/api/admin/bulk-resume-pool/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      clearInterval(stageInterval);
      setProcessedCount(files.length);
      setCurrentStage('Done!');

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data);
      setPhase('done');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
      setPhase('error');
    }
  };

  const handleAssign = async (c: BulkCandidate) => {
    setBusy(c.id);
    try {
      const token = localStorage.getItem('recruiter_token') || localStorage.getItem('admin_token');
      const res = await fetch(`${BASE}/api/admin/bulk-resume-pool/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          candidateId:     c.id,
          jobId:           c.bestMatchingJDId,
          resumeFileName:  c.resumeFileName,
          name:            c.candidateName,
          email:           c.email || null,
          phone:           c.phone || null,
          experienceYears: c.experienceYears || 0,
          skills:          c.matchedSkills || [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assign failed');
      showToast(`${c.candidateName} assigned to "${c.bestMatchingJD}"`);
      // Mark as assigned in local state so button changes immediately
      setResults(r => r ? {
        ...r,
        candidates: r.candidates.map(x =>
          x.id === c.id
            ? { ...x, alreadyAssigned: true, dbStatus: 'shortlisted' }
            : x
        ),
      } : r);
    } catch (e: any) { showToast(e.message || 'Assign failed'); }
    finally { setBusy(null); }
  };

  const handleTalentPool = async (c: BulkCandidate) => {
    setBusy(c.id);
    try {
      const token = localStorage.getItem('recruiter_token') || localStorage.getItem('admin_token');
      await fetch(`${BASE}/api/admin/bulk-resume-pool/talent-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          candidateId:    c.id,
          resumeFileName: c.resumeFileName,
          name:           c.candidateName,
          email:          c.email || '',
          phone:          c.phone || '',
          experienceYears: c.experienceYears || 0,
          skills:         c.matchedSkills || [],
        }),
      });
      showToast(`${c.candidateName} moved to Talent Pool`);
    } catch { showToast('Failed'); }
    finally { setBusy(null); }
  };

  const handleReject = async (c: BulkCandidate) => {
    if (!window.confirm(`Reject ${c.candidateName}?`)) return;
    setBusy(c.id);
    try {
      const token = localStorage.getItem('recruiter_token') || localStorage.getItem('admin_token');
      await fetch(`${BASE}/api/admin/bulk-resume-pool/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ candidateId: c.id, email: c.email || null }),
      });
      showToast(`${c.candidateName} rejected`);
      // Remove from table immediately
      setResults(r => r ? { ...r, candidates: r.candidates.filter(x => x.id !== c.id) } : r);
    } catch { showToast('Failed'); }
    finally { setBusy(null); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 999, background: '#1E293B', color: '#fff', padding: '8px 14px', borderRadius: 6, fontSize: 11, fontWeight: 500, boxShadow: '0 4px 14px rgba(0,0,0,.2)', animation: 'bp-in .15s ease' }}>
          <style>{CSS}</style>
          {toast}
        </div>
      )}

      {phase === 'upload' && (
        <UploadScreen onUpload={handleUpload} uploading={false} />
      )}

      {phase === 'processing' && (
        <ProcessingScreen total={totalCount} done={processedCount} fileNames={fileNames} currentStage={currentStage} />
      )}

      {phase === 'done' && results && (
        <ResultsTable
          results={results}
          onAssign={handleAssign}
          onTalentPool={handleTalentPool}
          onReject={handleReject}
          onNewUpload={() => { setPhase('upload'); setResults(null); }}
          busy={busy}
        />
      )}

      {phase === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif" }}>
          <style>{CSS}</style>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={20} height={20} fill="none" stroke={C.red} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Upload Failed</p>
          <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>{error}</p>
          <button onClick={() => setPhase('upload')} className="bp-btn"
            style={{ padding: '7px 18px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};
