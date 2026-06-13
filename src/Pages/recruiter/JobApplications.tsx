// import React, { useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { ArrowLeft, MapPin, Clock, Edit, Search, ChevronDown } from 'lucide-react';
// import recruiterAPI from '../../services/recruiterAPI';

// const T = {
//   bg:'#F8FAFC', card:'#FFFFFF', border:'#E5E7EB', borderLt:'#F1F5F9',
//   text:'#0F172A', textSec:'#475569', textMuted:'#94A3B8',
//   primary:'#2563EB', pLight:'#EFF6FF',
//   success:'#166534', sBg:'#DCFCE7', sBorder:'#BBF7D0',
//   warning:'#92400E', wBg:'#FEF3C7',
//   error:'#991B1B',   eBg:'#FEE2E2', eBorder:'#FECACA',
//   info:'#1D4ED8',    iBg:'#DBEAFE',
// };

// const CSS = `
//   @keyframes spin   { to{transform:rotate(360deg)} }
//   @keyframes fadeUp { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
//   .tr:hover td  { background:#F8FAFC !important; }
//   .btn-sm:hover { filter:brightness(.92); }
//   th { white-space:nowrap; }
// `;

// /* ── status maps ─────────────────────────────────────────── */
// const STAGE: Record<string,[string,string]> = {
//   applied:             [T.iBg,      T.info],
//   pending:             ['#F9FAFB',  T.textMuted],
//   screened:            [T.wBg,      T.warning],
//   shortlisted:         [T.iBg,      '#1D4ED8'],
//   interview_sent:      ['#FEF3C7',  '#92400E'],
//   interview_scheduled: ['#F5F3FF',  '#5B21B6'],
//   rejected:            [T.eBg,      T.error],
//   hired:               [T.sBg,      T.success],
// };
// const STAGE_LBL: Record<string,string> = {
//   applied:'Applied', pending:'Pending', screened:'Screened',
//   shortlisted:'Shortlisted', interview_sent:'Assessment Sent',
//   interview_scheduled:'Scheduled', rejected:'Rejected', hired:'Hired',
// };

// const StageBadge: React.FC<{status:string}> = ({status}) => {
//   const [bg,col] = STAGE[status?.toLowerCase()] ?? ['#F9FAFB', T.textMuted];
//   return (
//     <span style={{ display:'inline-block', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:500, background:bg, color:col, whiteSpace:'nowrap' }}>
//       {STAGE_LBL[status?.toLowerCase()] || status || 'Pending'}
//     </span>
//   );
// };

// const ScorePill: React.FC<{score:number}> = ({score}) => {
//   const col = score>=70 ? T.success : score>=50 ? T.warning : T.error;
//   const bg  = score>=70 ? T.sBg    : score>=50 ? T.wBg     : T.eBg;
//   return <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11.5, fontWeight:600, background:bg, color:col, whiteSpace:'nowrap' }}>{score}%</span>;
// };

// const Avatar: React.FC<{name:string}> = ({name}) => (
//   <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, background:T.iBg, display:'flex', alignItems:'center', justifyContent:'center', color:T.primary, fontWeight:700, fontSize:10.5 }}>
//     {(name||'?')[0].toUpperCase()}
//   </div>
// );

// /* ════════════════════════════════════════════════════════════ */
// const JobApplications: React.FC = () => {
//   const navigate  = useNavigate();
//   const {jobId}   = useParams<{jobId:string}>();
//   const [apps,     setApps]    = useState<any[]>([]);
//   const [job,      setJob]     = useState<any>(null);
//   const [loading,  setLoading] = useState(true);
//   const [actLoad,  setActLoad] = useState<string|null>(null);
//   const [decLoad,  setDecLoad] = useState<string|null>(null);
//   const [stFilter, setStFilter]= useState('');
//   const [search,   setSearch]  = useState('');

//   useEffect(() => {
//     if (!jobId) return;
//     Promise.all([
//       recruiterAPI.getCandidatesByJob(jobId).then(setApps).catch(() => setApps([])),
//       recruiterAPI.getJobById(jobId).then(r => setJob(r?.job ?? r)).catch(() => {}),
//     ]).finally(() => setLoading(false));
//   }, [jobId]);

