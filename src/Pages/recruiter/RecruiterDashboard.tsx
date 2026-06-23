import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Users, CheckCircle, Plus, Copy, X,
  TrendingUp, ArrowRight, Wand2, Clock, Target,
  Link as LinkIcon, ChevronRight, UserCheck,
} from 'lucide-react';
import recruiterAPI, { referralAPI } from '../../services/recruiterAPI';

const CSS = `
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes rd-in  { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:none; } }
  .rd-kpi           { animation: rd-in .2s ease both; transition: border-color .15s; }
  .rd-kpi:hover     { border-color: #FECDD3 !important; }
  .rd-qa:hover      { background: #FDF2F2 !important; }
  .rd-row:hover td  { background: #FDF2F2 !important; }
  .rd-btn:hover     { filter: brightness(.93); }
`;

const Spinner = () => (
  <div style={{ width:22, height:22, border:'2px solid #e2e8f0', borderTop:'2px solid #8B0000', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
);

const KpiCard: React.FC<{
  label: string; value: number | string;
  icon: React.ReactNode; iBg: string; iCol: string; delay?: number;
}> = ({ label, value, icon, iBg, iCol, delay = 0 }) => (
  <div className="rd-kpi" style={{
    background:'white', borderRadius:10, border:'1px solid #e2e8f0',
    padding:'16px 18px', display:'flex', gap:13, alignItems:'center',
    animationDelay:`${delay}s`,
  }}>
    <div style={{ width:38, height:38, borderRadius:9, background:iBg, display:'flex', alignItems:'center', justifyContent:'center', color:iCol, flexShrink:0 }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize:10.5, color:'#94a3b8', margin:'0 0 3px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:800, color:'#0f172a', margin:0, lineHeight:1, letterSpacing:'-0.03em' }}>{value}</p>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, [string, string]> = {
    active:   ['#f0fdf4', '#15803d'],
    inactive: ['#ffffff', '#64748b'],
    closed:   ['#fef2f2', '#b91c1c'],
    draft:    ['#fffbeb', '#92400e'],
  };
  const [bg, col] = map[status?.toLowerCase()] ?? ['#ffffff', '#64748b'];
  return (
    <span style={{ padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, background:bg, color:col, textTransform:'capitalize' }}>
      {status || 'active'}
    </span>
  );
};

const Modal: React.FC<{
  title: string; sub?: string; onClose: () => void; maxW?: number; children: React.ReactNode;
}> = ({ title, sub, onClose, maxW = 460, children }) => (
  <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:60, padding:20 }}>
    <div style={{ background:'white', borderRadius:12, border:'1px solid #e2e8f0', width:'100%', maxWidth:maxW, maxHeight:'88vh', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #ffffff', flexShrink:0 }}>
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0 }}>{title}</h3>
          {sub && <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>{sub}</p>}
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', padding:4, display:'flex' }}>
          <X size={15} />
        </button>
      </div>
      <div style={{ overflowY:'auto', flex:1, padding:'18px 20px' }}>{children}</div>
    </div>
  </div>
);

const RecruiterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dash,       setDash]       = useState<any>(null);
  const [jobs,       setJobs]       = useState<any[]>([]);
  const [referrals,  setReferrals]  = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [linksModal, setLinksModal] = useState(false);
  const [linksData,  setLinksData]  = useState<any>(null);
  const [copiedKey,  setCopiedKey]  = useState<string | null>(null);

  const recruiterUser = JSON.parse(localStorage.getItem('recruiter_user') || localStorage.getItem('recruiter') || '{}');
  const recruiterId = recruiterUser?.id ?? null;

  useEffect(() => {
    if (!localStorage.getItem('recruiter_token')) { navigate('/RecruiterLogin'); return; }
    Promise.all([
      recruiterAPI.getDashboardStats(),
      recruiterAPI.getAllJobs(),
      referralAPI.getAll({ recruiterId, page: 1, limit: 5 }).catch(() => ({ referrals: [] })),
    ])
      .then(([d, jl, refs]) => {
        setDash(d);
        setJobs(Array.isArray(jl) ? jl : jl?.jobs ?? []);
        setReferrals(refs?.referrals || []);
      })
      .finally(() => setLoading(false));
  }, [navigate, recruiterId]);

  const openLinks = async (jobId: string) => {
    try { const r = await recruiterAPI.generateLinks(jobId); setLinksData(r); setLinksModal(true); }
    catch { alert('Failed to generate links'); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#ffffff' }}>
      <Spinner />
    </div>
  );

  const pl = dash?.pipeline || {};
  const kpis = [
    { label:'Active Jobs',  value: dash?.totalJobs ?? jobs.length,           icon:<Briefcase size={16}/>, iBg:'#EFF6FF', iCol:'#1D4ED8'  },
    { label:'Applications', value: dash?.totalCandidates ?? pl.applied ?? 0, icon:<Users size={16}/>,     iBg:'#f0fdf4', iCol:'#15803d'  },
    { label:'Screened',     value: pl.in_progress ?? 0,                      icon:<Target size={16}/>,    iBg:'#fffbeb', iCol:'#92400e'  },
    { label:'Shortlisted',  value: pl.shortlisted ?? 0,                      icon:<Clock size={16}/>,     iBg:'#eff6ff', iCol:'#1d4ed8'  },
    { label:'Hired',        value: pl.completed ?? dash?.hired ?? 0,         icon:<CheckCircle size={16}/>, iBg:'#f0fdf4', iCol:'#15803d' },
  ];

  const stages = [
    { label:'Screened',    count: pl.in_progress || 0, color:'#F59E0B' },
    { label:'Shortlisted', count: pl.shortlisted  || 0, color:'#1d4ed8' },
    { label:'Hired',       count: pl.completed    || 0, color:'#15803d' },
    { label:'Rejected',    count: pl.rejected     || 0, color:'#dc2626' },
  ];
  const maxPl = Math.max(...stages.map(s => s.count), 1);

  const quickActions = [
    { l:'Post a New Job',    p:'/recruiter/jobs/create' },
    { l:'View Applications', p:'/recruiter/applications' },
    { l:'Referrals',         p:'/recruiter/referrals' },
    { l:'Analytics',         p:'/recruiter/analytics' },
    { l:'Resume Pool',       p:'/recruiter/resume-pool' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ background:'white', borderBottom:'1px solid #e2e8f0', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:30 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0, letterSpacing:'-0.3px' }}>Dashboard</h1>
          <p style={{ fontSize:12, color:'#94a3b8', margin:'1px 0 0' }}>Hiring overview</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/recruiter/jobs/create?ai=true')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:7, border:'1px solid #e2e8f0', background:'white', color:'#475569', fontSize:12.5, fontWeight:500, cursor:'pointer' }}>
            <Wand2 size={13}/> AI Job
          </button>
          <button onClick={() => navigate('/recruiter/jobs/create')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:7, border:'none', background:'#8B0000', color:'white', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>
            <Plus size={14}/> Post Job
          </button>
        </div>
      </div>

      <div style={{ maxWidth:1160, margin:'0 auto', padding:'20px 28px', display:'flex', flexDirection:'column', gap:16 }}>

        {/* KPI row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
          {kpis.map((k, i) => <KpiCard key={k.label} {...k} delay={i * 0.06} />)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 272px', gap:14 }}>
          {/* Pipeline */}
          <div style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', padding:'18px 22px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Candidate Pipeline</span>
              <TrendingUp size={14} style={{ color:'#94a3b8' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {stages.map(s => (
                <div key={s.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, color:'#475569', width:82, flexShrink:0 }}>{s.label}</span>
                  <div style={{ flex:1, height:6, background:'#ffffff', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(s.count / maxPl * 100)}%`, background:s.color, borderRadius:4, transition:'width .7s ease' }}/>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0f172a', width:28, textAlign:'right', flexShrink:0 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', padding:'18px' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a', display:'block', marginBottom:12 }}>Quick Actions</span>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {quickActions.map(a => (
                <button key={a.p} onClick={() => navigate(a.p)} className="rd-qa"
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 10px', borderRadius:7, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:12.5, color:'#475569', transition:'background 120ms', textAlign:'left' }}>
                  {a.l}<ChevronRight size={12} style={{ color:'#94a3b8' }}/>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Referrals */}
        <div style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderBottom:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <UserCheck size={14} style={{ color:'#ea580c' }}/>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Recent Referrals</span>
              {referrals.length > 0 && <span style={{ padding:'1px 8px', borderRadius:20, fontSize:11, fontWeight:700, background:'#fff7ed', color:'#ea580c' }}>{referrals.length}</span>}
            </div>
            <button onClick={() => navigate('/recruiter/referrals')}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'#ea580c', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View all <ArrowRight size={12}/>
            </button>
          </div>
          {referrals.length === 0 ? (
            <div style={{ padding:'36px', textAlign:'center' }}>
              <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>No referrals yet</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:520 }}>
                <thead>
                  <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                    {['Candidate', 'Referred By', 'Job', 'Status', 'CV', 'Date'].map(h => (
                      <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((r: any) => {
                    const SS: Record<string,{bg:string;color:string}> = {
                      pending:{ bg:'#f1f5f9', color:'#475569' }, screened:{ bg:'#dbeafe', color:'#1d4ed8' },
                      approved:{ bg:'#f0fdf4', color:'#15803d' }, shortlisted:{ bg:'#f0fdf4', color:'#15803d' },
                      rejected:{ bg:'#fef2f2', color:'#b91c1c' }, interview_sent:{ bg:'#fff7ed', color:'#c2410c' },
                      hired:{ bg:'#f0fdf4', color:'#15803d' }, applied:{ bg:'#e0f2fe', color:'#0369a1' },
                    };
                    const SL: Record<string,string> = { pending:'Pending', screened:'Screened', approved:'Approved', shortlisted:'Shortlisted', rejected:'Rejected', interview_sent:'Interview Sent', hired:'Hired', applied:'Applied' };
                    const st = SS[r.status] || SS.pending;
                    const resumeUrl = r.resume_url || r.candidate_resume_url;
                    return (
                      <tr key={r.id} className="rd-row" style={{ borderBottom:'1px solid #f1f5f9', cursor:'pointer' }} onClick={() => navigate('/recruiter/referrals')}>
                        <td style={{ padding:'11px 16px' }}>
                          <div style={{ fontSize:13, fontWeight:600, color:'#0f172a' }}>{r.candidate_name}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{r.candidate_email}</div>
                        </td>
                        <td style={{ padding:'11px 16px', fontSize:12, color:'#475569' }}>{r.referred_by || r.referrer_name || '—'}</td>
                        <td style={{ padding:'11px 16px', fontSize:12, color:'#475569' }}>{r.job_title || `Job #${r.job_id}`}</td>
                        <td style={{ padding:'11px 16px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:st.bg, color:st.color, whiteSpace:'nowrap' }}>{SL[r.status] || r.status}</span>
                        </td>
                        <td style={{ padding:'11px 16px' }} onClick={e => e.stopPropagation()}>
                          {resumeUrl
                            ? <a href={resumeUrl} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:6, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:12, fontWeight:500, textDecoration:'none' }}>📄 CV</a>
                            : <span style={{ fontSize:12, color:'#cbd5e1' }}>—</span>}
                        </td>
                        <td style={{ padding:'11px 16px', fontSize:12, color:'#94a3b8', whiteSpace:'nowrap' }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 20px', borderBottom:'1px solid #ffffff' }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>Recent Jobs</span>
            <button onClick={() => navigate('/recruiter/jobs')}
              style={{ display:'flex', alignItems:'center', gap:4, fontSize:12.5, color:'#1D4ED8', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
              View all <ArrowRight size={12}/>
            </button>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center' }}>
              <div style={{ width:44, height:44, background:'#FDF2F2', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                <Briefcase size={20} style={{ color:'#1D4ED8' }}/>
              </div>
              <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 14px' }}>No jobs posted yet</p>
              <button onClick={() => navigate('/recruiter/jobs/create')}
                style={{ padding:'8px 18px', background:'#8B0000', color:'white', border:'none', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                Post First Job
              </button>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:580 }}>
                <thead>
                  <tr style={{ background:'#ffffff', borderBottom:'1px solid #e2e8f0' }}>
                    {['Job Title', 'Location', 'Type', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding:'9px 18px', textAlign:'left', fontSize:11, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jobs.slice(0, 8).map((job: any) => (
                    <tr key={job.id} className="rd-row" style={{ borderBottom:'1px solid #ffffff' }}>
                      <td style={{ padding:'11px 18px', fontSize:13.5, fontWeight:600, color:'#0f172a' }}>{job.title}</td>
                      <td style={{ padding:'11px 18px', fontSize:12.5, color:'#475569' }}>{job.location || '—'}</td>
                      <td style={{ padding:'11px 18px', fontSize:12.5, color:'#475569', textTransform:'capitalize' }}>{job.type || '—'}</td>
                      <td style={{ padding:'11px 18px' }}><StatusBadge status={job.status}/></td>
                      <td style={{ padding:'11px 18px' }}>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="rd-btn"
                            onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                            style={{ padding:'4px 12px', fontSize:12, fontWeight:600, color:'#1D4ED8', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, cursor:'pointer' }}>
                            View
                          </button>
                          <button className="rd-btn" onClick={() => openLinks(job.id)}
                            style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', fontSize:12, color:'#475569', background:'white', border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer' }}>
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
        <Modal title="Share Links" sub="Copy and share with candidates" onClose={() => setLinksModal(false)}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {[
              { label:'Application Link', sub:'Share with candidates', val: linksData.applicationLink || linksData.applyLink || `${window.location.origin}/apply?jobId=${linksData.jobId || ''}`, key:'apply' },
              { label:'Interview Link',   sub:'For shortlisted only',  val: linksData.link || linksData.assessmentLink || '', key:'int' },
            ].map(({ label, sub, val, key }) => (
              <div key={key}>
                <p style={{ fontSize:12.5, fontWeight:600, color:'#0f172a', margin:'0 0 2px' }}>{label}</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 7px' }}>{sub}</p>
                <div style={{ display:'flex', gap:7 }}>
                  <input readOnly value={val}
                    style={{ flex:1, fontSize:11.5, fontFamily:'monospace', background:'#ffffff', border:'1px solid #e2e8f0', borderRadius:7, padding:'7px 10px', color:'#475569', outline:'none' }}
                  />
                  <button onClick={() => copy(val, key)}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:7, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: copiedKey === key ? '#f0fdf4' : '#8B0000', color: copiedKey === key ? '#15803d' : 'white', transition:'background .15s' }}>
                    <Copy size={11}/>{copiedKey === key ? 'Copied!' : 'Copy'}
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
