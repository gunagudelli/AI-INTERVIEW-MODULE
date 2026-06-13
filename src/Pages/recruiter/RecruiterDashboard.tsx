import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, CheckCircle, Plus, Copy, X,
  TrendingUp, ArrowRight, Wand2, Clock, Target,
  Link as LinkIcon, ChevronRight,
} from 'lucide-react';
import recruiterAPI from '../../services/recruiterAPI';

const T = {
  bg:'#F8FAFC', card:'#FFFFFF', border:'#E5E7EB', borderLt:'#F1F5F9',
  text:'#0F172A', textSec:'#475569', textMuted:'#94A3B8',
  primary:'#2563EB', pLight:'#EFF6FF',
  success:'#166534', sBg:'#DCFCE7',
  warning:'#92400E', wBg:'#FEF3C7',
  error:'#991B1B',   eBg:'#FEE2E2',
  info:'#1D4ED8',    iBg:'#DBEAFE',
};

const CSS = `
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .tr:hover td   { background:#F8FAFC !important; }
  .btn-sm:hover  { filter:brightness(.93); }
  .qa:hover      { background:#F1F5F9 !important; }
  .kpi:hover     { box-shadow:0 0 0 1px #BFDBFE,0 2px 8px rgba(37,99,235,.08) !important; }
  @keyframes rd-in { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
  .rd-kpi { animation:rd-in .2s ease both; }
  .rd-job:hover td { background:#F8FAFC !important; }
`;

const Spinner = () => (
  <div style={{ width:22,height:22,border:'2px solid #E5E7EB',borderTop:`2px solid ${T.primary}`,borderRadius:'50%',animation:'spin .7s linear infinite' }}/>
);

const KpiCard: React.FC<{ label:string; value:number|string; icon:React.ReactNode; iBg:string; iCol:string }> = ({
  label,value,icon,iBg,iCol,
}) => (
  <div className="kpi" style={{ background:T.card,borderRadius:8,border:`1px solid ${T.border}`,padding:'14px 16px',display:'flex',gap:12,alignItems:'center',transition:'box-shadow 140ms' }}>
    <div style={{ width:36,height:36,borderRadius:8,background:iBg,display:'flex',alignItems:'center',justifyContent:'center',color:iCol,flexShrink:0 }}>{icon}</div>
    <div>
      <p style={{ fontSize:10.5,color:T.textMuted,margin:'0 0 3px',fontWeight:500,textTransform:'uppercase',letterSpacing:'0.06em' }}>{label}</p>
      <p style={{ fontSize:20,fontWeight:700,color:T.text,margin:0,lineHeight:1,letterSpacing:'-0.02em' }}>{value}</p>
    </div>
  </div>
);

const StatusDot: React.FC<{ status:string }> = ({ status }) => {
  const map: Record<string,[string,string]> = {
    active:   [T.sBg, T.success],
    inactive: ['#F1F5F9', T.textMuted],
    closed:   [T.eBg, T.error],
    draft:    [T.wBg, T.warning],
  };
  const [bg,col] = map[status?.toLowerCase()] ?? ['#F1F5F9', T.textMuted];
  return <span style={{ padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:500,background:bg,color:col,textTransform:'capitalize' }}>{status||'active'}</span>;
};