//   const handleDecision = async (id:string, decision:'hired'|'rejected', email:string) => {
//     if (!window.confirm(`${decision==='hired'?'Hire':'Reject'} this candidate?`)) return;
//     setDecLoad(id+decision);
//     try {
//       const r = await recruiterAPI.sendDecision(id, decision);
//       alert(r.emailSent ? `Email sent to ${r.sentTo}.` : 'Decision recorded.');
//       setApps(p => p.map(a => a.id===id ? {...a, finalDecision:decision, status:decision} : a));
//     } catch { alert('Failed'); }
//     finally { setDecLoad(null); }
//   };

//   const handleSendExam = async (id:string) => {
//     setActLoad(id+'exam');
//     try {
//       const r = await recruiterAPI.sendAssessment(id);
//       alert(r.emailSent ? `Sent to ${r.sentTo}` : 'Link generated');
//       setApps(p => p.map(a => a.id===id ? {...a, status:'interview_sent'} : a));
//     } catch { alert('Failed'); }
//     finally { setActLoad(null); }
//   };

//   if (loading) return (
//     <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80vh', background:T.bg }}>
//       <div style={{ width:22, height:22, border:'2px solid #E5E7EB', borderTop:`2px solid ${T.primary}`, borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
//     </div>
//   );

//   const skills:string[] = job?.skills ?? job?.required_skills ?? [];
//   const filtered = apps.filter(a => {
//     if (stFilter && a.status !== stFilter) return false;
//     if (search) { const q=search.toLowerCase(); if (!a.name?.toLowerCase().includes(q) && !a.email?.toLowerCase().includes(q)) return false; }
//     return true;
//   });

//   const statCounts = [
//     { l:'Total',       n: apps.length,                                             c:T.primary, bg:T.pLight },
//     { l:'Shortlisted', n: apps.filter(a=>a.status==='shortlisted').length,         c:T.info,    bg:T.iBg   },
//     { l:'Assessed',    n: apps.filter(a=>a.status==='interview_sent').length,       c:T.warning, bg:T.wBg   },
//     { l:'Hired',       n: apps.filter(a=>a.status==='hired').length,               c:T.success, bg:T.sBg   },
//     { l:'Rejected',    n: apps.filter(a=>a.status==='rejected').length,            c:T.error,   bg:T.eBg   },
//   ];

//   return (
//     <div style={{ minHeight:'100vh', background:T.bg, fontFamily:"'Inter',sans-serif", animation:'fadeUp .2s ease' }}>
//       <style>{CSS}</style>

//       {/* ── Header ── */}
//       <div style={{ background:T.card, borderBottom:`1px solid ${T.border}`, padding:'12px 28px', display:'flex', alignItems:'center', gap:10, position:'sticky', top:0, zIndex:30 }}>
//         <button onClick={() => navigate(-1)} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:T.textSec, cursor:'pointer', fontSize:12.5, padding:0, fontFamily:'inherit' }}>
//           <ArrowLeft size={14}/> Back
//         </button>
//         <span style={{ color:T.border }}>|</span>
//         <h1 style={{ fontSize:15, fontWeight:600, color:T.text, margin:0, flex:1 }}>{job?.title||'Applications'}</h1>
//         {job?.status && <StageBadge status={job.status}/>}
//       </div>

//       <div style={{ maxWidth:1320, margin:'0 auto', padding:'18px 28px' }}>

//         {/* Job card */}
//         {job && (
//           <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'16px 20px', marginBottom:14 }}>
//             <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom: skills.length ? 10 : 0 }}>
//               <div>
//                 <h2 style={{ fontSize:16, fontWeight:600, color:T.text, margin:'0 0 5px', letterSpacing:'-0.2px' }}>{job.title}</h2>
//                 <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
//                   {job.location && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:T.textSec }}><MapPin size={11}/>{job.location}</span>}
//                   {job.type     && <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:T.textSec }}><Clock size={11}/>{job.type}</span>}
//                   {(job.experience_min??job.experience) && <span style={{ fontSize:12.5, color:T.textSec }}>{job.experience_min??job.experience}+ yrs</span>}
//                 </div>
//               </div>
//               <button onClick={() => navigate(`/recruiter/jobs/${jobId}/edit`)} style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:'#F9FAFB', border:`1px solid ${T.border}`, borderRadius:6, cursor:'pointer', fontSize:12, color:T.textSec, fontFamily:'inherit', flexShrink:0 }}>
//                 <Edit size={11}/> Edit
//               </button>
//             </div>
//             {skills.length > 0 && (
//               <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
//                 {skills.map(sk => <span key={sk} style={{ padding:'2px 8px', background:T.iBg, color:T.info, borderRadius:5, fontSize:11.5, fontWeight:500 }}>{sk}</span>)}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Stat pills */}
//         <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
//           {statCounts.map(s => (
//             <button key={s.l} onClick={() => setStFilter(stFilter===s.l.toLowerCase()&&s.l!=='Total'?'':s.l==='Total'?'':s.l.toLowerCase())} style={{ padding:'5px 13px', background:s.bg, borderRadius:7, display:'flex', alignItems:'center', gap:6, border:'none', cursor:'pointer', fontFamily:'inherit' }}>
//               <span style={{ fontSize:13.5, fontWeight:700, color:s.c }}>{s.n}</span>
//               <span style={{ fontSize:12, color:s.c, opacity:.8 }}>{s.l}</span>
//             </button>
//           ))}
//         </div>

