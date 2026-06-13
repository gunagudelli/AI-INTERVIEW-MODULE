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
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="w-8 h-8 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{`
        @keyframes jl-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .jl-card{animation:jl-in .18s ease both;transition:border-color .15s,box-shadow .15s}
        .jl-card:hover{border-color:#c4b5fd!important;box-shadow:0 2px 12px rgba(109,40,217,.07)!important}
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Job Postings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{jobs.length} active position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/recruiter/jobs/create?ai=true')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            ✨ Generate with AI
          </button>
          <button
            onClick={() => navigate('/recruiter/jobs/create')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <span className="text-lg leading-none">+</span> Post New Job
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm flex justify-between items-center">
            {error}
            <button onClick={load} className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium">Retry</button>
          </div>
        )}

        {/* Search */}
        {jobs.length > 0 && (
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Empty */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-24 text-center">
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-8 h-8 text-violet-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No jobs posted yet</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
              Post your first job to start receiving applications and find the right candidates.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/recruiter/jobs/create?ai=true')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                ✨ Generate with AI
              </button>
              <button
                onClick={() => navigate('/recruiter/jobs/create')}
                className="bg-violet-600 hover:bg-violet-700 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                Create First Job
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
            <p className="text-slate-500 text-sm">No jobs found for "{search}"</p>
            <button onClick={() => setSearch('')} className="text-violet-600 text-sm font-medium mt-2 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((job, i) => (
              <div key={job.id} className="jl-card bg-white rounded-xl border border-slate-200 p-5" style={{animationDelay:`${i*0.06}s`}}>
                <div className="flex gap-4">

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Briefcase className="w-5 h-5 text-violet-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Title + badges */}
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${TYPE_BADGE[job.type] || TYPE_BADGE['full-time']}`}>
                        {(job.type || 'full-time').replace('-', ' ')}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${job.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                        {job.status || 'active'}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-slate-500">
                      {job.department && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.department}</span>}
                      {job.location   && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>}
                      {job.experience > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.experience}+ yrs</span>}
                      {job.salary     && <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{job.salary}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-2">{job.description}</p>

                    {/* Skills */}
                    {job.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {job.skills.slice(0, 6).map(sk => (
                          <span key={sk} className="text-xs font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">{sk}</span>
                        ))}
                        {job.skills.length > 6 && (
                          <span className="text-xs text-slate-400 px-2 py-1">+{job.skills.length - 6} more</span>
                        )}
                      </div>
                    )}

                    {/* Action bar */}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`/recruiter/jobs/${job.id}/applications`)}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" /> View Applications
                      </button>
                      <button
                        onClick={() => handleLinks(job.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-violet-600 bg-slate-50 hover:bg-violet-50 border border-slate-200 hover:border-violet-200 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" /> Get Links
                      </button>
                      <button
                        onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={deleting === job.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting === job.id ? 'Deleting...' : 'Delete'}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setLinksModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Share Links</h3>
                <p className="text-xs text-slate-400 mt-0.5">Copy and share with candidates</p>
              </div>
              <button onClick={() => setLinksModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {[
                { label: 'Application Link', sub: 'Share with candidates to apply for this role', val: linksModal.applicationLink || linksModal.applyLink || `${window.location.origin}/apply?jobId=${linksModal.jobId || ''}`, key: 'apply' },
                { label: 'Interview Link',   sub: 'Direct AI interview link for shortlisted candidates', val: linksModal.link || linksModal.assessmentLink || '', key: 'interview' },
              ].map(({ label, sub, val, key }) => (
                <div key={key}>
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-0.5">{label}</p>
                  <p className="text-xs text-slate-400 mb-2">{sub}</p>
                  <div className="flex gap-2">
                    <input
                      readOnly value={val}
                      className="flex-1 min-w-0 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none text-slate-600"
                    />
                    <button
                      onClick={() => copy(val, key)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${copied === key ? 'bg-emerald-600 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                    >
                      {copied === key ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-violet-50 rounded-lg px-4 py-3 text-xs text-violet-700">
                <span className="font-semibold">Tip:</span> Application link is for public job posts. Interview link is for shortlisted candidates only.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsList;