const Modal: React.FC<{ title:string; sub?:string; onClose:()=>void; maxW?:number; children:React.ReactNode }> = ({
  title,sub,onClose,maxW=640,children,
}) => (
  <div style={{ position:'fixed',inset:0,background:'rgba(15,23,42,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60,padding:20 }}>
    <div style={{ background:T.card,borderRadius:10,border:`1px solid ${T.border}`,width:'100%',maxWidth:maxW,maxHeight:'88vh',display:'flex',flexDirection:'column',boxShadow:'0 8px 40px rgba(0,0,0,.12)' }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:`1px solid ${T.borderLt}`,flexShrink:0 }}>
        <div>
          <h3 style={{ fontSize:14,fontWeight:600,color:T.text,margin:0 }}>{title}</h3>
          {sub && <p style={{ fontSize:11,color:T.textMuted,margin:'2px 0 0' }}>{sub}</p>}
        </div>
        <button onClick={onClose} style={{ background:'none',border:'none',color:T.textMuted,cursor:'pointer',padding:4,display:'flex' }}><X size={15}/></button>
      </div>
      <div style={{ overflowY:'auto',flex:1,padding:'18px 20px' }}>{children}</div>
    </div>
  </div>
);

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dash,     setDash]     = useState<any>(null);
  const [jobs,     setJobs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [linksModal,  setLinksModal]  = useState(false);
  const [linksData,   setLinksData]   = useState<any>(null);
  const [copiedKey,   setCopiedKey]   = useState<string|null>(null);

  useEffect(() => {
    if (!localStorage.getItem('recruiter_token')) { navigate('/RecruiterLogin'); return; }
    Promise.all([recruiterAPI.getDashboardStats(), recruiterAPI.getAllJobs()])
      .then(([d, jl]) => { setDash(d); setJobs(Array.isArray(jl) ? jl : jl?.jobs ?? []); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const openLinks = async (jobId:string) => {
    try { const r = await recruiterAPI.generateLinks(jobId); setLinksData(r); setLinksModal(true); }
    catch { alert('Failed to generate links'); }
  };

  const copy = (text:string, key:string) => {
    navigator.clipboard.writeText(text); setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:T.bg }}>
      <Spinner/>
    </div>
  );

  const pl = dash?.pipeline || {};
  const kpis = [
    { label:'Active Jobs',  value: dash?.totalJobs ?? jobs.length,           icon:<Briefcase size={16}/>, iBg:T.iBg, iCol:T.info    },
    { label:'Applications', value: dash?.totalCandidates ?? pl.applied ?? 0, icon:<Users size={16}/>,     iBg:T.sBg, iCol:T.success },
    { label:'Screened',     value: pl.in_progress ?? 0,                      icon:<Target size={16}/>,    iBg:T.wBg, iCol:T.warning },
    { label:'Shortlisted',  value: pl.shortlisted ?? 0,                      icon:<Clock size={16}/>,     iBg:T.iBg, iCol:T.info    },
    { label:'Hired',        value: pl.completed ?? dash?.hired ?? 0,         icon:<CheckCircle size={16}/>,iBg:T.sBg,iCol:T.success },
  ];
  const stages = [
   
    { label:'Screened',    count: pl.in_progress || 0, color:'#D97706' },
    { label:'Shortlisted', count: pl.shortlisted || 0, color:'#1D4ED8' },
    { label:'Hired',       count: pl.completed   || 0, color:'#16A34A' },
    { label:'Rejected',    count: pl.rejected    || 0, color:'#DC2626' },
  ];
  const maxPl = Math.max(...stages.map(s => s.count), 1);

  return (
    <div style={{ minHeight:'100vh',background:T.bg,fontFamily:"'Inter',sans-serif",animation:'fadeUp .22s ease' }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ background:T.card,borderBottom:`1px solid ${T.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:30 }}>
        <div>
          <h1 style={{ fontSize:18,fontWeight:700,color:T.text,margin:0,letterSpacing:'-0.3px' }}>Dashboard</h1>
          <p style={{ fontSize:12,color:T.textMuted,margin:'1px 0 0' }}>Hiring overview</p>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => navigate('/recruiter/jobs/create?ai=true')} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 14px',borderRadius:7,border:`1px solid ${T.border}`,background:T.card,color:T.textSec,fontSize:12.5,fontWeight:500,cursor:'pointer',fontFamily:'inherit' }}>
            <Wand2 size={13}/> AI Job
          </button>
          <button onClick={() => navigate('/recruiter/jobs/create')} style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:7,border:'none',background:T.primary,color:'#fff',fontSize:12.5,fontWeight:600,cursor:'pointer',fontFamily:'inherit' }}>
            <Plus size={14}/> Post Job
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1160,margin:'0 auto',padding:'20px 28px',display:'flex',flexDirection:'column',gap:16 }}>

        {/* KPIs */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10 }}>
          {kpis.map((k,i) => (
            <div key={k.label} className="rd-kpi" style={{animationDelay:`${i*0.07}s`}}><KpiCard {...k}/></div>
          ))}
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 280px',gap:14 }}>

          {/* Pipeline */}
          <div style={{ background:T.card,borderRadius:8,border:`1px solid ${T.border}`,padding:'18px 22px' }}>
            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
              <span style={{ fontSize:13,fontWeight:600,color:T.text }}>Candidate Pipeline</span>
              <TrendingUp size={14} style={{ color:T.textMuted }}/>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {stages.map(s => (
                <div key={s.label} style={{ display:'flex',alignItems:'center',gap:10 }}>
                  <span style={{ fontSize:12,color:T.textSec,width:80,flexShrink:0 }}>{s.label}</span>
                  <div style={{ flex:1,height:5,background:'#F1F5F9',borderRadius:3,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${Math.round(s.count/maxPl*100)}%`,background:s.color,borderRadius:3,transition:'width .7s ease' }}/>
                  </div>
                  <span style={{ fontSize:12,fontWeight:600,color:T.text,width:28,textAlign:'right',flexShrink:0 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background:T.card,borderRadius:8,border:`1px solid ${T.border}`,padding:'18px' }}>
            <span style={{ fontSize:13,fontWeight:600,color:T.text,display:'block',marginBottom:12 }}>Quick Actions</span>
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              {[
                { l:'Post a New Job',    p:'/recruiter/jobs/create' },
                { l:'View Applications', p:'/recruiter/applications' },
                { l:'Referrals',         p:'/recruiter/referrals' },
                { l:'Analytics',         p:'/recruiter/analytics' },
                { l:'Resume Pool',       p:'/recruiter/resume-pool' },
              ].map(a => (
                <button key={a.p} onClick={() => navigate(a.p)} className="qa" style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',borderRadius:6,border:`1px solid ${T.border}`,background:T.card,cursor:'pointer',fontSize:12.5,color:T.textSec,fontFamily:'inherit',transition:'background 120ms' }}>
                  {a.l}<ChevronRight size={12} style={{ color:T.textMuted }}/>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div style={{ background:T.card,borderRadius:8,border:`1px solid ${T.border}`,overflow:'hidden' }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'13px 20px',borderBottom:`1px solid ${T.borderLt}` }}>
            <span style={{ fontSize:13,fontWeight:600,color:T.text }}>Recent Jobs</span>
            <button onClick={() => navigate('/recruiter/jobs')} style={{ display:'flex',alignItems:'center',gap:4,fontSize:12.5,color:T.primary,background:'none',border:'none',cursor:'pointer',fontWeight:500,fontFamily:'inherit' }}>
              View all <ArrowRight size={12}/>
            </button>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding:'48px',textAlign:'center' }}>
              <Briefcase size={28} style={{ color:'#E2E8F0',marginBottom:8 }}/>
              <p style={{ fontSize:13,color:T.textMuted,margin:0 }}>No jobs posted yet</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse',minWidth:620 }}>
                <thead>
                  <tr style={{ background:'#F9FAFB',borderBottom:`1px solid ${T.border}` }}>
                    {['Job Title','Location','Type','Status','Actions'].map(h => (
                      <th key={h} style={{ padding:'9px 18px',textAlign:'left',fontSize:11.5,fontWeight:600,color:T.textMuted,letterSpacing:'0.03em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0,8).map((job:any) => (
                    <tr key={job.id} className="rd-job" style={{ borderBottom:`1px solid ${T.borderLt}` }}>
                      <td style={{ padding:'11px 18px',fontSize:13.5,fontWeight:500,color:T.text }}>{job.title}</td>
                      <td style={{ padding:'11px 18px',fontSize:12.5,color:T.textSec }}>{job.location||'—'}</td>
                      <td style={{ padding:'11px 18px',fontSize:12.5,color:T.textSec }}>{job.type||'—'}</td>
                      <td style={{ padding:'11px 18px' }}><StatusDot status={job.status}/></td>
                      <td style={{ padding:'11px 18px' }}>
                        <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                          <button className="btn-sm" onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)} style={{ padding:'3px 10px',fontSize:11.5,fontWeight:500,color:T.primary,background:T.pLight,border:'none',borderRadius:5,cursor:'pointer',fontFamily:'inherit' }}>
                            View
                          </button>
                          <button className="btn-sm" onClick={() => openLinks(job.id)} style={{ display:'flex',alignItems:'center',gap:3,padding:'3px 10px',fontSize:11.5,color:T.textSec,background:'#F1F5F9',border:'none',borderRadius:5,cursor:'pointer',fontFamily:'inherit' }}>
                            <LinkIcon size={10}/> Links
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Links Modal */}
      {linksModal && linksData && (
        <Modal title="Share Links" sub="Copy and share with candidates" onClose={() => setLinksModal(false)} maxW={460}>
          <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
            {[
              { label:'Application Link', sub:'Share with candidates', val: linksData.applicationLink||linksData.applyLink||`${window.location.origin}/apply?jobId=${linksData.jobId||''}`, key:'apply' },
              { label:'Interview Link',   sub:'For shortlisted only',  val: linksData.link||linksData.assessmentLink||'', key:'int' },
            ].map(({ label,sub,val,key }) => (
              <div key={key}>
                <p style={{ fontSize:12.5,fontWeight:500,color:T.text,margin:'0 0 2px' }}>{label}</p>
                <p style={{ fontSize:11,color:T.textMuted,margin:'0 0 7px' }}>{sub}</p>
                <div style={{ display:'flex',gap:7 }}>
                  <input readOnly value={val} style={{ flex:1,fontSize:11.5,fontFamily:'monospace',background:'#F9FAFB',border:`1px solid ${T.border}`,borderRadius:6,padding:'7px 10px',color:T.textSec,outline:'none' }}/>
                  <button onClick={() => copy(val,key)} style={{ display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:6,border:'none',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit',background: copiedKey===key?T.sBg:T.primary,color: copiedKey===key?T.success:'#fff' }}>
                    <Copy size={11}/>{copiedKey===key?'Copied!':'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RecruiterDashboard;