//         {/* Filters */}
//         <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
//           <div style={{ position:'relative', flex:1, minWidth:220 }}>
//             <Search size={12} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:T.textMuted }}/>
//             <input placeholder="Search candidate or email…" value={search} onChange={e => setSearch(e.target.value)}
//               style={{ width:'100%', padding:'7px 10px 7px 29px', border:`1px solid ${T.border}`, borderRadius:7, fontSize:12.5, outline:'none', background:T.card, boxSizing:'border-box', fontFamily:'inherit' }}/>
//           </div>
//           <div style={{ position:'relative' }}>
//             <select value={stFilter} onChange={e => setStFilter(e.target.value)} style={{ padding:'7px 30px 7px 12px', border:`1px solid ${T.border}`, borderRadius:7, fontSize:12.5, background:T.card, outline:'none', fontFamily:'inherit', color:T.textSec, minWidth:160, appearance:'none' }}>
//               <option value="">All Stages</option>
//               {Object.entries(STAGE_LBL).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
//             </select>
//             <ChevronDown size={11} style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', color:T.textMuted, pointerEvents:'none' }}/>
//           </div>
//         </div>

//         {/* Table */}
//         {filtered.length === 0 ? (
//           <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, padding:'52px', textAlign:'center' }}>
//             <p style={{ fontSize:13.5, color:T.textMuted, margin:0 }}>No applications found</p>
//           </div>
//         ) : (
//           <div style={{ background:T.card, borderRadius:8, border:`1px solid ${T.border}`, overflow:'hidden' }}>
//             <div style={{ overflowX:'auto' }}>
//               <table style={{ width:'100%', borderCollapse:'collapse', minWidth:860 }}>
//                 <thead>
//                   <tr style={{ background:'#F9FAFB', borderBottom:`1px solid ${T.border}` }}>
//                     {['Candidate','Match Score','Assessment','Stage','Last Activity','Actions'].map(h => (
//                       <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11.5, fontWeight:600, color:T.textMuted, letterSpacing:'0.02em' }}>{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filtered.map((a:any) => {
//                     const score     = parseFloat(a.match_score ?? a.score ?? 0);
//                     const lastDate  = a.applied_at || a.appliedAt;
//                     const examDone  = a.examCompleted || a.interviewScore != null;

//                     return (
//                       <tr key={a.id} className="tr" style={{ borderBottom:`1px solid ${T.borderLt}` }}>

//                         {/* Candidate — name + email + phone */}
//                         <td style={{ padding:'11px 14px' }}>
//                           <div style={{ display:'flex', alignItems:'center', gap:8 }}>
//                             <Avatar name={a.name}/>
//                             <div>
//                               <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{a.name}</div>
//                               <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{a.email}</div>
//                               {a.phone && <div style={{ fontSize:11, color:T.textMuted }}>{a.phone}</div>}
//                             </div>
//                           </div>
//                         </td>

//                         {/* Match Score */}
//                         <td style={{ padding:'11px 14px' }}><ScorePill score={score}/></td>

//                         {/* Assessment */}
//                         <td style={{ padding:'11px 14px' }}>
//                           {examDone ? (
//                             <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
//                               <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:T.iBg, color:T.info, width:'fit-content' }}>Completed</span>
//                               {a.interviewScore!=null && (
//                                 <span style={{ fontSize:11, color: a.interviewScore>=60?T.success:T.error, fontWeight:500 }}>Score: {a.interviewScore}%</span>
//                               )}
//                               {a.finalDecision && (
//                                 <span style={{ fontSize:11, fontWeight:600, color: a.finalDecision==='hired'?T.success:T.error }}>
//                                   {a.finalDecision==='hired' ? '✓ Hired' : '✗ Rejected'}
//                                 </span>
//                               )}
//                             </div>
//                           ) : a.status==='interview_sent' ? (
//                             <span style={{ padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:T.wBg, color:T.warning, whiteSpace:'nowrap' }}>Link Sent</span>
//                           ) : (
//                             <span style={{ fontSize:12, color:T.textMuted }}>Pending</span>
//                           )}
//                         </td>

