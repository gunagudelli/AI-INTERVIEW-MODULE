import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import recruiterAPI from '../../services/recruiterAPI';
import BASE_URL from '../../Config';
import {
  Search, CheckCircle, XCircle, ExternalLink, Send,
  ChevronDown, ChevronUp, X, AlertCircle, Briefcase,
  MapPin, SlidersHorizontal, ArrowLeft, RefreshCw,
  Building2, Clock, Users, FileText, Activity, UserCheck,
  Mail, Zap, Database, Layers, Star,
} from 'lucide-react';

const BASE = BASE_URL;

/* ── design tokens ─────────────────────────────────────────── */
const T = {
  bg:'#ffffff', card:'#FFFFFF', border:'#F0F0F0', borderLt:'#F7F7F7',
  text:'#0F172A', textSec:'#475569', textMuted:'#94A3B8',
  primary:'#2563EB', pLight:'#EFF6FF', pBorder:'#DBEAFE',
  success:'#166534', sBg:'#DCFCE7', sBorder:'#D1FAE5',
  warning:'#92400E', wBg:'#FEF3C7', wBorder:'#FDE68A',
  error:'#991B1B',   eBg:'#FEE2E2', eBorder:'#FEE2E2',
  info:'#1D4ED8',    iBg:'#EFF6FF',
};

/* ── interfaces ────────────────────────────────────────────── */
interface Job { id:string; title:string; department:string; location:string; experience:number; status:string; total_applications?:number; skills:string[]; }
interface AppHist { job_id:string; job_title:string; status:string; match_score:number; assessment_sent:boolean; applied_at:string; recruiter_name:string; }
interface Candidate {
  id:string; name:string; email:string; phone:string; resume_url:string|null;
  source:string; experience_years:number; skills:string[]; match_score:number;
  matched_skills:string[]; missing_skills:string[]; reasoning:string; eligibility:string;
  status?:string; total_applications?:number; has_resume_data?:boolean;
  is_in_active_pipeline?:boolean; was_rejected?:boolean; was_hired?:boolean;
  assessment_sent?:boolean; rejection_count?:number;
  current_recruiter?:{name:string;email:string}|null;
  application_history?:AppHist[];
}
interface MatchResult { job_title:string; total:number; matched_count:number; unmatched_count:number; matched:Candidate[]; unmatched:Candidate[]; }
type AStatus = 'idle'|'loading'|'done'|'error';
interface JobState { status:AStatus; result?:MatchResult; error?:string; }

/* ── helpers ───────────────────────────────────────────────── */
const scoreCol = (s:number) => s>=80?T.success:s>=60?T.warning:T.error;
const scoreBg  = (s:number) => s>=80?T.sBg:s>=60?T.wBg:T.eBg;
const scoreTag = (s:number) => s>=80?'Strong':s>=60?'Fair':'Weak';

const STAGE_MAP: Record<string,[string,string]> = {
  pending:['#FFFFFF',T.textMuted], applied:[T.iBg,T.info],
  screened:[T.wBg,T.warning], shortlisted:[T.iBg,'#1D4ED8'],
  interview_sent:[T.wBg,T.warning], interview_scheduled:['#F5F3FF','#5B21B6'],
  rejected:[T.eBg,T.error], hired:[T.sBg,T.success],
};
const STAGE_LBL: Record<string,string> = {
  pending:'Pending',applied:'Applied',screened:'Screened',shortlisted:'Shortlisted',
  interview_sent:'Assessment Sent',interview_scheduled:'Scheduled',rejected:'Rejected',hired:'Hired',
};
const getSt  = (s?:string):[string,string] => STAGE_MAP[(s||'pending').toLowerCase()] ?? STAGE_MAP.pending;
const getStL = (s?:string) => STAGE_LBL[(s||'').toLowerCase()] ?? (s||'Pending');

/* ── CSS ───────────────────────────────────────────────────── */
const CSS = `
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  @keyframes slideIn  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
  @keyframes shimmer  { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
  @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.45} }
  @keyframes ripple   { 0%{transform:scale(.7);opacity:.6} 100%{transform:scale(2);opacity:0} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes prog     { from{width:0%} to{width:var(--w)} }
  @keyframes stepIn   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:none} }
  @keyframes barFill  { from{width:0} to{width:100%} }
  .card-h:hover { border-color:${T.pBorder} !important; }
  .trow:hover td { background:#ffffff !important; }
  .ghost:hover   { background:#FFFFFF !important; }
  .step-row { transition: background .3s, opacity .3s; }
`;

