import React, { useState, useEffect, useMemo, useRef } from 'react';

import BASE_URL from '../../Config';
const API       = `${BASE_URL}/api/resume-super-pool`;
const ADMIN_API = `${BASE_URL}/api/admin/analyze-pool`;
const THRESHOLD = 80;

interface JdMatch {
  appId: number; jobId: number; jobTitle: string;
  matchPct: number; matched: boolean;
  matchedSkills: string[]; missingSkills: string[];
  reasoning?: string; status: string; assessmentCode: string | null;
}
interface Resume {
  id: number; name: string; email: string; phone: string;
  resumeUrl: string; skills: string[]; experience: number;
  status: string; assessmentCode: string | null;
  uploadedAt: string; lastActivity: string;
  appliedJobTitle: string; recruiterName: string; recruiterEmail: string;
  jdMatches: JdMatch[];
}
interface JdSummary {
  jobId: number; jobTitle: string;
  scanned: number; matched: number; unmatched: number; matchPct: number;
}
interface PoolData {
  resumes: Resume[]; jdSummary: JdSummary[];
  totalResumes: number; totalJobs: number;
}

const C = {
  green:'#16a34a', greenBg:'#f0fdf4', greenBd:'#bbf7d0',
  red:'#dc2626',   redBg:'#fef2f2',   redBd:'#fecaca',
  amber:'#d97706', amberBg:'#fffbeb',
  blue:'#1d4ed8',  blueBg:'#eff6ff',  blueBd:'#bfdbfe',
  indigo:'#4f46e5',indigoBg:'#eef2ff',indigoBd:'#c7d2fe',
  slate:'#475569', dim:'#94a3b8', bg:'#f8fafc',
  bd:'#e2e8f0',    white:'#ffffff',   text:'#0f172a',
};
const sc  = (s:number) => s>=THRESHOLD?C.green:s>=50?C.amber:C.red;
const sbg = (s:number) => s>=THRESHOLD?C.greenBg:s>=50?C.amberBg:'#fef2f2';
const sl  = (s:number) => s>=THRESHOLD?'Strong':s>=50?'Fair':'Weak';

const ST: Record<string,[string,string]> = {
  pending:['#f1f5f9','#64748b'], screened:['#fef9c3','#a16207'],
  shortlisted:[C.blueBg,C.blue], interview_sent:['#e0f2fe','#0284c7'],
  rejected:[C.redBg,C.red],      hired:[C.greenBg,C.green], selected:[C.greenBg,C.green],
};
const STL: Record<string,string> = {
  pending:'Pending', screened:'Screened', shortlisted:'Shortlisted',
  interview_sent:'Assessed', rejected:'Rejected', hired:'Hired', selected:'Selected',
};
const gst  = (v?:string):[string,string] => ST[(v||'pending').toLowerCase()]??['#f1f5f9','#64748b'];
const gstl = (v?:string) => STL[(v||'').toLowerCase()]??(v||'Pending');
const fmt  = (d?:string) => d?new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';

const CSS = `
  @keyframes sp-spin{to{transform:rotate(360deg)}}
  @keyframes sp-ping{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}
  @keyframes sp-pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes sp-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @keyframes sp-fade{0%{opacity:0}100%{opacity:1}}
  @keyframes sp-shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
  @keyframes sp-floatin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .sk{animation:sp-pulse 1.5s ease-in-out infinite;background:linear-gradient(90deg,#eef0f3 25%,#f5f6f8 50%,#eef0f3 75%);background-size:800px 100%;animation:sp-shimmer 1.4s ease-in-out infinite;border-radius:4px}
  .crow:hover td{background:#fafbff!important;transition:background .12s}
  .jdcard{animation:sp-floatin .2s ease both}
  .jdcard:hover{border-color:#a5b4fc!important;box-shadow:0 4px 16px rgba(79,70,229,.09)!important;transform:translateY(-1px);transition:all .15s!important}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-thumb{background:#dde1e7;border-radius:4px}
`;

// ── Atoms ──────────────────────────────────────────────────────
const Spin = ({s=13,c=C.indigo}:{s?:number;c?:string}) => (
  <span style={{display:'inline-block',width:s,height:s,border:`2px solid ${c}22`,
    borderTop:`2px solid ${c}`,borderRadius:'50%',animation:'sp-spin .65s linear infinite',flexShrink:0}}/>
);
const Sk = ({w='100%',h=12}:{w?:number|string;h?:number}) => (
  <div className="sk" style={{width:w,height:h}}/>
);

const Ring = ({score,size=50}:{score:number;size?:number}) => {
  const col=sc(score),r=size/2-4,ci=2*Math.PI*r,da=(score/100)*ci;
  return (
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill={sbg(score)} stroke={col+'20'} strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3}
          strokeDasharray={`${da} ${ci}`} strokeLinecap="round"/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center'}}>
        <span style={{fontSize:11,fontWeight:800,color:col,lineHeight:1}}>{score}%</span>
        <span style={{fontSize:7,fontWeight:700,color:col,textTransform:'uppercase' as const,
          letterSpacing:'0.04em'}}>{sl(score)}</span>
      </div>
    </div>
  );
};