//                         {/* Stage */}
//                         <td style={{ padding:'11px 14px' }}><StageBadge status={a.status||'pending'}/></td>

//                         {/* Last Activity */}
//                         <td style={{ padding:'11px 14px', fontSize:12, color:T.textMuted, whiteSpace:'nowrap' }}>
//                           {lastDate ? new Date(lastDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
//                         </td>

//                         {/* Actions */}
//                         <td style={{ padding:'11px 14px' }}>
//                           <div style={{ display:'flex', gap:4, flexWrap:'nowrap', alignItems:'center' }}>
//                             <button className="btn-sm" onClick={() => navigate(`/recruiter/applications/${a.id}`)} style={{ padding:'3px 9px', fontSize:11.5, fontWeight:500, color:T.primary, background:T.pLight, border:'none', borderRadius:5, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}>
//                               View
//                             </button>
//                             {a.resume_url && (
//                               <a href={a.resume_url} target="_blank" rel="noreferrer" style={{ padding:'3px 9px', fontSize:11.5, fontWeight:500, color:T.textSec, background:'#F1F5F9', borderRadius:5, textDecoration:'none', whiteSpace:'nowrap' }}>
//                                 CV
//                               </a>
//                             )}
//                             <button className="btn-sm" onClick={() => handleSendExam(a.id)} disabled={actLoad===a.id+'exam'}
//                               style={{ padding:'3px 9px', fontSize:11.5, fontWeight:500, color:'#fff', background:T.primary, border:'none', borderRadius:5, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit', opacity: actLoad===a.id+'exam'?.5:1 }}>
//                               {actLoad===a.id+'exam' ? '…' : a.status==='interview_sent' ? 'Resend' : 'Send Exam'}
//                             </button>
//                             {examDone && !a.finalDecision && (
//                               <>
//                                 <button className="btn-sm" onClick={() => handleDecision(a.id,'hired',a.email)} disabled={!!decLoad}
//                                   style={{ padding:'3px 8px', fontSize:11.5, fontWeight:500, color:T.success, background:T.sBg, border:`1px solid ${T.sBorder}`, borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
//                                   Hire
//                                 </button>
//                                 <button className="btn-sm" onClick={() => handleDecision(a.id,'rejected',a.email)} disabled={!!decLoad}
//                                   style={{ padding:'3px 8px', fontSize:11.5, fontWeight:500, color:T.error, background:T.eBg, border:`1px solid ${T.eBorder}`, borderRadius:5, cursor:'pointer', fontFamily:'inherit' }}>
//                                   Reject
//                                 </button>
//                               </>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//             <div style={{ padding:'9px 14px', borderTop:`1px solid ${T.borderLt}`, background:'#FAFAFA' }}>
//               <span style={{ fontSize:11.5, color:T.textMuted }}>Showing {filtered.length} of {apps.length} application{apps.length!==1?'s':''}</span>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default JobApplications;