/* ── Spinner ───────────────────────────────────────────────── */
const Spin: React.FC<{s?:number;c?:string}> = ({s=16,c=T.primary}) => (
  <div style={{ width:s, height:s, border:`2.5px solid ${c}22`, borderTop:`2.5px solid ${c}`, borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
);

/* ── Score ring ────────────────────────────────────────────── */
const Ring: React.FC<{score:number;size?:number}> = ({score,size=48}) => {
  const c=scoreCol(score), r=size/2-4, ci=2*Math.PI*r, da=(score/100)*ci;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill={scoreBg(score)} stroke={c+'22'} strokeWidth={3}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={3} strokeDasharray={`${da} ${ci}`} strokeLinecap="round"/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:10, fontWeight:700, color:c, lineHeight:1 }}>{score}%</span>
        <span style={{ fontSize:6.5, fontWeight:600, color:c, textTransform:'uppercase', letterSpacing:'0.04em' }}>{scoreTag(score)}</span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   AI ANALYSIS SCREEN
   ══════════════════════════════════════════════════════════════ */
const AIAnalysisScreen: React.FC<{ jobCount:number }> = ({ jobCount }) => {
  const [tick, setTick]       = useState(0);
  const [pct,  setPct]        = useState(0);
  const [particles, setParticles] = useState<{id:number;x:number;y:number}[]>([]);
  const dots = tick % 4;

  // smooth fake progress: runs from 0 → 92 while waiting
  useEffect(() => {
    const t = setInterval(() => {
      setPct(p => {
        if (p < 30) return p + 2;
        if (p < 60) return p + 1;
        if (p < 85) return p + 0.5;
        if (p < 92) return p + 0.1;
        return p;
      });
    }, 300);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTick(p => p + 1);
      setParticles(p => [...p.slice(-6), { id: Date.now(), x: 38 + Math.random()*24, y: 30 + Math.random()*40 }]);
    }, 650);
    return () => clearInterval(t);
  }, []);

  const barPct = Math.round(pct);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px', background:'#FDF2F2', minHeight:380 }}>
      <style>{`
        @keyframes rbeam { 0%{left:-100%;opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{left:110%;opacity:0} }
        @keyframes rzap  { 0%,100%{transform:translate(-50%,-50%) scale(1);box-shadow:0 0 0 0 rgba(139,0,0,0.35)} 50%{transform:translate(-50%,-50%) scale(1.14);box-shadow:0 0 0 8px rgba(139,0,0,0)} }
        @keyframes rfloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes rpop  { 0%{opacity:1;transform:scale(0)} 60%{opacity:1;transform:scale(1) translate(var(--px),var(--py))} 100%{opacity:0;transform:scale(.4) translate(var(--px),var(--py))} }
        @keyframes rbar  { 0%{background-position:-300px 0} 100%{background-position:300px 0} }
        .rbeam{animation:rbeam 1.4s ease-in-out infinite}
        .rbeam:nth-child(2){animation-delay:.35s}
        .rbeam:nth-child(3){animation-delay:.7s}
        .rjd {animation:rfloat 2.8s ease-in-out infinite}
        .rrs {animation:rfloat 2.8s ease-in-out infinite reverse}
      `}</style>

      <div style={{ width:'100%', maxWidth:460 }}>
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F0F0F0', overflow:'hidden' }}>
          <div style={{ height:4, background:'linear-gradient(90deg,#8B0000,#b91c1c,#ef4444,#8B0000)' }}/>
          <div style={{ padding:'24px 28px 22px' }}>

            {/* JD card + beams + Resume card */}
            <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:20 }}>

              {/* JD card */}
              <div className="rjd" style={{ background:'#FDF2F2', border:'1.5px solid #FECDD3', borderRadius:10, padding:'12px', width:100, textAlign:'center', flexShrink:0, zIndex:2 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#8B0000', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 7px', boxShadow:'0 3px 8px rgba(139,0,0,0.3)' }}>
                  <Briefcase size={14} color="#fff"/>
                </div>
                <div style={{ fontSize:10, fontWeight:600, color:'#8B0000', marginBottom:2 }}>Job Descriptions</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#8B0000', lineHeight:1, marginBottom:6 }}>{jobCount}</div>
                {[80,55,68].map((w,i) => <div key={i} style={{ height:3, background:'#FECDD3', borderRadius:2, margin:'0 auto 3px', width:`${w}%` }}/>)}
              </div>

              {/* animated beams */}
              <div style={{ flex:1, height:60, position:'relative', overflow:'hidden', zIndex:1 }}>
                {[20,40,60].map((top,i) => (
                  <div key={i} style={{ position:'absolute', top:`${top}%`, left:0, right:0, height:2, background:'#FECDD3', borderRadius:1 }}>
                    <div className="rbeam" style={{ position:'absolute', top:0, width:'40%', height:'100%', background:'linear-gradient(90deg,transparent,#8B0000,#ef4444,transparent)', animationDelay:`${i*.35}s` }}/>
                  </div>
                ))}
                <div style={{ position:'absolute', top:'50%', left:'50%', width:28, height:28, borderRadius:'50%', background:'#8B0000', display:'flex', alignItems:'center', justifyContent:'center', animation:'rzap 1.6s ease-in-out infinite', zIndex:3, boxShadow:'0 0 0 4px #FDF2F2' }}>
                  <Zap size={12} color="#fff"/>
                </div>
                {particles.map(p => (
                  <div key={p.id} style={{ position:'absolute', top:`${p.y}%`, left:`${p.x}%`, width:5, height:5, borderRadius:'50%', background:'#b91c1c', animation:'rpop .8s ease-out forwards', ['--px' as any]:`${(Math.random()-.5)*22}px`, ['--py' as any]:`${(Math.random()-.5)*22}px` }}/>
                ))}
              </div>

              {/* Resume card */}
              <div className="rrs" style={{ background:'#FDF2F2', border:'1.5px solid #FECDD3', borderRadius:10, padding:'12px', width:100, textAlign:'center', flexShrink:0, zIndex:2 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'#b91c1c', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 7px', boxShadow:'0 3px 8px rgba(185,28,28,0.3)' }}>
                  <FileText size={14} color="#fff"/>
                </div>
                <div style={{ fontSize:10, fontWeight:600, color:'#8B0000', marginBottom:2 }}>Resumes</div>
                <div style={{ fontSize:22, fontWeight:800, color:'#b91c1c', lineHeight:1, marginBottom:6 }}>
                  <Spin s={14} c="#b91c1c"/>
                </div>
                {[85,60,72].map((w,i) => <div key={i} style={{ height:3, background:'#FECDD3', borderRadius:2, margin:'0 auto 3px', width:`${w}%` }}/>)}
              </div>
            </div>

            {/* title */}
            <div style={{ textAlign:'center', marginBottom:14 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#7f1d1d', letterSpacing:'-0.2px', marginBottom:2 }}>AI Matching{'.'.repeat(dots)}</div>
              <div style={{ fontSize:11, color:'#b91c1c' }}>
                Scanning <span style={{ fontWeight:700 }}>{jobCount}</span> JD{jobCount!==1?'s':''} against resume pool
              </div>
            </div>

            {/* progress */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:11, color:'#b91c1c', fontWeight:500 }}>Analyzing candidates…</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#8B0000' }}>{barPct}%</span>
              </div>
              <div style={{ height:7, background:'#FECDD3', borderRadius:99, overflow:'hidden', border:'1px solid #fca5a5' }}>
                <div style={{ height:'100%', width:`${barPct}%`, borderRadius:99, background:'linear-gradient(90deg,#8B0000,#b91c1c,#ef4444)', transition:'width 0.4s ease', backgroundSize:'300px 100%', animation:'rbar 2s linear infinite' }}/>
              </div>
            </div>

            {/* stats */}
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {[
                { l:'JDs Being Analyzed', v:jobCount,  c:'#8B0000', bg:'#FDF2F2' },
                { l:'AI Processing',      v:'Active',  c:'#b91c1c', bg:'#FDF2F2' },
              ].map(s => (
                <div key={s.l} style={{ background:s.bg, border:'1px solid #FECDD3', borderRadius:8, padding:'8px 10px', textAlign:'center' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:s.c, lineHeight:1, marginBottom:2 }}>{s.v}</div>
                  <div style={{ fontSize:9, fontWeight:600, color:'#b91c1c', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ textAlign:'center', marginTop:10, fontSize:10, color:'#b91c1c' }}>Matching every resume against all JDs — please wait</div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   DETAIL VIEW  — candidates for one JD
   ══════════════════════════════════════════════════════════════ */
const Detail: React.FC<{ job:Job; state:JobState; onBack:()=>void; onRetry:(j:Job)=>void }> = ({
  job, state, onBack, onRetry,
}) => {
  const { status, result, error } = state;
  const [tab,     setTab]     = useState<'matched'|'unmatched'>('matched');
  const [sortBy,  setSortBy]  = useState<'score'|'exp'>('score');
  const [fExp,    setFExp]    = useState('');
  const [fSkill,  setFSkill]  = useState('');
  const [showF,   setShowF]   = useState(false);
  const [open,    setOpen]    = useState<string|null>(null);
  const [inviting,setInviting]= useState<string|null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const list = useMemo(() => {
    if (!result) return [];
    let l = tab==='matched' ? result.matched||[] : result.unmatched||[];
    if (fExp)   l = l.filter(c => Number(c.experience_years) >= Number(fExp));
    if (fSkill) l = l.filter(c => c.skills?.some(s => s.toLowerCase().includes(fSkill.toLowerCase())));
    return [...l].sort((a,b) => sortBy==='score' ? b.match_score-a.match_score : b.experience_years-a.experience_years);
  }, [result,tab,fExp,fSkill,sortBy]);

  const invite = async (c:Candidate) => {
    if (!c.email || c.email==='—') return alert('No email.');
    setInviting(c.id);
    try {
      const r = await fetch(`${BASE}/api/recruiter/resume-pool/invite`, {
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${localStorage.getItem('recruiter_token')}`},
        body:JSON.stringify({ email:c.email, name:c.name, jobId:job.id, jobTitle:job.title }),
      });
      if (r.ok) setInvited(p => new Set(p).add(c.id));
      else alert('Invite failed.');
    } catch { alert('Invite failed.'); }
    finally { setInviting(null); }
  };

  const mc = result?.matched_count||0;
  const uc = result?.unmatched_count||0;

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Inter',sans-serif" }}>
      <style>{CSS}</style>

      {/* sticky header */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:'0 28px', position:'sticky', top:0, zIndex:30 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', height:50, display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={onBack} className="ghost" style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontWeight:500, color:T.primary, background:T.card, cursor:'pointer', fontFamily:'inherit', transition:'background 120ms' }}>
            <ArrowLeft size={12}/> Back
          </button>
          <div style={{ width:1, height:16, background:T.border }}/>
          <span style={{ fontSize:14, fontWeight:600, color:T.text, flex:1 }}>{job.title}</span>
          {job.department && <span style={{ fontSize:12, color:T.textMuted, display:'flex', alignItems:'center', gap:3 }}><Building2 size={10}/>{job.department}</span>}
          {job.location   && <span style={{ fontSize:12, color:T.textMuted, display:'flex', alignItems:'center', gap:3 }}><MapPin size={10}/>{job.location}</span>}
          {job.experience>0 && <span style={{ fontSize:12, color:T.textMuted, display:'flex', alignItems:'center', gap:3 }}><Clock size={10}/>{job.experience}+ yrs</span>}
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'20px 28px' }}>

        {status==='loading' && (
          <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'64px', textAlign:'center' }}>
            <Spin s={28}/><p style={{ fontSize:13, fontWeight:600, color:T.text, margin:'14px 0 4px' }}>Analyzing resume pool…</p>
            <p style={{ fontSize:12, color:T.textMuted, margin:0 }}>Matching candidates against <strong>{job.title}</strong></p>
          </div>
        )}

        {status==='error' && (
          <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.eBorder}`, padding:'52px', textAlign:'center' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:T.eBg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <AlertCircle size={20} style={{ color:T.error }}/>
            </div>
            <p style={{ fontSize:14, fontWeight:600, color:T.text, margin:'0 0 5px' }}>Analysis failed</p>
            <p style={{ fontSize:12, color:T.textMuted, margin:'0 0 14px' }}>{error||'Something went wrong.'}</p>
            <button onClick={() => onRetry(job)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 18px', background:T.primary, color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              <RefreshCw size={12}/> Retry
            </button>
          </div>
        )}

        {status==='done' && result && (
          <>
            {/* summary strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
              {[
                { l:'Total',          v:result.total,    ic:FileText,    vc:T.primary, bg:T.iBg },
                { l:'Matched ≥80%',   v:mc,              ic:CheckCircle, vc:T.success, bg:T.sBg },
                { l:'Below 80%',      v:uc,              ic:XCircle,     vc:T.error,   bg:T.eBg },
                { l:'Active Pipeline',v:(result.matched||[]).filter(c=>c.is_in_active_pipeline).length, ic:Activity, vc:T.warning, bg:T.wBg },
                { l:'New to Pool',    v:(result.matched||[]).filter(c=>!c.total_applications&&!c.was_hired&&!c.was_rejected).length, ic:UserCheck, vc:'#0891B2', bg:'#ECFEFF' },
              ].map(s => {
                const Icon=s.ic;
                return (
                <div key={s.l} style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:7, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={13} style={{ color:s.vc }}/>
                    </div>
                    <div>
                      <div style={{ fontSize:17, fontWeight:700, color:s.vc, lineHeight:1, letterSpacing:'-0.02em' }}>{s.v}</div>
                      <div style={{ fontSize:10, color:T.textMuted, marginTop:2, fontWeight:500 }}>{s.l}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* tab + filter bar */}
            <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, marginBottom:12, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', borderBottom:`1px solid ${T.borderLt}`, flexWrap:'wrap' }}>
                <div style={{ display:'flex' }}>
                  {([['matched',`Matched ≥80% (${mc})`,T.success],['unmatched',`Below 80% (${uc})`,T.error]] as const).map(([t,lbl,ac]) => (
                    <button key={t} onClick={() => setTab(t)} style={{ padding:'10px 14px', fontSize:12.5, fontWeight:500, border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', color:tab===t?ac:T.textMuted, borderBottom:tab===t?`2px solid ${ac}`:'2px solid transparent' }}>
                      {lbl}
                    </button>
                  ))}
                </div>
                <div style={{ display:'flex', gap:6, padding:'6px 0' }}>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, color:T.textSec, background:T.card, outline:'none', fontFamily:'inherit', cursor:'pointer' }}>
                    <option value="score">By Score</option>
                    <option value="exp">By Experience</option>
                  </select>
                  <button onClick={() => setShowF(p=>!p)} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:'inherit', background:showF?T.iBg:T.card, color:showF?T.primary:T.textSec }}>
                    <SlidersHorizontal size={11}/> Filters
                  </button>
                </div>
              </div>
              {showF && (
                <div style={{ display:'flex', gap:12, padding:'10px 18px', background:T.bg, borderBottom:`1px solid ${T.borderLt}`, flexWrap:'wrap', alignItems:'flex-end' }}>
                  <div><label style={{ fontSize:11, fontWeight:600, color:T.textSec, display:'block', marginBottom:3 }}>Min. Experience (yrs)</label>
                    <input type="number" min={0} value={fExp} onChange={e=>setFExp(e.target.value)} placeholder="e.g. 2" style={{ padding:'5px 9px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:100, outline:'none', fontFamily:'inherit' }}/></div>
                  <div><label style={{ fontSize:11, fontWeight:600, color:T.textSec, display:'block', marginBottom:3 }}>Skill</label>
                    <input type="text" value={fSkill} onChange={e=>setFSkill(e.target.value)} placeholder="e.g. React, Java" style={{ padding:'5px 9px', border:`1px solid ${T.border}`, borderRadius:6, fontSize:12, width:160, outline:'none', fontFamily:'inherit' }}/></div>
                  {(fExp||fSkill) && <button onClick={() => {setFExp('');setFSkill('');}} style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 9px', border:`1px solid ${T.eBorder}`, borderRadius:6, background:T.eBg, color:T.error, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}><X size={10}/> Clear</button>}
                </div>
              )}
            </div>

            {/* candidate table */}
            {list.length===0 ? (
              <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:52, textAlign:'center' }}>
                <Users size={26} style={{ color:'#E2E8F0', marginBottom:8 }}/><p style={{ fontSize:13, color:T.textMuted, margin:0 }}>No candidates in this category</p>
              </div>
            ) : (
              <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, overflow:'hidden' }}>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
                    <thead>
                      <tr style={{ background:'#FFFFFF', borderBottom:`1px solid ${T.border}` }}>
                        {['#','Candidate','Email / Phone','Match %','Stage','Recruiter','Last Activity','Actions'].map(h => (
                          <th key={h} style={{ padding:'9px 13px', textAlign:'left', fontSize:11.5, fontWeight:600, color:T.textMuted, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((c,idx) => {
                        const [sb,sc] = getSt(c.status);
                        const hist    = c.application_history||[];
                        const totApp  = c.total_applications||hist.length||0;
                        const isOpen  = open===c.id;
                        const lastD   = hist[0]?.applied_at;

                        return (
                          <React.Fragment key={c.id}>
                            <tr className="trow" style={{ borderBottom:`1px solid ${T.borderLt}`, cursor:'pointer' }} onClick={() => setOpen(isOpen?null:c.id)}>

                              <td style={{ padding:'10px 13px', fontSize:12, color: idx<3?T.warning:T.textMuted, fontWeight:600 }}>#{idx+1}</td>

                              <td style={{ padding:'10px 13px' }}>
                                <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                                  <Ring score={c.match_score} size={40}/>
                                  <div>
                                    <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{c.name}</div>
                                    {c.experience_years>0 && <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{c.experience_years} yrs exp</div>}
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding:'10px 13px' }}>
                                <div style={{ fontSize:12, color:T.textSec }}>{c.email!=='—'?c.email:'—'}</div>
                                {c.phone!=='—' && <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{c.phone}</div>}
                              </td>

                              <td style={{ padding:'10px 13px' }}>
                                <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11.5, fontWeight:600, background:scoreBg(c.match_score), color:scoreCol(c.match_score) }}>
                                  {c.match_score}%
                                </span>
                              </td>

                              <td style={{ padding:'10px 13px' }}>
                                <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:sb, color:sc, whiteSpace:'nowrap' }}>{getStL(c.status)}</span>
                                {c.was_hired && <div style={{ fontSize:10, color:T.success, fontWeight:600, marginTop:2 }}>✓ Hired</div>}
                                {c.was_rejected&&!c.was_hired && <div style={{ fontSize:10, color:T.error, fontWeight:600, marginTop:2 }}>✗ Rejected</div>}
                              </td>

                              <td style={{ padding:'10px 13px', fontSize:12, color:T.textSec }}>{c.current_recruiter?.name||'—'}</td>

                              <td style={{ padding:'10px 13px', fontSize:12, color:T.textMuted, whiteSpace:'nowrap' }}>
                                {lastD ? new Date(lastD).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                              </td>

                              <td style={{ padding:'10px 13px' }}>
                                <div style={{ display:'flex', gap:4, alignItems:'center' }} onClick={e => e.stopPropagation()}>
                                  {c.resume_url && (
                                    <a href={c.resume_url} target="_blank" rel="noreferrer" style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', border:`1px solid ${T.border}`, borderRadius:5, fontSize:11, color:T.textSec, textDecoration:'none', whiteSpace:'nowrap' }}>
                                      <ExternalLink size={9}/> CV
                                    </a>
                                  )}
                                  {tab==='matched' && (
                                    <button onClick={() => invite(c)} disabled={inviting===c.id||invited.has(c.id)} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 9px', border:'none', borderRadius:5, fontSize:11, fontWeight:600, cursor: invited.has(c.id)?'default':'pointer', whiteSpace:'nowrap', fontFamily:'inherit', background: invited.has(c.id)?T.sBg:inviting===c.id?'#FFFFFF':T.primary, color: invited.has(c.id)?T.success:inviting===c.id?T.textMuted:'#fff' }}>
                                      {inviting===c.id?<Spin s={9} c="#fff"/>:<Send size={9}/>}
                                      {invited.has(c.id)?'Invited ✓':inviting===c.id?'…':'Invite'}
                                    </button>
                                  )}
                                  {totApp>0 && (
                                    <button onClick={() => setOpen(isOpen?null:c.id)} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px', border:`1px solid ${T.pBorder}`, borderRadius:5, fontSize:11, color:T.primary, background:'none', cursor:'pointer', fontFamily:'inherit' }}>
                                      {isOpen?<ChevronUp size={9}/>:<ChevronDown size={9}/>} History
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* expanded row */}
                            {isOpen && (
                              <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                                <td colSpan={8} style={{ padding:0 }}>
                                  <div style={{ background:'#FFFFFF', padding:'14px 16px', animation:'fadeUp .15s ease' }}>

                                    {/* skills */}
                                    {((c.matched_skills||[]).length>0||(c.missing_skills||[]).length>0) && (
                                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom: c.reasoning?10:0 }}>
                                        {(c.matched_skills||[]).length>0 && (
                                          <div style={{ background:T.sBg, borderRadius:6, padding:'9px 11px', border:`1px solid ${T.sBorder}` }}>
                                            <div style={{ fontSize:10, fontWeight:700, color:T.success, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>✓ Matched ({c.matched_skills.length})</div>
                                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                              {c.matched_skills.map(s => <span key={s} style={{ padding:'2px 7px', borderRadius:4, fontSize:11, fontWeight:500, background:'#fff', color:T.success, border:`1px solid ${T.sBorder}` }}>{s}</span>)}
                                            </div>
                                          </div>
                                        )}
                                        {(c.missing_skills||[]).length>0 && (
                                          <div style={{ background:T.eBg, borderRadius:6, padding:'9px 11px', border:`1px solid ${T.eBorder}` }}>
                                            <div style={{ fontSize:10, fontWeight:700, color:T.error, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:5 }}>✗ Missing ({c.missing_skills.length})</div>
                                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                                              {c.missing_skills.map(s => <span key={s} style={{ padding:'2px 7px', borderRadius:4, fontSize:11, fontWeight:500, background:'#fff', color:T.error, border:`1px solid ${T.eBorder}` }}>{s}</span>)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* AI reasoning */}
                                    {c.reasoning && (
                                      <div style={{ background:T.pLight, borderLeft:`3px solid ${T.primary}`, borderRadius:6, padding:'8px 12px', marginBottom: hist.length?10:0 }}>
                                        <div style={{ fontSize:10, fontWeight:700, color:T.primary, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:3, display:'flex', alignItems:'center', gap:4 }}>
                                          <Zap size={9}/> AI Reasoning
                                        </div>
                                        <div style={{ fontSize:12, color:T.textSec, lineHeight:1.6 }}>{c.reasoning}</div>
                                      </div>
                                    )}

                                    {/* history table */}
                                    {hist.length>0 && (
                                      <div>
                                        <div style={{ fontSize:11, fontWeight:600, color:T.textSec, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:7, display:'flex', alignItems:'center', gap:4 }}>
                                          <Mail size={10}/> Application History
                                        </div>
                                        <div style={{ overflowX:'auto' }}>
                                          <table style={{ width:'100%', borderCollapse:'collapse', background:T.card, borderRadius:6, border:`1px solid ${T.border}`, fontSize:12 }}>
                                            <thead>
                                              <tr style={{ background:'#FFFFFF' }}>
                                                {['Job Title','Recruiter','Status','Score','Assessment','Applied'].map(h => (
                                                  <th key={h} style={{ padding:'7px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:T.textMuted, borderBottom:`1px solid ${T.border}`, whiteSpace:'nowrap' }}>{h}</th>
                                                ))}
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {hist.map((h,i) => {
                                                const [hb,hc]=getSt(h.status);
                                                return (
                                                  <tr key={i} className="trow" style={{ borderTop: i>0?`1px solid ${T.borderLt}`:'none' }}>
                                                    <td style={{ padding:'7px 12px', fontWeight:500, color:T.text }}>{h.job_title||'—'}</td>
                                                    <td style={{ padding:'7px 12px', color:T.textSec }}>{h.recruiter_name||'—'}</td>
                                                    <td style={{ padding:'7px 12px' }}><span style={{ fontSize:11, fontWeight:500, padding:'2px 7px', borderRadius:20, background:hb, color:hc }}>{getStL(h.status)}</span></td>
                                                    <td style={{ padding:'7px 12px', fontWeight:600, color:h.match_score?scoreCol(h.match_score):T.textMuted }}>{h.match_score?`${h.match_score}%`:'—'}</td>
                                                    <td style={{ padding:'7px 12px' }}>{h.assessment_sent?<span style={{ color:T.primary, fontWeight:500, display:'flex', alignItems:'center', gap:3 }}><CheckCircle size={10}/> Sent</span>:<span style={{ color:'#D1D5DB' }}>—</span>}</td>
                                                    <td style={{ padding:'7px 12px', color:T.textMuted, whiteSpace:'nowrap' }}>{h.applied_at?new Date(h.applied_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
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
                </div>
                <div style={{ padding:'8px 13px', borderTop:`1px solid ${T.borderLt}`, background:'#ffffff' }}>
                  <span style={{ fontSize:11.5, color:T.textMuted }}>Showing {list.length} candidate{list.length!==1?'s':''}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN  — JD list + AI overlay
   ══════════════════════════════════════════════════════════════ */
const ResumePool: React.FC = () => {
  const navigate   = useNavigate();
  const [jobs,     setJobs]     = useState<Job[]>([]);
  const [states,   setStates]   = useState<Record<string,JobState>>({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const runRef = useRef(0);

  const totalResumes   = useMemo(() => Object.values(states).reduce((a,s)=>a+(s.result?.total||0),0), [states]);
  const totalMatched   = useMemo(() => Object.values(states).reduce((a,s)=>a+(s.result?.matched_count||0),0), [states]);
  const totalUnmatched = useMemo(() => Object.values(states).reduce((a,s)=>a+(s.result?.unmatched_count||0),0), [states]);
  const doneCount      = Object.values(states).filter(s=>s.status==='done').length;
  const loadingCount   = Object.values(states).filter(s=>s.status==='loading').length;
  // estimate total resumes from any completed job, fall back to job count for display
  const resumeEstimate = useMemo(() => {
    const first = Object.values(states).find(s=>s.status==='done'&&s.result);
    return first?.result?.total ?? 0;
  }, [states]);

  useEffect(() => {
    recruiterAPI.getAllJobs()
      .then((list:Job[]) => {
        const active = list.filter((j:Job)=>!j.status||j.status==='active');
        setJobs(active);
        const init: Record<string,JobState> = {};
        active.forEach(j => { init[j.id]={status:'idle'}; });
        setStates(init);
        analyzeAll(active);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analyzeAll = async (list:Job[]) => {
    const runId = ++runRef.current;
    setStates(p => {
      const n={...p};
      list.forEach(j => { n[j.id]={status:'loading'}; });
      return n;
    });
    for (const job of list) {
      if (runRef.current!==runId) return;
      try {
        const res:MatchResult = await recruiterAPI.matchResumePool(job.id);
        if (runRef.current!==runId) return;
        setStates(p => ({...p,[job.id]:{status:'done',result:res}}));
      } catch (e:any) {
        if (runRef.current!==runId) return;
        setStates(p => ({...p,[job.id]:{status:'error',error:e?.response?.data?.error||'Failed'}}));
      }
    }
  };

  const retryOne = async (job:Job) => {
    setStates(p => ({...p,[job.id]:{status:'loading'}}));
    try {
      const res:MatchResult = await recruiterAPI.matchResumePool(job.id);
      setStates(p => ({...p,[job.id]:{status:'done',result:res}}));
    } catch (e:any) {
      setStates(p => ({...p,[job.id]:{status:'error',error:e?.response?.data?.error||'Failed'}}));
    }
  };

  /* ── detail view ── */
  if (selectedId && states[selectedId]) {
    const job = jobs.find(j => j.id===selectedId)!;
    return <Detail job={job} state={states[selectedId]} onBack={() => setSelectedId(null)} onRetry={retryOne}/>;
  }

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Inter',sans-serif", animation:'fadeUp .2s ease' }}>
      <style>{CSS}</style>

      {/* header */}
      <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:'0 28px', position:'sticky', top:0, zIndex:30 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', height:54, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:11 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:T.iBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Database size={15} style={{ color:T.primary }}/>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:T.text, lineHeight:1, letterSpacing:'-0.2px' }}>Resume Super Pool</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>
                {doneCount} of {jobs.length} jobs analyzed · click a row to view candidates
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {!loading && jobs.length>0 && (
              <button onClick={() => analyzeAll(jobs)} className="ghost" style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', border:`1px solid ${T.border}`, borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', background:T.card, color:T.textSec, fontFamily:'inherit', transition:'background 120ms' }}>
                <RefreshCw size={11}/> Re-analyze
              </button>
            )}
            <div style={{ position:'relative' }}>
              <Search size={11} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:T.textMuted }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…"
                style={{ paddingLeft:26, paddingRight:10, paddingTop:7, paddingBottom:7, border:`1px solid ${T.border}`, borderRadius:7, fontSize:12, outline:'none', width:190, color:T.text, background:T.card, fontFamily:'inherit' }}/>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'18px 28px' }}>

        {/* summary cards — only after analysis */}
        {doneCount>0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:16 }}>
            {[
              { l:'Total Resumes', v:totalResumes,    ic:FileText,    vc:T.primary, bg:T.iBg },
              { l:'Active JDs',   v:jobs.length,      ic:Briefcase,   vc:T.textSec, bg:'#FFFFFF' },
              { l:'Matched',      v:totalMatched,     ic:CheckCircle, vc:T.success, bg:T.sBg },
              { l:'Unmatched',    v:totalUnmatched,   ic:XCircle,     vc:T.error,   bg:T.eBg },
            ].map(s => {
              const Icon=s.ic;
              return (
              <div key={s.l} style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'13px 16px', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:7, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={14} style={{ color:s.vc }}/>
                  </div>
                  <div>
                    <div style={{ fontSize:18, fontWeight:700, color:s.vc, lineHeight:1, letterSpacing:'-0.02em' }}>{s.v}</div>
                    <div style={{ fontSize:10.5, color:T.textMuted, marginTop:2, fontWeight:500 }}>{s.l}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:72 }}><Spin s={26}/></div>
        ) : !loading && loadingCount > 0 && doneCount === 0 ? (
          <AIAnalysisScreen jobCount={jobs.length}/>
        ) : filtered.length===0 ? (
          <div style={{ background:T.card, borderRadius:8, border:`2px dashed ${T.border}`, padding:'64px 24px', textAlign:'center' }}>
            <Briefcase size={30} style={{ color:'#E2E8F0', marginBottom:10 }}/>
            <p style={{ fontSize:14, fontWeight:600, color:T.textSec, margin:'0 0 5px' }}>No active jobs found</p>
            <p style={{ fontSize:12, color:T.textMuted, margin:'0 0 16px' }}>Create a job to start analyzing your resume pool</p>
            <button onClick={() => navigate('/recruiter/jobs/create')} style={{ padding:'8px 18px', background:T.primary, color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Create Job
            </button>
          </div>
        ) : (
          /* ── accordion JD list ── */
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(job => {
              const s   = states[job.id]||{status:'idle'};
              const isDone = s.status==='done';
              const isErr  = s.status==='error';
              const res    = s.result;

              return (
                <div
                  key={job.id}
                  className={isDone?'card-h':''}
                  onClick={() => isDone && setSelectedId(job.id)}
                  style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'15px 18px', display:'flex', alignItems:'center', gap:16, cursor: isDone?'pointer':'default', opacity: isErr?.7:1, transition:'border-color .15s' }}
                >
                  <div style={{ width:38, height:38, borderRadius:8, background:T.iBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Briefcase size={17} style={{ color:T.primary }}/>
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:3 }}>
                      <span style={{ fontSize:14, fontWeight:600, color:T.text, letterSpacing:'-0.2px' }}>{job.title}</span>
                      <span style={{ fontSize:10, fontWeight:600, padding:'1px 7px', borderRadius:20, background:T.sBg, color:T.success, border:`1px solid ${T.sBorder}` }}>Active</span>
                    </div>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                      {job.department && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:T.textMuted }}><Building2 size={10}/>{job.department}</span>}
                      {job.location   && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:T.textMuted }}><MapPin size={10}/>{job.location}</span>}
                      {job.experience>0 && <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:T.textMuted }}><Clock size={10}/>{job.experience}+ yrs</span>}
                      <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:T.textMuted }}><Users size={10}/>{job.total_applications||0} applicants</span>
                    </div>
                  </div>

                  {isDone && res && (
                    <div style={{ display:'flex', alignItems:'stretch', flexShrink:0, border:`1px solid ${T.border}`, borderRadius:8, overflow:'hidden' }}>
                      {[
                        { l:'Total',     v:res.total,           c:T.primary, bg:'#F8FAFF' },
                        { l:'Matched',   v:res.matched_count,   c:T.success, bg:T.sBg    },
                        { l:'Unmatched', v:res.unmatched_count, c:T.error,   bg:T.eBg    },
                      ].map((st,i) => (
                        <div key={st.l} style={{ textAlign:'center', padding:'9px 16px', borderLeft: i>0?`1px solid ${T.border}`:'none', background:st.bg, minWidth:66 }}>
                          <div style={{ fontSize:18, fontWeight:700, color:st.c, lineHeight:1, letterSpacing:'-0.02em' }}>{st.v}</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:3, fontWeight:500, whiteSpace:'nowrap' }}>{st.l}</div>
                        </div>
                      ))}
                      <div style={{ padding:'0 10px', borderLeft:`1px solid ${T.border}`, background:T.card, display:'flex', alignItems:'center' }}>
                        <ChevronDown size={13} style={{ color:T.primary }}/>
                      </div>
                    </div>
                  )}

                  {s.status==='loading' && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:T.textMuted, flexShrink:0 }}>
                      <Spin s={13}/> Analyzing…
                    </div>
                  )}

                  {isErr && (
                    <button onClick={e => {e.stopPropagation();retryOne(job);}} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:500, color:T.primary, background:T.iBg, border:`1px solid ${T.pBorder}`, borderRadius:6, padding:'5px 11px', cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}>
                      <RefreshCw size={11}/> Retry
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumePool;