// ── AI animation screen ────────────────────────────────────────
const AIScreen = ({resumes,jobs}:{resumes:number;jobs:number}) => {
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState<{text:string;done:boolean;color:string}[]>([]);
  const [dots, setDots] = useState('.');
  const [pct,  setPct]  = useState(0);
  const logsRef = useRef<HTMLDivElement>(null);

  const resumeNames = useMemo(() => [
    'Analyzing resume data…','Extracting skills & experience…','Mapping against JD requirements…',
    'Comparing technical keywords…','Evaluating soft skill indicators…','Running semantic similarity…',
    'Scoring candidate fit…','Cross-referencing all JDs…','Computing match percentages…',
    'Identifying skill gaps…','Generating AI reasoning…','Finalizing results…',
  ],[]);

  useEffect(() => {
    const t = setInterval(() => setTick(p => p+1), 120);
    return () => clearInterval(t);
  },[]);

  useEffect(() => {
    const t = setInterval(() => setDots(p => p.length>=3?'.':p+'.'), 400);
    return () => clearInterval(t);
  },[]);

  // Progress bar — always runs, independent of data
  useEffect(() => {
    const t = setInterval(() => setPct(p => p >= 97 ? 97 : p + 1), 400);
    return () => clearInterval(t);
  },[]);

  // Log lines — always runs
  useEffect(() => {
    const t = setInterval(() => {
      setLogs(prev => {
        if (prev.length >= resumeNames.length) return prev;
        const updated = prev.map(l => ({ ...l, done: true, color: C.green }));
        return [...updated, { text: resumeNames[prev.length], done: false, color: C.indigo }];
      });
    }, 900);
    return () => clearInterval(t);
  },[resumeNames]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  },[logs]);

  // Scanline wave
  const wave  = (i:number) => Math.sin((tick * 0.18) + i * 0.7) * 0.5 + 0.5;

  return (
    <div style={{
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      height:'100%',background:'linear-gradient(135deg,#fff7ed 0%,#fff3e0 50%,#fef9f0 100%)',
      padding:32,gap:24,fontFamily:"'Inter',-apple-system,sans-serif",
    }}>
      <style>{`
        ${CSS}
        @keyframes ai-glow{0%,100%{box-shadow:0 0 12px #f59e0baa}50%{box-shadow:0 0 28px #d97706cc,0 0 48px #f59e0b40}}
        @keyframes ai-scan{0%{transform:translateY(-100%)}100%{transform:translateY(600%)}}
        @keyframes ai-flicker{0%,100%{opacity:1}92%{opacity:1}94%{opacity:.4}96%{opacity:1}}
        @keyframes ai-blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes ai-node{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.6);opacity:1}}
        @keyframes ai-orb-rot{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ai-orb-pulse{0%,100%{transform:scale(1);box-shadow:0 0 0 2px #fde68a,0 4px 20px rgba(245,158,11,.35)}50%{transform:scale(1.06);box-shadow:0 0 0 3px #fcd34d,0 6px 28px rgba(245,158,11,.55)}}
        .ai-log-row{animation:sp-fade .3s ease both}
      `}</style>

      {/* ── Central orb ── */}
      <div style={{position:'relative',width:100,height:100,flexShrink:0}}>
        {/* rotating dashed ring */}
        <svg width={100} height={100} style={{position:'absolute',inset:0,animation:'ai-orb-rot 6s linear infinite'}}>
          <circle cx={50} cy={50} r={46} fill="none" stroke="#fcd34d" strokeWidth={1.5}
            strokeDasharray="8 6" strokeLinecap="round" opacity={0.6}/>
        </svg>
        {/* pulsing solid ring */}
        <svg width={100} height={100} style={{position:'absolute',inset:0,animation:'ai-orb-rot 10s linear infinite reverse'}}>
          <circle cx={50} cy={50} r={38} fill="none" stroke="#f59e0b" strokeWidth={1}
            strokeDasharray="4 12" strokeLinecap="round" opacity={0.4}/>
        </svg>
        {/* ping rings */}
        {[0,1].map(i=>(
          <div key={i} style={{
            position:'absolute',inset:-(i*8+4),borderRadius:'50%',
            border:'1px solid #f59e0b',opacity:0,
            animation:`sp-ping ${1.8+i*0.7}s ease-out infinite`,
            animationDelay:`${i*0.6}s`,
          }}/>
        ))}
        {/* inner filled orb */}
        <div style={{
          position:'absolute',inset:12,borderRadius:'50%',
          background:'linear-gradient(135deg,#fef3c7 0%,#fbbf24 50%,#f59e0b 100%)',
          display:'flex',alignItems:'center',justifyContent:'center',
          boxShadow:'0 0 0 2px #fde68a, 0 4px 20px rgba(245,158,11,0.35)',
          animation:'ai-orb-pulse 2.4s ease-in-out infinite',
        }}>
          {/* scan line */}
          <div style={{position:'absolute',inset:0,borderRadius:'50%',overflow:'hidden',pointerEvents:'none'}}>
            <div style={{
              position:'absolute',left:0,right:0,height:2,
              background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)',
              animation:'ai-scan 1.6s linear infinite',
            }}/>
          </div>
          <svg width={26} height={26} fill="none" stroke="#92400e" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
      </div>

      {/* ── Title ── */}
      <div style={{textAlign:'center'}}>
        <p style={{fontSize:16,fontWeight:700,color:'#92400e',margin:'0 0 4px',letterSpacing:'-0.01em'}}>
          AI Matching in Progress
        </p>
        <p style={{fontSize:11,color:'#b45309',margin:0}}>
          <span style={{color:'#d97706',fontWeight:600}}>{resumes||'…'}</span> resumes ×{' '}
          <span style={{color:'#d97706',fontWeight:600}}>{jobs||'…'}</span> active JDs
        </p>
      </div>

      {/* ── Pulse nodes row ── */}
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        {Array.from({length:7}).map((_,i)=>(
          <div key={i} style={{
            width:7,height:7,borderRadius:'50%',
            background: i < (tick % 8) ? '#f59e0b' : '#fde68a',
            border:`1px solid ${i < (tick % 8)?'#d97706':'#fcd34d'}`,
            animation:`ai-node ${0.8+i*0.15}s ease-in-out infinite`,
            animationDelay:`${i*0.12}s`,
            opacity: wave(i),
          }}/>
        ))}
      </div>

      {/* ── Terminal log ── */}
      <div style={{
        width:'100%',maxWidth:380,background:'#fffbeb',
        border:'1px solid #fde68a',borderRadius:10,overflow:'hidden',
      }}>
        <div style={{
          background:'#fef3c7',padding:'7px 12px',
          display:'flex',alignItems:'center',gap:6,
          borderBottom:'1px solid #fde68a',
        }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c=>(
            <div key={c} style={{width:9,height:9,borderRadius:'50%',background:c,opacity:0.8}}/>
          ))}
          <span style={{fontSize:10,color:'#b45309',marginLeft:4}}>ai-matcher — resume-pool</span>
          <Spin s={8} c="#d97706"/>
        </div>
        <div ref={logsRef} style={{
          padding:'10px 12px',minHeight:100,maxHeight:140,
          overflowY:'auto',display:'flex',flexDirection:'column',gap:4,
        }}>
          {logs.length === 0 && (
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <Spin s={8} c="#f59e0b"/>
              <span style={{fontSize:10,color:'#b45309'}}>Initializing{dots}</span>
            </div>
          )}
          {logs.map((l, i) => (
            <div key={i} className="ai-log-row" style={{display:'flex',alignItems:'center',gap:7}}>
              {l.done
                ? <span style={{color:'#16a34a',fontSize:9,fontWeight:700,flexShrink:0}}>✓</span>
                : <Spin s={8} c="#f59e0b"/>}
              <span style={{
                fontSize:10,
                color: l.done ? '#b45309' : '#92400e',
                fontWeight: l.done ? 400 : 600,
              }}>{l.text}</span>
              {l.done && <span style={{marginLeft:'auto',fontSize:9,color:'#16a34a'}}>done</span>}
            </div>
          ))}
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{fontSize:10,color:'#d97706'}}>{'>'}</span>
            <span style={{width:6,height:11,background:'#f59e0b',display:'inline-block',
              animation:'ai-blink 1s step-end infinite',borderRadius:1}}/>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{width:'100%',maxWidth:380}}>
        <div style={{
          display:'flex',justifyContent:'space-between',
          fontSize:10,color:'#b45309',marginBottom:4,
        }}>
          <span>Processing{dots}</span>
          <span style={{color:'#d97706',fontWeight:700}}>{pct}%</span>
        </div>
        <div style={{height:4,background:'#fde68a',borderRadius:2,overflow:'hidden',border:'1px solid #fcd34d'}}>
          <div style={{
            height:'100%',borderRadius:2,
            background:'linear-gradient(90deg,#f59e0b,#d97706,#b45309)',
            width:`${pct}%`,
            transition:'width .5s ease',
          }}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#d97706',marginTop:3}}>
          <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
        </div>
      </div>

      <p style={{fontSize:10,color:'#d97706',margin:0}}>This may take 20–60s</p>
    </div>
  );
};

