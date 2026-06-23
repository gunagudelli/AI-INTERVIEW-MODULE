import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';
import {
  Briefcase, Users, UserCheck, TrendingUp, ArrowRight,
  BarChart2, Target, Activity, ChevronDown, ChevronUp,
  Mail, ExternalLink,
} from 'lucide-react';

const CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
  @keyframes ra-in  { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
  .kcard:hover  { border-color:#cbd5e1!important; }
  .rrow:hover td { background:#FFFFFF!important; cursor:pointer; }
  .stbadge:hover { opacity:.8!important; transform:scale(1.04); }
  .jrow:hover   { background:#FFFFFF!important; }
  .ra-kpi { animation:ra-in .2s ease both; }
  .ra-section { animation:ra-in .25s ease both; }
  .ra-btn:hover { background:#DBEAFE!important; }
`;

/* ── tiny helpers ─────────────────────────────────────── */
const STAGE_MAP: Record<string,[string,string,string]> = {
  pending:           ['#FFFFFF','#6B7280','Pending'],
  applied:           ['#EFF6FF','#2563EB','Applied'],
  screened:          ['#FEF9C3','#A16207','Screened'],
  shortlisted:       ['#DBEAFE','#1D4ED8','Shortlisted'],
  interview_sent:    ['#FDF2F2','#6B0000','Email Sent'],
  interview_scheduled:['#FAE8FF','#A21CAF','Scheduled'],
  rejected:          ['#FEF2F2','#DC2626','Rejected'],
  hired:             ['#F0FDF4','#16A34A','Hired'],
};
const stStyle = (s:string)=> STAGE_MAP[s?.toLowerCase()] ?? STAGE_MAP.pending;

const Avatar:React.FC<{name:string;size?:number}> = ({name,size=28}) => (
  <div style={{width:size,height:size,borderRadius:'50%',background:'#EFF6FF',
    display:'flex',alignItems:'center',justifyContent:'center',
    color:'#2563EB',fontWeight:700,fontSize:size*0.38,flexShrink:0}}>
    {(name||'?')[0].toUpperCase()}
  </div>
);

/* ── Donut ────────────────────────────────────────────── */
const Donut:React.FC<{segs:{v:number;c:string;l:string}[];sz?:number;label?:string;sub?:string}> = ({segs,sz=130,label,sub}) => {
  const tot = segs.reduce((a,s)=>a+s.v,0)||1;
  const r=sz/2-10, circ=2*Math.PI*r;
  let off=0;
  const arcs = segs.map(s=>{ const dash=(s.v/tot)*circ; const arc={...s,dash,gap:circ-dash,off}; off+=dash; return arc; });
  return (
    <div style={{display:'flex',alignItems:'center',gap:18}}>
      <div style={{position:'relative',width:sz,height:sz,flexShrink:0}}>
        <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={9}/>
          {arcs.filter(a=>a.v>0).map((a,i)=>(
            <circle key={i} cx={sz/2} cy={sz/2} r={r} fill="none" stroke={a.c} strokeWidth={9}
              strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={-a.off} strokeLinecap="round"/>
          ))}
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
          {label && <span style={{fontSize:17,fontWeight:700,color:'#111827',lineHeight:1,letterSpacing:'-0.02em'}}>{label}</span>}
          {sub   && <span style={{fontSize:10,color:'#9CA3AF',marginTop:2,fontWeight:500}}>{sub}</span>}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:7}}>
        {segs.map(s=>(
          <div key={s.l} style={{display:'flex',alignItems:'center',gap:7}}>
            <span style={{width:9,height:9,borderRadius:2,background:s.c,display:'inline-block',flexShrink:0}}/>
            <div>
              <div style={{fontSize:12,color:'#374151',fontWeight:500}}>{s.l}</div>
              <div style={{fontSize:11,color:'#9CA3AF'}}>{s.v} · {Math.round((s.v/tot)*100)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── StatCircle ──────────────────────────────────────── */
const StatCircle:React.FC<{pct:number;color:string;label:string;sub:string}> = ({pct,color,label,sub}) => {
  const sz=88,r=34,circ=2*Math.PI*r,dash=Math.min(pct,100)/100*circ;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:7}}>
      <div style={{position:'relative',width:sz,height:sz}}>
        <svg width={sz} height={sz} style={{transform:'rotate(-90deg)'}}>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={7}/>
          <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <span style={{fontSize:14,fontWeight:700,color,letterSpacing:'-0.02em'}}>{pct}%</span>
        </div>
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:12,fontWeight:600,color:'#374151'}}>{label}</div>
        <div style={{fontSize:11,color:'#9CA3AF',marginTop:1}}>{sub}</div>
      </div>
    </div>
  );
};

/* ── KPI card ─────────────────────────────────────────── */
const KPI:React.FC<{label:string;value:number|string;icon:React.ReactNode;iBg:string;iCol:string}> = ({label,value,icon,iBg,iCol}) => (
  <div className="kcard" style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',padding:'15px 18px',display:'flex',gap:13,alignItems:'center',transition:'border-color .15s'}}>
    <div style={{width:38,height:38,borderRadius:8,background:iBg,display:'flex',alignItems:'center',justifyContent:'center',color:iCol,flexShrink:0}}>{icon}</div>
    <div>
      <p style={{fontSize:11,color:'#9CA3AF',margin:'0 0 3px',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</p>
      <p style={{fontSize:21,fontWeight:700,color:'#111827',margin:0,lineHeight:1,letterSpacing:'-0.02em'}}>{value}</p>
    </div>
  </div>
);

/* ════════════════════════════════════════════════════════ */
interface AppRow { id:string; name:string; email:string; status:string; jobId:string; jobTitle:string; recruiterName:string; matchScore:number; appliedAt:string; }
interface RecGroup { name:string; email:string; jobs:{ id:string; title:string; apps:AppRow[] }[]; }

const RecruiterAnalytics:React.FC = () => {
  const navigate = useNavigate();
  const [dash,   setDash]   = useState<any>(null);
  const [jobs,   setJobs]   = useState<any[]>([]);
  const [allApps,setAllApps]= useState<AppRow[]>([]);
  const [loading,setLoading]= useState(true);
  const [error,  setError]  = useState('');
  const [open,   setOpen]   = useState<string|null>(null);   // expanded recruiter
  const [openJob,setOpenJob]= useState<string|null>(null);   // expanded job inside recruiter

  useEffect(()=>{
    const load = async () => {
      try {
        const [d, jobList] = await Promise.all([
          recruiterAPI.getDashboard(),
          recruiterAPI.getAllJobs(),
        ]);
        setDash(d);
        const active:any[] = Array.isArray(jobList) ? jobList : (jobList?.jobs??[]);
        setJobs(active);

        // fetch apps for each job (parallel, best-effort)
        const appArrays = await Promise.all(
          active.map((j:any) =>
            recruiterAPI.getCandidatesByJob(j.id)
              .then((list:any[]) => list.map((a:any)=>({
                id:          String(a.id),
                name:        a.name || '—',
                email:       a.email || '—',
                status:      a.status || 'pending',
                jobId:       String(j.id),
                jobTitle:    j.title,
                recruiterName: a.recruiter_name || j.recruiter_name || j.recruiterName || 'Unassigned',
                matchScore:  parseFloat(a.match_score??a.score??0)||0,
                appliedAt:   a.applied_at||a.appliedAt||'',
              })))
              .catch(()=>[])
          )
        );
        setAllApps(appArrays.flat());
      } catch { setError('Failed to load analytics'); }
      finally  { setLoading(false); }
    };
    load();
  },[]);

  /* group by recruiter → jobs → apps */
  const recruiterGroups = useMemo(():RecGroup[]=>{
    const map: Record<string, RecGroup> = {};
    allApps.forEach(a=>{
      const key = a.recruiterName||'Unassigned';
      if(!map[key]) map[key]={ name:key, email:'', jobs:[] };
      let jb = map[key].jobs.find(j=>j.id===a.jobId);
      if(!jb){ jb={id:a.jobId,title:a.jobTitle,apps:[]}; map[key].jobs.push(jb); }
      jb.apps.push(a);
    });
    // also add jobs with zero apps (if recruiter info on job)
    jobs.forEach((j:any)=>{
      const rName = j.recruiter_name||j.recruiterName||'Unassigned';
      if(!map[rName]) map[rName]={ name:rName, email:j.recruiter_email||'', jobs:[] };
      if(!map[rName].jobs.find(jj=>jj.id===String(j.id)))
        map[rName].jobs.push({id:String(j.id),title:j.title,apps:[]});
    });
    return Object.values(map).sort((a,b)=>{
      const aApps = a.jobs.reduce((s,j)=>s+j.apps.length,0);
      const bApps = b.jobs.reduce((s,j)=>s+j.apps.length,0);
      return bApps-aApps;
    });
  },[allApps,jobs]);

  /* pipeline numbers */
  const pipeline    = dash?.pipeline||{};
  const applied     = pipeline.applied     || dash?.totalCandidates || allApps.length || 0;
  const screened    = pipeline.in_progress || allApps.filter(a=>a.status==='screened').length  || 0;
  const shortlisted = pipeline.shortlisted || allApps.filter(a=>a.status==='shortlisted').length || 0;
  const rejected    = pipeline.rejected    || allApps.filter(a=>a.status==='rejected').length   || 0;
  const hired       = pipeline.completed   || allApps.filter(a=>a.status==='hired').length      || 0;
  const emailSent   = allApps.filter(a=>a.status==='interview_sent').length;
  const totalJobs   = dash?.totalJobs || jobs.length;
  const totalApps   = dash?.totalCandidates || applied;

  const hireRate      = Math.round((hired       / Math.max(applied,  1))*100);
  const screenRate    = Math.round((screened    / Math.max(applied,  1))*100);
  const shortlistRate = Math.round((shortlisted / Math.max(screened||1,1))*100);

  const pipeSegs = [
    {v:shortlisted,c:'#2563EB',l:'Shortlisted'},
    {v:hired,      c:'#16A34A',l:'Hired'},
    {v:rejected,   c:'#DC2626',l:'Rejected'},
    {v:screened,   c:'#F59E0B',l:'Screened'},
    {v:Math.max(applied-screened-shortlisted-hired-rejected,0),c:'#E5E7EB',l:'Pending'},
  ].filter(s=>s.v>0);

  if(loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#ffffff'}}>
      <div style={{width:28,height:28,border:'3px solid #E5E7EB',borderTop:'3px solid #2563EB',borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
    </div>
  );
  if(error) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100vh',gap:10}}>
      <p style={{color:'#DC2626',fontSize:14}}>{error}</p>
      <button onClick={()=>window.location.reload()} style={{padding:'8px 18px',background:'#2563EB',color:'white',border:'none',borderRadius:7,cursor:'pointer',fontSize:13,fontWeight:600}}>Retry</button>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#ffffff',fontFamily:"'Inter',-apple-system,sans-serif",animation:'fadeIn .25s ease'}}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{background:'#FFF',borderBottom:'1px solid #E5E7EB',padding:'16px 28px'}}>
        <h1 style={{fontSize:20,fontWeight:700,color:'#111827',margin:0,letterSpacing:'-0.01em'}}>Analytics</h1>
        <p style={{fontSize:13,color:'#6B7280',margin:'2px 0 0'}}>Recruiter performance · pipeline metrics · hiring funnel</p>
      </div>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'22px 28px',display:'flex',flexDirection:'column',gap:16}}>

        {/* KPIs */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:11}}>
          {[
            {label:'Total Jobs',   value:totalJobs,  icon:<Briefcase size={17}/>, iBg:'#EFF6FF',iCol:'#2563EB'},
            {label:'Applications', value:totalApps,  icon:<Users size={17}/>,     iBg:'#F0FDF4',iCol:'#16A34A'},
            {label:'Email Sent',   value:emailSent,  icon:<Mail size={17}/>,      iBg:'#FDF2F2',iCol:'#6B0000'},
            {label:'Shortlisted',  value:shortlisted,icon:<Target size={17}/>,    iBg:'#DBEAFE',iCol:'#1D4ED8'},
            {label:'Hired',        value:hired,       icon:<UserCheck size={17}/>, iBg:'#F0FDF4',iCol:'#16A34A'},
          ].map((k,i)=><div key={k.label} className="ra-kpi" style={{animationDelay:`${i*0.07}s`}}><KPI {...k}/></div>)}
        </div>

        {/* Charts row */}
        <div className="ra-section" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,animationDelay:'.12s'}}>

          {/* Pipeline donut */}
          <div style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',padding:'20px 24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
              <Activity size={14} style={{color:'#2563EB'}}/>
              <h2 style={{fontSize:14,fontWeight:600,color:'#111827',margin:0}}>Pipeline Breakdown</h2>
            </div>
            <Donut segs={pipeSegs} sz={130} label={`${applied}`} sub="Total"/>
          </div>

          {/* Conversion circles */}
          <div style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',padding:'20px 24px'}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
              <TrendingUp size={14} style={{color:'#2563EB'}}/>
              <h2 style={{fontSize:14,fontWeight:600,color:'#111827',margin:0}}>Conversion Metrics</h2>
            </div>
            <div style={{display:'flex',gap:28,justifyContent:'center',flexWrap:'wrap'}}>
              <StatCircle pct={screenRate}    color="#F59E0B" label="Screen Rate"    sub={`${screened}/${applied}`}/>
              <StatCircle pct={shortlistRate} color="#1D4ED8" label="Shortlist Rate" sub={`${shortlisted}/${screened||0}`}/>
              <StatCircle pct={hireRate}      color="#16A34A" label="Hire Rate"      sub={`${hired}/${applied}`}/>
            </div>
          </div>
        </div>

        {/* Funnel bars */}
        <div className="ra-section" style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',padding:'20px 24px',animationDelay:'.18s'}}>
          <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:16}}>
            <BarChart2 size={14} style={{color:'#2563EB'}}/>
            <h2 style={{fontSize:14,fontWeight:600,color:'#111827',margin:0}}>Hiring Funnel</h2>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {[
              {label:'Applied',     count:applied,     color:'#2563EB',bg:'#EFF6FF'},
              {label:'Screened',    count:screened,    color:'#F59E0B',bg:'#FFFBEB'},
              {label:'Email Sent',  count:emailSent,   color:'#6B0000',bg:'#FDF2F2'},
              {label:'Shortlisted', count:shortlisted, color:'#1D4ED8',bg:'#DBEAFE'},
              {label:'Hired',       count:hired,       color:'#16A34A',bg:'#F0FDF4'},
              {label:'Rejected',    count:rejected,    color:'#DC2626',bg:'#FEF2F2'},
            ].map((f,i,arr)=>{
              const pct=Math.round((f.count/Math.max(applied,1))*100);
              const prev=arr[i-1];
              const drop=prev&&prev.count>0?Math.round((f.count/prev.count)*100):null;
              return (
                <div key={f.label} style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:92,flexShrink:0,display:'flex',alignItems:'center',gap:6}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:f.color,display:'inline-block',flexShrink:0}}/>
                    <span style={{fontSize:12,color:'#6B7280'}}>{f.label}</span>
                  </div>
                  <div style={{flex:1,height:7,background:f.bg,borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${pct}%`,background:f.color,borderRadius:3,transition:'width .8s ease'}}/>
                  </div>
                  <div style={{width:76,textAlign:'right',flexShrink:0}}>
                    <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>{f.count}</span>
                    {drop!==null&&<span style={{fontSize:10,color:'#9CA3AF',marginLeft:4}}>({drop}%)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ RECRUITER PERFORMANCE TABLE ══ */}
        <div className="ra-section" style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',overflow:'hidden',animationDelay:'.24s'}}>
          <div style={{padding:'16px 22px',borderBottom:'1px solid #F3F4F6',display:'flex',alignItems:'center',gap:8}}>
            <Users size={15} style={{color:'#2563EB'}}/>
            <h2 style={{fontSize:14,fontWeight:600,color:'#111827',margin:0}}>Recruiter Performance</h2>
            <span style={{marginLeft:'auto',fontSize:12,color:'#9CA3AF'}}>{recruiterGroups.length} recruiters</span>
          </div>

          {recruiterGroups.length===0 ? (
            <div style={{padding:'48px',textAlign:'center',color:'#9CA3AF',fontSize:13}}>No recruiter data yet</div>
          ) : (
            recruiterGroups.map((rec,ri)=>{
              const totalRecApps = rec.jobs.reduce((s,j)=>s+j.apps.length,0);
              const recStatuses  = rec.jobs.flatMap(j=>j.apps).reduce((acc,a)=>{ acc[a.status]=(acc[a.status]||0)+1; return acc; },{} as Record<string,number>);
              const recEmailSent = recStatuses['interview_sent']||0;
              const recHired     = recStatuses['hired']||0;
              const isOpen       = open===String(ri);

              return (
                <div key={ri} style={{borderBottom:ri<recruiterGroups.length-1?'1px solid #F3F4F6':'none'}}>

                  {/* Recruiter row — click to expand */}
                  <div
                    className="jrow"
                    onClick={()=>setOpen(isOpen?null:String(ri))}
                    style={{display:'flex',alignItems:'center',gap:16,padding:'14px 22px',cursor:'pointer',transition:'background .12s'}}
                  >
                    {/* Avatar + name */}
                    <Avatar name={rec.name}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{rec.name}</div>
                      <div style={{fontSize:11,color:'#9CA3AF',marginTop:1}}>{rec.jobs.length} job{rec.jobs.length!==1?'s':''}</div>
                    </div>

                    {/* Status mini-badges — click navigates to that status list */}
                    <div style={{display:'flex',gap:5,flexWrap:'wrap',flex:1,justifyContent:'flex-end'}}>
                      {Object.entries(recStatuses)
                        .filter(([,v])=>v>0)
                        .sort(([a],[b])=>a.localeCompare(b))
                        .map(([status,count])=>{
                          const [bg,col,lbl]=stStyle(status);
                          const firstJobId=rec.jobs.find(j=>j.apps.some(a=>a.status===status))?.id;
                          return (
                            <span
                              key={status}
                              className="stbadge"
                              onClick={e=>{
                                e.stopPropagation();
                                if(firstJobId) navigate(`/recruiter/jobs/${firstJobId}/applications`);
                              }}
                              title={`View ${lbl} applications`}
                              style={{
                                display:'inline-flex',alignItems:'center',gap:4,
                                padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,
                                background:bg,color:col,cursor:'pointer',
                                transition:'opacity .12s,transform .12s',userSelect:'none',whiteSpace:'nowrap',
                              }}
                            >
                              {lbl}
                              <strong style={{fontWeight:700}}>{count}</strong>
                            </span>
                          );
                        })}
                    </div>

                    {/* Summary numbers */}
                    <div style={{display:'flex',gap:16,flexShrink:0,textAlign:'center'}}>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:'#2563EB',letterSpacing:'-0.02em'}}>{totalRecApps}</div>
                        <div style={{fontSize:10,color:'#9CA3AF',fontWeight:500}}>Total</div>
                      </div>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:'#6B0000',letterSpacing:'-0.02em'}}>{recEmailSent}</div>
                        <div style={{fontSize:10,color:'#9CA3AF',fontWeight:500}}>Emailed</div>
                      </div>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:'#16A34A',letterSpacing:'-0.02em'}}>{recHired}</div>
                        <div style={{fontSize:10,color:'#9CA3AF',fontWeight:500}}>Hired</div>
                      </div>
                    </div>

                    {isOpen ? <ChevronUp size={15} style={{color:'#9CA3AF',flexShrink:0}}/> : <ChevronDown size={15} style={{color:'#9CA3AF',flexShrink:0}}/>}
                  </div>

                  {/* Expanded: job-wise breakdown */}
                  {isOpen && (
                    <div style={{background:'#FFFFFF',borderTop:'1px solid #F3F4F6',padding:'0 22px 14px'}}>
                      {rec.jobs.map((job,ji)=>{
                        const jobStatuses = job.apps.reduce((acc,a)=>{ acc[a.status]=(acc[a.status]||0)+1; return acc; },{} as Record<string,number>);
                        const jKey=`${ri}-${ji}`;
                        const jOpen=openJob===jKey;

                        return (
                          <div key={ji} style={{marginTop:10,background:'#FFF',borderRadius:7,border:'1px solid #E5E7EB',overflow:'hidden'}}>
                            {/* Job header row */}
                            <div
                              className="jrow"
                              onClick={()=>setOpenJob(jOpen?null:jKey)}
                              style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',cursor:'pointer',transition:'background .12s'}}
                            >
                              <div style={{width:28,height:28,borderRadius:6,background:'#EFF6FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                <Briefcase size={13} style={{color:'#2563EB'}}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <span style={{fontSize:13,fontWeight:500,color:'#111827'}}>{job.title}</span>
                                <span style={{fontSize:11,color:'#9CA3AF',marginLeft:8}}>{job.apps.length} applicants</span>
                              </div>

                              {/* status badges per job */}
                              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                {Object.entries(jobStatuses)
                                  .filter(([,v])=>v>0)
                                  .map(([status,count])=>{
                                    const [bg,col,lbl]=stStyle(status);
                                    return (
                                      <span
                                        key={status}
                                        className="stbadge"
                                        onClick={e=>{
                                          e.stopPropagation();
                                          navigate(`/recruiter/jobs/${job.id}/applications`);
                                        }}
                                        title="View applications"
                                        style={{
                                          display:'inline-flex',alignItems:'center',gap:3,
                                          padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:500,
                                          background:bg,color:col,cursor:'pointer',
                                          transition:'opacity .12s',whiteSpace:'nowrap',
                                        }}
                                      >
                                        {lbl} <strong style={{fontWeight:700}}>{count}</strong>
                                      </span>
                                    );
                                  })}
                              </div>

                              <button
                                onClick={e=>{e.stopPropagation();navigate(`/recruiter/jobs/${job.id}/applications`);}}
                                style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',fontSize:11,fontWeight:500,color:'#2563EB',background:'#EFF6FF',border:'none',borderRadius:5,cursor:'pointer',flexShrink:0,fontFamily:'inherit'}}
                              >
                                <ExternalLink size={10}/> View All
                              </button>

                              {jOpen?<ChevronUp size={13} style={{color:'#9CA3AF',flexShrink:0}}/>:<ChevronDown size={13} style={{color:'#9CA3AF',flexShrink:0}}/>}
                            </div>

                            {/* Expanded: application rows */}
                            {jOpen && job.apps.length>0 && (
                              <div style={{borderTop:'1px solid #F3F4F6',overflowX:'auto'}}>
                                <table style={{width:'100%',borderCollapse:'collapse',minWidth:620}}>
                                  <thead>
                                    <tr style={{background:'#FFFFFF',borderBottom:'1px solid #E5E7EB'}}>
                                      {['Candidate','Email','Match','Status','Applied','Action'].map(h=>(
                                        <th key={h} style={{padding:'8px 14px',textAlign:'left',fontSize:11,fontWeight:600,color:'#6B7280',whiteSpace:'nowrap'}}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {job.apps.map((a,ai)=>{
                                      const [bg,col]=stStyle(a.status);
                                      return (
                                        <tr
                                          key={ai}
                                          className="rrow"
                                          onClick={()=>navigate(`/recruiter/jobs/${job.id}/applications`)}
                                          style={{borderBottom:'1px solid #F3F4F6',transition:'background .1s'}}
                                        >
                                          <td style={{padding:'9px 14px'}}>
                                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                                              <Avatar name={a.name} size={24}/>
                                              <span style={{fontSize:13,fontWeight:500,color:'#111827'}}>{a.name}</span>
                                            </div>
                                          </td>
                                          <td style={{padding:'9px 14px',fontSize:12,color:'#6B7280'}}>{a.email}</td>
                                          <td style={{padding:'9px 14px'}}>
                                            <span style={{
                                              padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,
                                              background:a.matchScore>=70?'#F0FDF4':a.matchScore>=50?'#FFFBEB':'#FEF2F2',
                                              color:      a.matchScore>=70?'#16A34A':a.matchScore>=50?'#F59E0B':'#DC2626',
                                            }}>{a.matchScore}%</span>
                                          </td>
                                          <td style={{padding:'9px 14px'}}>
                                            <span style={{padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:col,whiteSpace:'nowrap'}}>
                                              {stStyle(a.status)[2]}
                                            </span>
                                          </td>
                                          <td style={{padding:'9px 14px',fontSize:11,color:'#9CA3AF',whiteSpace:'nowrap'}}>
                                            {a.appliedAt?new Date(a.appliedAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—'}
                                          </td>
                                          <td style={{padding:'9px 14px'}}>
                                            <span style={{fontSize:11,color:'#2563EB',fontWeight:500,display:'flex',alignItems:'center',gap:3}}>
                                              <ArrowRight size={11}/> Open
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="ra-section" style={{background:'#FFF',borderRadius:8,border:'1px solid #E5E7EB',padding:'16px 22px',animationDelay:'.3s'}}>
          <h2 style={{fontSize:14,fontWeight:600,color:'#111827',margin:'0 0 10px'}}>Quick Actions</h2>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[
              {label:'All Jobs',         path:'/recruiter/jobs'},
              {label:'All Applications', path:'/recruiter/applications'},
              {label:'Post New Job',     path:'/recruiter/jobs/create'},
            ].map(a=>(
              <button key={a.path} onClick={()=>navigate(a.path)} className="ra-btn"
                style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',background:'#EFF6FF',color:'#2563EB',border:'none',borderRadius:6,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',transition:'background .15s'}}>
                {a.label}<ArrowRight size={11}/>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecruiterAnalytics;