import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Edit, Search, Filter } from 'lucide-react';
import recruiterAPI from '../../services/recruiterAPI';

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ja-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .trow:hover td { background: #F9FAFB !important; }
  .act:hover { opacity: .75 !important; }
  .ja-stat { animation:ja-in .18s ease both; transition:box-shadow .15s; }
  .ja-stat:hover { box-shadow:0 2px 8px rgba(37,99,235,.10)!important; }
  .ja-row { animation:ja-in .15s ease both; }
  th { white-space: nowrap; }
`;

const STAGE_MAP: Record<string, [string, string]> = {
  applied:            ['#EFF6FF', '#2563EB'],
  pending:            ['#F9FAFB', '#6B7280'],
  screened:           ['#FEF9C3', '#A16207'],
  shortlisted:        ['#DBEAFE', '#1D4ED8'],
  interview_sent:     ['#FFF7ED', '#C2410C'],
  interview_scheduled:['#FAE8FF', '#A21CAF'],
  rejected:           ['#FEF2F2', '#DC2626'],
  hired:              ['#F0FDF4', '#16A34A'],
};
const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied', pending: 'Pending', screened: 'Screened',
  shortlisted: 'Shortlisted', interview_sent: 'Assessment Sent',
  interview_scheduled: 'Scheduled', rejected: 'Rejected', hired: 'Hired',
};

const StageBadge: React.FC<{ status: string }> = ({ status }) => {
  const [bg, col] = STAGE_MAP[status?.toLowerCase()] ?? ['#F9FAFB', '#6B7280'];
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 11, fontWeight: 500, background: bg, color: col, whiteSpace: 'nowrap',
    }}>
      {STAGE_LABEL[status?.toLowerCase()] || status || 'Pending'}
    </span>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? '#16A34A' : score >= 50 ? '#F59E0B' : '#DC2626';
  const bg    = score >= 70 ? '#F0FDF4' : score >= 50 ? '#FFFBEB' : '#FEF2F2';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: bg, color, whiteSpace: 'nowrap' }}>
      {score}%
    </span>
  );
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div style={{
    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
    background: '#EFF6FF', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#2563EB', fontWeight: 700, fontSize: 11,
  }}>
    {(name || 'U')[0].toUpperCase()}
  </div>
);

const JobApplications: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      recruiterAPI.getCandidatesByJob(jobId).then(setApplications).catch(() => setApplications([])),
      recruiterAPI.getJobById(jobId).then(res => setJob(res?.job ?? res)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [jobId]);

  const handleDecision = async (appId: string, decision: 'hired' | 'rejected', email: string) => {
    if (!window.confirm(`${decision === 'hired' ? 'Hire' : 'Reject'} this candidate?`)) return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      alert(res.emailSent ? `Email sent to ${res.sentTo}.` : 'Decision recorded.');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, finalDecision: decision, status: decision } : a));
    } catch { alert('Failed to update decision'); }
    finally { setDecisionLoading(null); }
  };

  const handleSendAssessment = async (appId: string) => {
    setActionLoading(appId + 'send');
    try {
      const res = await recruiterAPI.sendAssessment(appId);
      alert(res.emailSent ? `Email sent to ${res.sentTo}` : 'Link generated');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: 'interview_sent' } : a));
    } catch { alert('Failed to send assessment'); }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', background: '#F8FAFC' }}>
      <div style={{ width: 24, height: 24, border: '2px solid #E5E7EB', borderTop: '2px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const skills: string[] = job?.skills ?? job?.required_skills ?? [];
  const filtered = applications.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name?.toLowerCase().includes(q) && !a.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = [
    { label: 'Total',       count: applications.length,                                              color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Shortlisted', count: applications.filter(a => a.status === 'shortlisted').length,      color: '#1D4ED8', bg: '#DBEAFE' },
    { label: 'Assessed',    count: applications.filter(a => a.status === 'interview_sent').length,   color: '#C2410C', bg: '#FFF7ED' },
    { label: 'Hired',       count: applications.filter(a => a.status === 'hired').length,            color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Rejected',    count: applications.filter(a => a.status === 'rejected').length,         color: '#DC2626', bg: '#FEF2F2' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif", animation:'ja-in .22s ease' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/recruiter/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: '#E5E7EB' }}>|</span>
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>
          {job?.title || 'Job Applications'}
        </h1>
        {job?.status && (
          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: job.status === 'active' ? '#F0FDF4' : '#F9FAFB', color: job.status === 'active' ? '#16A34A' : '#6B7280' }}>
            {job.status}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px' }}>

        {/* Job details */}
        {job && (
          <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E5E7EB', padding: '18px 22px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: skills.length ? 12 : 0 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{job.title}</h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280' }}><MapPin size={12} />{job.location}</span>}
                  {job.type && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#6B7280' }}><Clock size={12} />{job.type}</span>}
                  {(job.experience_min ?? job.experience) && <span style={{ fontSize: 13, color: '#6B7280' }}>{job.experience_min ?? job.experience}+ yrs</span>}
                </div>
              </div>
              <button onClick={() => navigate(`/recruiter/jobs/${jobId}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#6B7280', fontFamily: 'inherit' }}>
                <Edit size={12} /> Edit
              </button>
            </div>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {skills.map((sk: string) => (
                  <span key={sk} style={{ padding: '3px 9px', background: '#EFF6FF', color: '#2563EB', borderRadius: 5, fontSize: 12, fontWeight: 500 }}>{sk}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={s.label} className="ja-stat" style={{ padding: '7px 14px', background: s.bg, borderRadius: 7, display: 'flex', alignItems: 'center', gap: 6, animationDelay:`${i*0.06}s` }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.count}</span>
              <span style={{ fontSize: 12, color: s.color, opacity: 0.8 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, outline: 'none', background: '#FFFFFF', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: '8px 12px 8px 28px', border: '1px solid #E5E7EB', borderRadius: 7, fontSize: 13, background: '#FFFFFF', outline: 'none', fontFamily: 'inherit', color: '#374151', minWidth: 160 }}
            >
              <option value="">All Stages</option>
              {(['applied','pending','screened','interview_sent','shortlisted','hired','rejected']).map(s => (
                <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Applications Table */}
        {filtered.length === 0 ? (
          <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E5E7EB', padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: 0 }}>No applications found</p>
          </div>
        ) : (
          <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    {['Candidate', 'Contact', 'Match Score', 'Assessment', 'Current Stage', 'Last Activity', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', letterSpacing: '0.02em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any, i: number) => {
                    const score = parseFloat(a.match_score ?? a.score ?? 0);
                    const lastActivity = a.applied_at || a.appliedAt;
                    const examDone = a.examCompleted || a.interviewScore != null;

                    return (
                      <tr key={a.id} className="trow ja-row" style={{ borderBottom: '1px solid #F3F4F6', animationDelay:`${Math.min(i*0.04,0.3)}s` }}>

                        {/* Candidate */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <Avatar name={a.name} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{a.name}</div>
                              {a.recruiter_name && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.recruiter_name}</div>}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: 12, color: '#6B7280' }}>{a.email}</div>
                          {a.phone && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{a.phone}</div>}
                        </td>

                        {/* Match Score */}
                        <td style={{ padding: '12px 16px' }}>
                          <ScoreBadge score={score} />
                        </td>

                        {/* Assessment */}
                        <td style={{ padding: '12px 16px' }}>
                          {examDone ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#DBEAFE', color: '#1D4ED8', width: 'fit-content' }}>Completed</span>
                              {a.interviewScore != null && (
                                <span style={{ fontSize: 11, color: a.interviewScore >= 60 ? '#16A34A' : '#DC2626', fontWeight: 500 }}>
                                  Score: {a.interviewScore}%
                                </span>
                              )}
                              {a.finalDecision && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: a.finalDecision === 'hired' ? '#16A34A' : '#DC2626' }}>
                                  {a.finalDecision === 'hired' ? '✓ Hired' : '✗ Rejected'}
                                </span>
                              )}
                            </div>
                          ) : a.status === 'interview_sent' ? (
                            <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#FFF7ED', color: '#C2410C', whiteSpace: 'nowrap' }}>Link Sent</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Pending</span>
                          )}
                        </td>

                        {/* Stage */}
                        <td style={{ padding: '12px 16px' }}>
                          <StageBadge status={a.status || 'pending'} />
                        </td>

                        {/* Last Activity */}
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                          {lastActivity ? new Date(lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap', alignItems: 'center' }}>
                            <button
                              className="act"
                              onClick={() => navigate(`/recruiter/applications/${a.id}`)}
                              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#2563EB', background: '#EFF6FF', border: 'none', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
                            >
                              View
                            </button>
                            {a.resume_url && (
                              <a href={a.resume_url} target="_blank" rel="noreferrer"
                                style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#6B7280', background: '#F3F4F6', borderRadius: 5, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                Resume
                              </a>
                            )}
                            <button
                              className="act"
                              onClick={() => handleSendAssessment(a.id)}
                              disabled={actionLoading === a.id + 'send'}
                              style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: 'white', background: '#2563EB', border: 'none', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', opacity: actionLoading === a.id + 'send' ? 0.5 : 1 }}
                            >
                              {actionLoading === a.id + 'send' ? '…' : a.status === 'interview_sent' ? 'Resend' : 'Send Exam'}
                            </button>
                            {examDone && !a.finalDecision && (
                              <>
                                <button className="act" onClick={() => handleDecision(a.id, 'hired', a.email)} disabled={!!decisionLoading}
                                  style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                  Hire
                                </button>
                                <button className="act" onClick={() => handleDecision(a.id, 'rejected', a.email)} disabled={!!decisionLoading}
                                  style={{ padding: '4px 10px', fontSize: 12, fontWeight: 500, color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
