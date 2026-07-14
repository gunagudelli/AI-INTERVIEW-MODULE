import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { recruiterAPI } from '../../services/recruiterAPI';
import { Briefcase, MapPin, Clock, Calendar, Link2, Pencil, Trash2, Users, Search, X, Copy, Check, IndianRupee, Power } from 'lucide-react';
import { ToastContainer } from '../../components/common/Toast';
import { useNotification } from '../../hooks/useNotification';

interface Job {
  id: string; title: string; description: string; location: string;
  type: string; experience: number; salary: string; skills: string[];
  department: string; status: string; createdAt: string;
  vacancies?: number; hired_count?: number | string;
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
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [linksModal, setLinksModal] = useState<any>(null);
  const [copied, setCopied]     = useState<string | null>(null);
  const { toasts, success: notifySuccess, error: notifyError, info: notifyInfo, removeNotification } = useNotification();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setLoading(true); const r = await recruiterAPI.getJobs(); setJobs(r.jobs || []); }
    catch { setError('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this job?')) return;
    setDeleting(id);
    try { await recruiterAPI.deleteJob(id); setJobs(p => p.filter(j => j.id !== id)); notifySuccess('Job deleted successfully'); }
    catch { notifyError('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const handleLinks = async (id: string) => {
    try { const r = await recruiterAPI.generateLinks(id); setLinksModal(r); notifyInfo('Links generated successfully'); }
    catch { notifyError('Failed to generate links'); }
  };

  const handleToggleStatus = async (job: Job) => {
    const nextStatus = job.status === 'active' ? 'inactive' : 'active';
    const label = nextStatus === 'inactive' ? 'mark this job Inactive (hidden from candidates)' : 'mark this job Active (visible to candidates)';
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    setTogglingStatus(job.id);
    try {
      await recruiterAPI.updateJob(job.id, { status: nextStatus });
      setJobs(p => p.map(j => j.id === job.id ? { ...j, status: nextStatus } : j));
      notifySuccess(nextStatus === 'inactive' ? 'Job marked Inactive' : 'Job marked Active');
    } catch { notifyError('Failed to update job status'); }
    finally { setTogglingStatus(null); }
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
      <ToastContainer toasts={toasts} onClose={removeNotification} />

      {/* Header */}
      <div style={{ background:'#FAFAFA', borderBottom:'1px solid #e2e8f0', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:700, color:'#0f172a', margin:0 }}>Job Postings</h1>
          <p style={{ fontSize:12, color:'#94a3b8', margin:'2px 0 0' }}>{jobs.length} active position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {jobs.length > 0 && (
            <div style={{ position:'relative' }}>
              <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }}/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
                style={{ width:220, paddingLeft:30, paddingRight:search ? 30 : 12, paddingTop:8, paddingBottom:8, border:'1px solid #e2e8f0', borderRadius:7, fontSize:12.5, background:'white', outline:'none', boxSizing:'border-box' as any, color:'#0f172a' }}/>
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex' }}>
                  <X size={13}/>
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => navigate('/recruiter/jobs/create?ai=true')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'white', border:'1px solid #e2e8f0', borderRadius:7, fontSize:12.5, fontWeight:500, color:'#475569', cursor:'pointer' }}
          >
            ? Generate with AI
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
                ? Generate with AI
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
                      <span style={{ fontSize:11, fontWeight:500, padding:'2px 8px', borderRadius:20, background: job.status === 'active' ? '#f0fdf4' : job.status === 'inactive' ? '#fef2f2' : '#ffffff', color: job.status === 'active' ? '#15803d' : job.status === 'inactive' ? '#b91c1c' : '#94a3b8', border:`1px solid ${job.status === 'active' ? '#bbf7d0' : job.status === 'inactive' ? '#fecaca' : '#e2e8f0'}` }}>
                        {job.status || 'active'}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 16px', marginBottom:8, fontSize:12, color:'#94a3b8' }}>
                      {job.department && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={11}/>{job.department}</span>}
                      {job.location   && <span style={{ display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{job.location}</span>}
                      {job.experience > 0 && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={11}/>{job.experience}+ yrs</span>}
                      {job.salary     && <span style={{ display:'flex', alignItems:'center', gap:4 }}><IndianRupee size={11}/>{job.salary}</span>}
                      {job.vacancies != null && (() => {
                        const hired = Number(job.hired_count || 0);
                        const remaining = Math.max(job.vacancies - hired, 0);
                        return (
                          <span style={{ display:'flex', alignItems:'center', gap:4, fontWeight: remaining === 0 ? 600 : 400, color: remaining === 0 ? '#b91c1c' : '#94a3b8' }}>
                            <Users size={11}/>{remaining} of {job.vacancies} position{job.vacancies !== 1 ? 's' : ''} remaining
                          </span>
                        );
                      })()}
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
                      <button onClick={() => handleToggleStatus(job)} disabled={togglingStatus === job.id}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background: job.status === 'active' ? '#fff7ed' : '#f0fdf4', color: job.status === 'active' ? '#c2410c' : '#15803d', border:`1px solid ${job.status === 'active' ? '#fed7aa' : '#bbf7d0'}`, borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', opacity: togglingStatus === job.id ? 0.5 : 1 }}>
                        <Power size={12}/> {togglingStatus === job.id ? 'Updating...' : job.status === 'active' ? 'Mark Inactive' : 'Mark Active'}
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

      {/* Links Modal — rendered via a portal directly on document.body so its
          `position: fixed` centers relative to the actual viewport, not whichever
          ancestor (e.g. RecruiterLayout's animated .rl-main wrapper) might otherwise
          become its containing block and push it out of view. */}
      {linksModal && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,.52)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: 16,
            overflowY: 'auto',
          }}
          onClick={() => setLinksModal(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              width: 'min(100%, 480px)',
              maxHeight: 'calc(100vh - 32px)',
              overflow: 'auto',
              border: '1px solid #e2e8f0',
              boxShadow: '0 24px 70px rgba(15,23,42,.22)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', borderBottom:'1px solid #f1f5f9' }}>
              <div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }}>Share Links</h3>
                <p style={{ fontSize:12, color:'#94a3b8', margin:'3px 0 0' }}>Copy and share with candidates</p>
              </div>
              <button onClick={() => setLinksModal(null)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', display:'flex', padding:4 }}>
                <X size={16}/>
              </button>
            </div>
            <div style={{ padding:'18px', display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <p style={{ fontSize:12, fontWeight:600, color:'#374151', margin:'0 0 4px' }}>Apply Link</p>
                <p style={{ fontSize:11, color:'#94a3b8', margin:'0 0 8px' }}>Share with candidates to apply</p>
                <div style={{ display:'flex', gap:7, alignItems:'stretch', flexWrap:'wrap' }}>
                  <input
                    readOnly
                    value={linksModal.applicationLink || linksModal.applyLink || `${window.location.origin}/apply?jobId=${linksModal.jobId || ''}`}
                    style={{
                      flex: '1 1 260px',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      background: '#FFFFFF',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '10px 12px',
                      color: '#475569',
                      outline: 'none',
                      minWidth: 0,
                    }}
                  />
                  <button
                    onClick={() => copy(linksModal.applicationLink || linksModal.applyLink || `${window.location.origin}/apply?jobId=${linksModal.jobId || ''}`, 'apply')}
                    style={{
                      display:'inline-flex',
                      alignItems:'center',
                      justifyContent:'center',
                      gap:6,
                      padding:'10px 16px',
                      borderRadius:10,
                      border:'none',
                      fontSize:12,
                      fontWeight:700,
                      cursor:'pointer',
                      background: copied==='apply' ? '#f0fdf4' : '#8B0000',
                      color: copied==='apply' ? '#15803d' : 'white',
                      flex: '0 0 auto',
                      minWidth: 92,
                    }}>
                    {copied==='apply' ? <><Check size={11}/> Copied</> : <><Copy size={11}/> Copy</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default JobsList;

