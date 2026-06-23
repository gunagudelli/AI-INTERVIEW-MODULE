import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';
import { Briefcase, MapPin, Clock, Calendar, Link2, Pencil, Trash2, Users, Search, X, Copy, Check, IndianRupee } from 'lucide-react';

interface Job {
  id: string; title: string; description: string; location: string;
  type: string; experience: number; salary: string; skills: string[];
  department: string; status: string; createdAt: string;
}

const TYPE_BADGE: Record<string, string> = {
  'full-time': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  'part-time': 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  'contract':  'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  'internship':'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
};

const JobsList: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [linksModal, setLinksModal] = useState<any>(null);
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const r = await recruiterAPI.getJobs(); setJobs(r.jobs || []); }
    catch { setError('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job?')) return;
    setDeleting(id);
    try { await recruiterAPI.deleteJob(id); setJobs(p => p.filter(j => j.id !== id)); }
    catch { alert('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleLinks = async (id: string) => {
    try { const r = await recruiterAPI.generateLinks(id); setLinksModal(r); }
    catch { alert('Failed to generate links'); }
  };

  const copy = (val: string, key: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(key); setTimeout(() => setCopied(null), 2000);
  };

  const filtered = jobs.filter(j =>
    [j.title, j.department, j.location].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#ffffff' }}>
      <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTop:'2px solid #8B0000', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff', fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes jl-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .jl-card{animation:jl-in .18s ease both;transition:border-color .15s}
        .jl-card:hover{border-color:#cbd5e1!important}
      `}</style>

      {/* Header */}
      <div style={{ background:'white', borderBottom:'1px solid #e2e8f0', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }}>Job Postings</h1>
          <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>{jobs.length} active position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button
            onClick={() => navigate('/recruiter/jobs/create?ai=true')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'white', border:'1px solid #e2e8f0', borderRadius:7, fontSize:12.5, fontWeight:500, color:'#475569', cursor:'pointer' }}
          >
            ✨ Generate with AI
          </button>
          <button
            onClick={() => navigate('/recruiter/jobs/create')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', background:'#8B0000', border:'none', borderRadius:7, fontSize:12.5, fontWeight:600, color:'white', cursor:'pointer' }}
          >
            + Post New Job
          </button>
        </div>
      </div>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'20px 28px' }}
>

        {error && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#b91c1c', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:13, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {error}
            <button onClick={load} style={{ background:'#b91c1c', color:'white', border:'none', borderRadius:5, padding:'3px 10px', fontSize:12, fontWeight:500, cursor:'pointer' }}>Retry</button>
          </div>
        )}

        {jobs.length > 0 && (
          <div style={{ position:'relative', marginBottom:16 }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
              style={{ width:'100%', paddingLeft:30, paddingRight:36, paddingTop:9, paddingBottom:9, border:'1px solid #e2e8f0', borderRadius:8, fontSize:13, background:'white', outline:'none', boxSizing:'border-box' as any, color:'#0f172a' }}/>
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                <X size={14}/>
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {jobs.length === 0 ? (
          <div style={{ background:'white', borderRadius:10, border:'2px dashed #e2e8f0', padding:'64px 24px', textAlign:'center' }}>
            <div style={{ width:48, height:48, background:'#ffffff', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
              <Briefcase size={22} style={{ color:'#94a3b8' }} />
            </div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:'0 0 6px' }}>No jobs posted yet</h2>
            <p style={{ fontSize:13, color:'#94a3b8', margin:'0 0 20px' }}>Post your first job to start receiving applications.</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={() => navigate('/recruiter/jobs/create?ai=true')}
                style={{ padding:'8px 18px', background:'white', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13, fontWeight:500, color:'#475569', cursor:'pointer' }}>
                ✨ Generate with AI
              </button>
              <button onClick={() => navigate('/recruiter/jobs/create')}
                style={{ padding:'8px 18px', background:'#8B0000', border:'none', borderRadius:7, fontSize:13, fontWeight:600, color:'white', cursor:'pointer' }}>
                Create First Job
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', padding:'48px', textAlign:'center' }}>
            <p style={{ color:'#94a3b8', fontSize:13, margin:'0 0 8px' }}>No jobs found for "{search}"</p>
            <button onClick={() => setSearch('')} style={{ fontSize:13, color:'#475569', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Clear search</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map((job, i) => (
              <div key={job.id} className="jl-card" style={{ background:'white', borderRadius:10, border:'1px solid #e2e8f0', padding:'16px 20px', animationDelay:`${i*0.06}s` }}>
                <div style={{ display:'flex', gap:14 }}>

                  {/* Icon */}
                  <div style={{ width:40, height:40, borderRadius:9, background:'#ffffff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                    <Briefcase size={18} style={{ color:'#475569' }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Title + badges */}
                    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:7, marginBottom:6 }}>
                      <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0 }}>{job.title}</h3>
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background:'#ffffff', color:'#475569', border:'1px solid #e2e8f0' }}>
                        {(job.type || 'full-time').replace('-', ' ')}
                      </span>
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background: job.status === 'active' ? '#f0fdf4' : '#ffffff', color: job.status === 'active' ? '#15803d' : '#94a3b8', border:`1px solid ${job.status === 'active' ? '#bbf7d0' : '#e2e8f0'}` }}>
                        {job.status || 'active'}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px', marginBottom:8, fontSize:12, color:'#94a3b8' }}>
                      {job.department && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={11}/>{job.department}</span>}
                      {job.location   && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{job.location}</span>}
                      {job.experience > 0 && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{job.experience}+ yrs</span>}
                      {job.salary     && <span style={{ display:'flex', alignItems:'center', gap:4 }}><IndianRupee size={11}/>{job.salary}</span>}
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={11}/>
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Recently'}
                      </span>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize:13, color:'#64748b', lineHeight:1.6, margin:'0 0 10px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as any }}>{job.description}</p>

                    {/* Skills */}
                    {job.skills?.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
                        {job.skills.slice(0, 6).map(sk => (
                          <span key={sk} style={{ fontSize:11, fontWeight:500, background:'#ffffff', color:'#475569', padding:'2px 9px', borderRadius:5, border:'1px solid #e2e8f0' }}>{sk}</span>
                        ))}
                        {job.skills.length > 6 && (
                          <span style={{ fontSize:11, color:'#94a3b8', padding:'2px 6px' }}>+{job.skills.length - 6} more</span>
                        )}
                      </div>
                    )}

                    {/* Action bar */}
                    <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:10, borderTop:'1px solid #ffffff' }}>
                      <button onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 12px', background:'#8B0000', color:'white', border:'none', borderRadius:6, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                        <Users size={12}/> Applications
                      </button>
                      <button onClick={() => handleLinks(job.id)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:'white', color:'#475569', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                        <Link2 size={12}/> Links
                      </button>
                      <button onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:'white', color:'#475569', border:'1px solid #e2e8f0', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer' }}>
                        <Pencil size={12}/> Edit
                      </button>
                      <button onClick={() => handleDelete(job.id)} disabled={deleting === job.id}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:'#fef2f2', color:'#b91c1c', border:'1px solid #fecaca', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', marginLeft:'auto', opacity: deleting === job.id ? 0.5 : 1 }}>
                        <Trash2 size={12}/> {deleting === job.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Links Modal */}
      {linksModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:16 }} onClick={() => setLinksModal(null)}>
          <div style={{ background:'white', borderRadius:10, width:'100%', maxWidth:460, border:'1px solid #e2e8f0' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #ffffff' }}>
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:'#0f172a', margin:0 }}>Share Links</h3>
                <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>Copy and share with candidates</p>
              </div>
              <button onClick={() => setLinksModal(null)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex' }}><X size={15}/></button>
            </div>
            <div style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { label:'Application Link', sub:'Share with candidates to apply', val: linksModal.applicationLink || linksModal.applyLink || `${window.location.origin}/apply?jobId=${linksModal.jobId || ''}`, key:'apply' },
                { label:'Interview Link',   sub:'For shortlisted candidates only', val: linksModal.link || linksModal.assessmentLink || '', key:'interview' },
              ].map(({ label, sub, val, key }) => (
                <div key={key}>
                  <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 2px' }}>{label}</p>
                  <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 6px' }}>{sub}</p>
                  <div style={{ display:'flex', gap:7 }}>
                    <input readOnly value={val} style={{ flex:1, fontSize:11, fontFamily:'monospace', background:'#FFFFFF', border:'1px solid #e2e8f0', borderRadius:6, padding:'7px 10px', color:'#475569', outline:'none' }}/>
                    <button onClick={() => copy(val, key)}
                      style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 14px', borderRadius:6, border:'none', fontSize:12, fontWeight:600, cursor:'pointer', background: copied===key ? '#f0fdf4' : '#8B0000', color: copied===key ? '#15803d' : 'white' }}>
                      {copied===key ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ background:'#ffffff', borderRadius:7, padding:'10px 13px', fontSize:12, color:'#64748b', border:'1px solid #ffffff' }}>
                <strong>Tip:</strong> Application link is for public posts. Interview link is for shortlisted candidates only.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsList;