// ── Skeleton ───────────────────────────────────────────────────
const PageSkel = () => (
  <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg}}>
    <style>{CSS}</style>
    <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:'11px 20px',
      display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{display:'flex',flexDirection:'column',gap:5}}><Sk w={170} h={13}/><Sk w={110} h={9}/></div>
      <div style={{display:'flex',gap:8}}><Sk w={75} h={28}/><Sk w={100} h={28}/></div>
    </div>
    <div style={{display:'flex',background:C.white,borderBottom:`1px solid ${C.bd}`}}>
      {[0,1,2,3].map(i=>(
        <div key={i} style={{flex:1,padding:'9px 16px',borderRight:i<3?`1px solid ${C.bd}`:'none'}}>
          <Sk w={28} h={16}/><div style={{marginTop:4}}><Sk w={55} h={9}/></div>
        </div>
      ))}
    </div>
    <div style={{flex:1,padding:'12px 20px',display:'flex',flexDirection:'column',gap:6}}>
      <Sk w={130} h={9}/>
      {[0,1,2,3,4].map(i=>(
        <div key={i} style={{background:C.white,borderRadius:8,border:`1px solid ${C.bd}`,padding:'14px 18px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{display:'flex',flexDirection:'column',gap:5,flex:1}}>
              <Sk w="38%" h={13}/><Sk w="20%" h={9}/>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'center'}}>
              {[0,1,2].map(j=><div key={j} style={{display:'flex',flexDirection:'column',gap:4,alignItems:'center'}}><Sk w={28} h={16}/><Sk w={44} h={9}/></div>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════
// DETAIL SCREEN — full candidate list for one JD
// ══════════════════════════════════════════════════════════════
const THEAD = ['','#','Score','Candidate','Match','Status','Recruiter','Exp','Last Active','Actions'];

const CandRow = ({r,m,rank,onAssess,onStatus,busy}:{
  r:Resume;m:JdMatch;rank:number;
  onAssess:(id:number)=>void;onStatus:(id:number,s:string)=>void;busy:number|null;
}) => {
  const [exp,setExp] = useState(false);
  const matched = m.matchPct>=THRESHOLD;
  const [stBg,stFg] = gst(m.status||r.status);
  const st  = m.status||r.status;
  const aid = m.appId||r.id;
  const isBusy = busy===aid;

  return (
    <>
      <tr className="crow" style={{borderBottom:`1px solid ${C.bd}`,cursor:'pointer',background:C.white}}
        onClick={()=>setExp(p=>!p)}>
        <td style={{padding:'10px 10px',width:26,textAlign:'center' as const}}>
          <span style={{fontSize:13,color:C.dim,fontWeight:700,
            userSelect:'none' as const,lineHeight:1}}>{exp?'−':'+'}</span>
        </td>
        <td style={{padding:'10px 8px',width:28}}>
          <span style={{fontSize:10,fontWeight:700,color:rank<3?C.amber:C.dim}}>#{rank+1}</span>
        </td>
        <td style={{padding:'10px 8px',width:58}}><Ring score={m.matchPct} size={46}/></td>
        <td style={{padding:'10px 12px',minWidth:160}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{r.name}</div>
          <div style={{fontSize:11,color:C.dim,marginTop:1}}>{r.email}</div>
          {r.phone&&<div style={{fontSize:10,color:C.dim}}>{r.phone}</div>}
        </td>
        <td style={{padding:'10px 8px'}}>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,
            background:matched?C.greenBg:C.redBg,color:matched?C.green:C.red}}>
            {matched?`Match ≥${THRESHOLD}%`:`Below ${THRESHOLD}%`}
          </span>
        </td>
        <td style={{padding:'10px 8px'}}>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:3,
            background:stBg,color:stFg}}>{gstl(st)}</span>
        </td>
        <td style={{padding:'10px 8px',fontSize:11,color:C.slate,whiteSpace:'nowrap' as const}}>
          {r.recruiterName || '—'}
        </td>
        <td style={{padding:'10px 8px',fontSize:11,color:C.slate,whiteSpace:'nowrap' as const}}>
          {r.experience>0?`${r.experience} yrs`:'—'}
        </td>
        <td style={{padding:'10px 8px',fontSize:10,color:C.dim,whiteSpace:'nowrap' as const}}>
          {fmt(r.lastActivity)}
        </td>
        <td style={{padding:'10px 8px'}} onClick={e=>e.stopPropagation()}>
          <div style={{display:'flex',gap:4,flexWrap:'wrap' as const}}>
            {r.resumeUrl&&(
              <a href={r.resumeUrl} target="_blank" rel="noreferrer"
                style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:3,
                  border:`1px solid ${C.bd}`,color:C.slate,textDecoration:'none'}}>
                Resume
              </a>
            )}
            <button onClick={()=>onAssess(aid)} disabled={isBusy}
              style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:3,border:'none',
                background:isBusy?'#f3f4f6':C.indigo,color:isBusy?C.dim:'#fff',
                cursor:isBusy?'not-allowed':'pointer'}}>
              {isBusy?'…':m.assessmentCode?'Resend':'Assess'}
            </button>
            {st!=='shortlisted'&&(
              <button onClick={()=>onStatus(aid,'shortlisted')} disabled={isBusy}
                style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:3,
                  border:`1px solid ${C.blueBd}`,background:C.blueBg,color:C.blue,cursor:'pointer'}}>
                Shortlist
              </button>
            )}
            {st!=='rejected'&&(
              <button onClick={()=>onStatus(aid,'rejected')} disabled={isBusy}
                style={{fontSize:9,fontWeight:600,padding:'3px 8px',borderRadius:3,
                  border:`1px solid ${C.redBd}`,background:'#fff',color:C.red,cursor:'pointer'}}>
                Reject
              </button>
            )}
          </div>
        </td>
      </tr>
      {exp&&(
        <tr style={{borderBottom:`1px solid ${C.bd}`}}>
          <td colSpan={11} style={{padding:0,background:'#fafbff'}}>
            <div style={{padding:'12px 16px 14px 56px',
              borderLeft:`3px solid ${matched?C.green:C.bd}`,animation:'sp-in .15s ease'}}>
              {((m.matchedSkills?.length||0)+(m.missingSkills?.length||0))>0&&(
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  {(m.matchedSkills?.length||0)>0&&(
                    <div style={{background:C.greenBg,borderRadius:6,padding:'9px 11px',
                      border:`1px solid ${C.greenBd}`}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.green,
                        textTransform:'uppercase' as const,letterSpacing:'0.06em',marginBottom:5}}>
                        Matched Skills ({m.matchedSkills.length})
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap' as const,gap:3}}>
                        {m.matchedSkills.map(s=>(
                          <span key={s} style={{fontSize:9,padding:'1px 6px',borderRadius:3,
                            background:'#fff',color:C.green,border:`1px solid ${C.greenBd}`}}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(m.missingSkills?.length||0)>0&&(
                    <div style={{background:C.redBg,borderRadius:6,padding:'9px 11px',
                      border:`1px solid ${C.redBd}`}}>
                      <div style={{fontSize:8,fontWeight:700,color:C.red,
                        textTransform:'uppercase' as const,letterSpacing:'0.06em',marginBottom:5}}>
                        Missing Skills ({m.missingSkills.length})
                      </div>
                      <div style={{display:'flex',flexWrap:'wrap' as const,gap:3}}>
                        {m.missingSkills.map(s=>(
                          <span key={s} style={{fontSize:9,padding:'1px 6px',borderRadius:3,
                            background:'#fff',color:C.red,border:`1px solid ${C.redBd}`}}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {m.reasoning&&(
                <div style={{background:C.white,border:`1px solid ${C.bd}`,
                  borderLeft:`3px solid ${C.indigo}`,borderRadius:5,padding:'8px 12px',marginBottom:8}}>
                  <div style={{fontSize:8,fontWeight:700,color:C.indigo,
                    textTransform:'uppercase' as const,letterSpacing:'0.06em',marginBottom:3}}>
                    AI Reasoning
                  </div>
                  <div style={{fontSize:11,color:C.slate,lineHeight:1.65}}>{m.reasoning}</div>
                </div>
              )}
              <div style={{display:'flex',gap:14,flexWrap:'wrap' as const,fontSize:10,color:C.dim}}>
                {r.recruiterName&&<span>Recruiter: <strong style={{color:C.slate}}>{r.recruiterName}</strong></span>}
                {r.appliedJobTitle&&<span>Applied for: <strong style={{color:C.slate}}>{r.appliedJobTitle}</strong></span>}
                <span>Applied: <strong style={{color:C.slate}}>{fmt(r.uploadedAt)}</strong></span>
                {r.skills.length>0&&(
                  <span>Skills: <strong style={{color:C.slate}}>
                    {r.skills.slice(0,5).join(', ')}{r.skills.length>5?` +${r.skills.length-5} more`:''}
                  </strong></span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const DetailScreen = ({jd,allResumes,onBack,onAssess,onStatus,busy}:{
  jd:JdSummary; allResumes:Resume[];
  onBack:()=>void;
  onAssess:(id:number)=>void; onStatus:(id:number,s:string)=>void; busy:number|null;
}) => {
  const [tab,setTab] = useState<'matched'|'unmatched'|'all'>('matched');
  const [search,setSearch] = useState('');

  const forJd = useMemo(()=>
    allResumes
      .map(r=>({r,m:r.jdMatches.find(m=>m.jobId===jd.jobId)!}))
      .filter(x=>x.m)
      .sort((a,b)=>b.m.matchPct-a.m.matchPct),
  [allResumes,jd.jobId]);

  const matched   = forJd.filter(x=>x.m.matchPct>=THRESHOLD);
  const unmatched = forJd.filter(x=>x.m.matchPct<THRESHOLD);

  const list = useMemo(()=>{
    const base = tab==='matched'?matched:tab==='unmatched'?unmatched:forJd;
    if(!search) return base;
    const q=search.toLowerCase();
    return base.filter(x=>
      x.r.name.toLowerCase().includes(q)||
      x.r.email.toLowerCase().includes(q)||
      x.r.skills.some(s=>s.toLowerCase().includes(q))
    );
  },[tab,matched,unmatched,forJd,search]);

  const bw = forJd.length?Math.round((matched.length/forJd.length)*100):0;
  const bc = bw>=THRESHOLD?C.green:bw>=40?C.amber:C.red;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg,
      fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <style>{CSS}</style>

      {/* Sticky header */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,
        padding:'0 20px',flexShrink:0,position:'sticky',top:0,zIndex:10}}>
        <div style={{height:48,display:'flex',alignItems:'center',gap:12}}>
          {/* Back */}
          <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:5,
            padding:'5px 11px',border:`1px solid ${C.bd}`,borderRadius:6,
            fontSize:11,fontWeight:600,color:C.indigo,background:C.white,cursor:'pointer'}}>
            <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
          <span style={{width:1,height:16,background:C.bd}}/>
          <div style={{flex:1,minWidth:0}}>
            <span style={{fontSize:14,fontWeight:700,color:C.text}}>{jd.jobTitle}</span>
            <span style={{fontSize:11,color:C.dim,marginLeft:8}}>Resume Pool Analysis</span>
          </div>
          {/* Summary inline */}
          <div style={{display:'flex',gap:12,fontSize:11,color:C.dim,flexShrink:0}}>
            <span>{jd.scanned} scanned</span>
            <span style={{color:C.green,fontWeight:600}}>{matched.length} matched</span>
            <span style={{color:C.red,fontWeight:600}}>{unmatched.length} no match</span>
            <div style={{display:'flex',alignItems:'center',gap:5}}>
              <div style={{width:60,height:4,background:'#e2e8f0',borderRadius:2}}>
                <div style={{width:`${bw}%`,height:'100%',background:bc,borderRadius:2}}/>
              </div>
              <span style={{fontWeight:700,color:bc}}>{bw}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab + search bar */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 20px',flexShrink:0}}>
        <div style={{display:'flex'}}>
          {([
            ['matched',   `Matched ≥${THRESHOLD}% (${matched.length})`,   C.green],
            ['unmatched', `Below ${THRESHOLD}% (${unmatched.length})`,     C.red],
            ['all',       `All (${forJd.length})`,                         C.slate],
          ] as const).map(([t,label,ac])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'10px 14px',fontSize:11,fontWeight:600,border:'none',
              background:'none',cursor:'pointer',whiteSpace:'nowrap' as const,
              color:tab===t?ac:C.dim,
              borderBottom:tab===t?`2px solid ${ac}`:'2px solid transparent',
            }}>{label}</button>
          ))}
        </div>
        {/* Search */}
        <div style={{position:'relative',padding:'6px 0'}}>
          <svg width={10} height={10} style={{position:'absolute',left:8,top:'50%',
            transform:'translateY(-50%)',color:C.dim,pointerEvents:'none'}}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search candidate…"
            style={{paddingLeft:24,paddingRight:8,paddingTop:5,paddingBottom:5,
              border:`1px solid ${C.bd}`,borderRadius:5,fontSize:11,outline:'none',
              width:180,color:C.text,background:C.white}}/>
        </div>
      </div>

      {/* Table */}
      <div style={{flex:1,overflowY:'auto'}}>
        {list.length===0?(
          <div style={{padding:'48px',textAlign:'center' as const,color:C.dim}}>
            <p style={{fontSize:13,margin:'0 0 4px',fontWeight:500}}>
              {tab==='matched'?`No candidates scored ≥${THRESHOLD}% for this JD`:
               tab==='unmatched'?'No unmatched candidates':'No candidates found'}
            </p>
            {tab==='matched'&&<p style={{fontSize:11,margin:0,color:'#cbd5e1'}}>
              Try Re-Analyze for updated AI scores
            </p>}
          </div>
        ):(
          <table style={{width:'100%',borderCollapse:'collapse' as const,fontSize:12}}>
            <thead style={{position:'sticky',top:0,zIndex:5}}>
              <tr style={{background:'#f1f5f9',borderBottom:`1px solid ${C.bd}`}}>
                {THEAD.map((h,i)=>(
                  <th key={i} style={{padding:'8px 8px',textAlign:'left' as const,fontSize:9,
                    fontWeight:700,color:C.slate,textTransform:'uppercase' as const,
                    letterSpacing:'0.05em',whiteSpace:'nowrap' as const,
                    background:'#f1f5f9'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(({r,m},idx)=>(
                <CandRow key={r.id} r={r} m={m} rank={idx}
                  onAssess={onAssess} onStatus={onStatus} busy={busy}/>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// JD LIST PAGE
// ══════════════════════════════════════════════════════════════
const JDListPage = ({data,onSelect,onReanalyze,onRefresh,search,setSearch,totalMatched,onBack}:{
  data:PoolData; onSelect:(jd:JdSummary)=>void;
  onReanalyze:()=>void; onRefresh:()=>void;
  search:string; setSearch:(v:string)=>void; totalMatched:number;
  onBack?:()=>void;
}) => {
  const filtered = useMemo(()=>
    data.jdSummary.filter(jd=>
      !search||jd.jobTitle.toLowerCase().includes(search.toLowerCase())
    ),[data,search]);

  const totalUnmatched = data.totalResumes - totalMatched;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',background:C.bg,
      fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.bd}`,padding:'10px 20px',
        flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        {onBack && (
          <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:5,
            padding:'5px 11px',border:`1px solid ${C.bd}`,borderRadius:6,
            fontSize:11,fontWeight:600,color:C.indigo,background:C.white,cursor:'pointer',flexShrink:0}}>
            <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        )}
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:7}}>
            AI Pool Analysis — All Recruiters
            <span style={{fontSize:8,fontWeight:700,padding:'2px 6px',borderRadius:3,
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff'}}>
              AI
            </span>
          </div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>
            {data.totalResumes} resumes · {data.totalJobs} active JDs · threshold {THRESHOLD}%
          </div>
        </div>
        <div style={{display:'flex',gap:7,alignItems:'center'}}>
          <div style={{position:'relative'}}>
            <svg width={10} height={10} style={{position:'absolute',left:7,top:'50%',
              transform:'translateY(-50%)',color:C.dim,pointerEvents:'none'}}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search JD…"
              style={{paddingLeft:23,paddingRight:8,paddingTop:5,paddingBottom:5,
                border:`1px solid ${C.bd}`,borderRadius:5,fontSize:11,outline:'none',
                width:140,color:C.text,background:C.white}}/>
          </div>
          <button onClick={onRefresh}
            style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',
              background:C.white,color:C.slate,border:`1px solid ${C.bd}`,
              borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>
            <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button onClick={onReanalyze}
            style={{display:'flex',alignItems:'center',gap:4,padding:'5px 13px',
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',color:'#fff',
              border:'none',borderRadius:5,fontSize:11,fontWeight:600,cursor:'pointer'}}>
            <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
            </svg>
            Re-Analyze
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{display:'flex',background:C.white,borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
        {[
          {l:'Active JDs',      v:data.totalJobs,    c:C.indigo, bg:'transparent'},
          {l:'Total Resumes',   v:data.totalResumes, c:C.text,   bg:'transparent'},
          {l:`Matched ${THRESHOLD}%+`, v:totalMatched,      c:C.green,  bg:C.greenBg},
          {l:`Below ${THRESHOLD}%`,    v:totalUnmatched,    c:C.red,    bg:C.redBg},
        ].map((s,i)=>(
          <div key={i} style={{flex:1,padding:'8px 16px',
            borderRight:i<3?`1px solid ${C.bd}`:'none',background:s.bg}}>
            <div style={{fontSize:18,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
            <div style={{fontSize:9,color:C.dim,marginTop:3,fontWeight:500}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* JD cards */}
      <div style={{flex:1,overflowY:'auto',padding:'12px 20px'}}>
        <div style={{fontSize:9,fontWeight:600,color:C.dim,textTransform:'uppercase' as const,
          letterSpacing:'0.07em',marginBottom:8}}>
          {filtered.length} Job Description{filtered.length!==1?'s':''} — click any row to view candidates
        </div>
        {filtered.length===0&&(
          <div style={{background:C.white,borderRadius:8,border:`2px dashed ${C.bd}`,
            padding:'40px',textAlign:'center' as const}}>
            <p style={{fontSize:12,color:C.dim,margin:0}}>No job descriptions found</p>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:5}}>
          {filtered.map((jd,_i)=>{
            const bw = jd.scanned?Math.round((jd.matched/jd.scanned)*100):0;
            return (
              <div key={jd.jobId} className="jdcard"
                onClick={()=>onSelect(jd)}
                style={{animationDelay:`${_i*0.05}s`,background:C.white,borderRadius:8,border:`1px solid ${C.bd}`,
                  padding:'13px 16px',display:'flex',alignItems:'center',gap:14,
                  cursor:'pointer',transition:'all .15s',
                  boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>

                {/* JD icon */}
                <div style={{width:36,height:36,borderRadius:8,background:C.indigoBg,
                  display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <svg width={16} height={16} fill="none" stroke={C.indigo} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>

                {/* Title */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' as const}}>
                    {jd.jobTitle}
                  </div>
                  <div style={{fontSize:10,color:C.dim,marginTop:2}}>
                    {jd.scanned} resumes scanned
                  </div>
                </div>

                {/* Stats */}
                <div style={{display:'flex',alignItems:'center',gap:0,border:`1px solid ${C.bd}`,
                  borderRadius:6,overflow:'hidden',flexShrink:0}}>
                  {[
                    {l:'Scanned',  v:jd.scanned,   fg:C.slate, bg:'#f8fafc'},
                    {l:'Matched',  v:jd.matched,   fg:C.green, bg:C.greenBg},
                    {l:'No Match', v:jd.unmatched, fg:C.red,   bg:C.redBg},
                  ].map((s,i)=>(
                    <div key={s.l} style={{textAlign:'center' as const,padding:'7px 14px',minWidth:60,
                      borderLeft:i>0?`1px solid ${C.bd}`:'none',background:s.bg}}>
                      <div style={{fontSize:17,fontWeight:700,color:s.fg,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:8,color:C.dim,marginTop:2,fontWeight:500}}>{s.l}</div>
                    </div>
                  ))}

                  {/* Arrow */}
                  <div style={{padding:'0 10px',borderLeft:`1px solid ${C.bd}`,background:C.white,
                    display:'flex',alignItems:'center',alignSelf:'stretch'}}>
                    <svg width={13} height={13} fill="none" stroke={C.indigo} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export const ResumeSuperPool: React.FC<{ adminMode?: boolean; onBack?: () => void }> = ({ adminMode, onBack }) => {
  const [data,    setData]    = useState<PoolData|null>(null);
  const [phase,   setPhase]   = useState<'loading'|'ai'|'done'|'error'>('ai');
  const [err,     setErr]     = useState('');
  const [busy,    setBusy]    = useState<number|null>(null);
  const [toast,   setToast]   = useState('');
  const [search,  setSearch]  = useState('');
  const [selJd,   setSelJd]   = useState<JdSummary|null>(null);

  const showToast = (m:string) => { setToast(m); setTimeout(()=>setToast(''),3000); };

  const load = async (ai=false) => {
    setPhase(ai ? 'ai' : 'loading');
    setErr('');
    try {
      const url = adminMode ? ADMIN_API : API;
      const res = await fetch(url, ai?{method:'POST',headers:{'Content-Type':'application/json'}}:undefined);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json); setPhase('done');
    } catch(e:any) {
      setErr(e.message||'Failed'); setPhase('error');
    }
  };

  useEffect(()=>{
    load(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const sendAssessment = async (id:number) => {
    setBusy(id);
    try {
      const r=await fetch(`${API}/send-assessment`,{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:id})});
      const d=await r.json();
      showToast(d.success?(d.message||'Assessment sent!'):d.error||'Failed');
      if(d.success) load(false);
    } catch { showToast('Failed'); }
    finally { setBusy(null); }
  };

  const updateStatus = async (id:number, status:string) => {
    setBusy(id);
    try {
      await fetch(`${API}/update-status`,{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:id,status})});
      showToast('Status updated'); load(false);
    } catch { showToast('Failed'); }
    finally { setBusy(null); }
  };

  const totalMatched = useMemo(()=>
    (data?.resumes||[]).filter(r=>r.jdMatches.some(m=>m.matchPct>=THRESHOLD)).length,
  [data]);

  if(phase==='loading') return <PageSkel/>;
  if(phase==='ai') return (
    <AIScreen resumes={data?.totalResumes||0} jobs={data?.totalJobs||0}/>
  );
  if(phase==='error') return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
      height:'100%',gap:10,background:C.bg,fontFamily:"'Inter',-apple-system,sans-serif"}}>
      <style>{CSS}</style>
      <div style={{width:40,height:40,borderRadius:'50%',background:C.redBg,
        display:'flex',alignItems:'center',justifyContent:'center'}}>
        <svg width={18} height={18} fill="none" stroke={C.red} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        </svg>
      </div>
      <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0}}>Analysis failed</p>
      <p style={{fontSize:11,color:C.dim,margin:0}}>{err}</p>
      <button onClick={()=>load(true)} style={{padding:'6px 16px',background:C.indigo,
        color:'#fff',border:'none',borderRadius:6,fontSize:11,fontWeight:600,cursor:'pointer'}}>
        Retry
      </button>
    </div>
  );
  if(!data) return null;

  return (
    <>
      {toast&&(
        <div style={{position:'fixed',top:12,right:12,zIndex:300,background:'#1e293b',color:'#fff',
          padding:'8px 14px',borderRadius:6,fontSize:11,fontWeight:500,
          boxShadow:'0 4px 14px rgba(0,0,0,.2)',animation:'sp-in .15s ease'}}>
          {toast}
        </div>
      )}

      {/* Two screens — JD list OR detail */}
      {selJd ? (
        <DetailScreen
          jd={selJd}
          allResumes={data.resumes}
          onBack={()=>setSelJd(null)}
          onAssess={sendAssessment}
          onStatus={updateStatus}
          busy={busy}
        />
      ) : (
        <JDListPage
          data={data}
          totalMatched={totalMatched}
          search={search}
          setSearch={setSearch}
          onSelect={jd=>setSelJd(jd)}
          onReanalyze={()=>load(true)}
          onRefresh={()=>load(false)}
          onBack={onBack}
        />
      )}
    </>
  );
};
