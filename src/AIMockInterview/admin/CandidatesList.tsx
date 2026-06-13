import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateApi } from './api';
import { Candidate } from './types';
import { LoadingSpinner, EmptyState, ErrorState } from './components';
import { AdvancedFilter } from './AdvancedFilter';

type SortField = 'name' | 'bestScore' | 'createdAt';

const scoreStyle = (s: string) => {
  const n = parseFloat(s || '0');
  if (n >= 60) return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
  if (n >= 40) return { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' };
  return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
};

const resultStyle = (r: string) => {
  if (r === 'Selected') return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
  if (r === 'Not Selected') return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
  return { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' };
};

const CSS = `
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .cl-row { transition: background .1s }
  .cl-row:hover { background: #f8fafc !important }
`;

export const CandidatesList: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchCandidates = async () => {
    try {
      setLoading(true); setError('');
      const data = await candidateApi.getCandidates();
      setCandidates(data.filter(c => c.name !== 'N/A'));
    } catch { setError('Failed to load candidates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const list = useMemo(() => {
    let r = [...candidates];
    if (search.trim()) {
      const t = search.toLowerCase();
      r = r.filter(c => c.name?.toLowerCase().includes(t) || c.skills?.some(s => s.toLowerCase().includes(t)));
    }
    r.sort((a, b) => {
      let av: any, bv: any;
      if (sortField === 'bestScore') { av = parseFloat(a.summary?.bestScore || '0'); bv = parseFloat(b.summary?.bestScore || '0'); }
      else if (sortField === 'createdAt') { av = new Date(a.createdAt || 0).getTime(); bv = new Date(b.createdAt || 0).getTime(); }
      else { av = a.name || ''; bv = b.name || ''; }
      return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [candidates, search, sortField, sortOrder]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchCandidates} />;

  const total = candidates.length;
  const selected = candidates.filter(c => c.summary?.bestResult === 'Selected').length;
  const notSelected = candidates.filter(c => c.summary?.bestResult === 'Not Selected').length;

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter','Segoe UI',sans-serif", color: '#111827' }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 3px' }}>Candidates</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>All interview candidates</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total', value: total, color: '#111827' },
          { label: 'Showing', value: list.length, color: '#2563eb' },
          { label: 'Selected', value: selected, color: '#16a34a' },
          { label: 'Not Selected', value: notSelected, color: '#dc2626' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, padding: '12px 16px' }}>
            <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', margin: '0 0 5px' }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + controls */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width={14} height={14} fill="none" stroke="#94a3b8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name or skill…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 32 : 10, paddingTop: 7, paddingBottom: 7, border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', color: '#111827', background: '#f8fafc', boxSizing: 'border-box' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}>✕</button>
          )}
        </div>
        <select value={sortField} onChange={e => setSortField(e.target.value as SortField)}
          style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, color: '#374151', background: '#f8fafc', outline: 'none', cursor: 'pointer' }}>
          <option value="createdAt">Date</option>
          <option value="bestScore">Score</option>
          <option value="name">Name</option>
        </select>
        <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          style={{ padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', cursor: 'pointer', color: '#64748b', lineHeight: 1 }}>
          <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </button>
        <button onClick={fetchCandidates}
          style={{ padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: '#f8fafc', cursor: 'pointer', fontSize: 12, color: '#64748b', fontWeight: 500 }}>
          Refresh
        </button>
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <EmptyState message={search ? 'No candidates match your search' : 'No candidates found'} />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Candidate', 'Skills', 'Exp', 'Score', 'Violations', 'Result', ''].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => {
                  const copyPasteCount = (c as any).copyPasteViolations ?? (c as any).copyPasteCount ?? 0;
                  const rs = resultStyle(c.summary?.bestResult || '');
                  const ss = scoreStyle(c.summary?.bestScore || '0');
                  return (
                    <tr key={c.userId} className="cl-row" style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: '#fff' }}
                      onClick={() => navigate(`/admin/candidate/${c.userId}`)}>

                      {/* Candidate */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                            {c.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 600, color: '#2563eb', fontSize: 13 }}>{c.name || 'N/A'}</p>
                            <p style={{ margin: 0, fontSize: 10.5, color: '#94a3b8', fontFamily: 'monospace' }}>{c.userId?.slice(0, 10)}…</p>
                          </div>
                        </div>
                      </td>

                      {/* Skills */}
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c.skills?.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ padding: '1px 7px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>{s}</span>
                          ))}
                          {(c.skills?.length || 0) > 3 && (
                            <span style={{ padding: '1px 7px', background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 4, fontSize: 11 }}>+{c.skills!.length - 3}</span>
                          )}
                          {!c.skills?.length && <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>}
                        </div>
                      </td>

                      {/* Experience */}
                      <td style={{ padding: '11px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: '#374151' }}>
                          {c.experience > 0 ? `${c.experience} yr${c.experience !== 1 ? 's' : ''}` : 'Fresher'}
                        </span>
                      </td>

                      {/* Score */}
                      <td style={{ padding: '11px 14px' }}>
                        {c.summary?.bestScore && c.summary.bestScore !== 'N/A' ? (
                          <span style={{ ...ss, padding: '2px 9px', borderRadius: 5, fontSize: 12, fontWeight: 700 }}>{c.summary.bestScore}%</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Copy-paste violations — compact */}
                      <td style={{ padding: '11px 14px' }}>
                        {copyPasteCount > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                            <svg width={10} height={10} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                            </svg>
                            {copyPasteCount}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Result */}
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ ...rs, padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                          {c.summary?.bestResult || 'Pending'}
                        </span>
                      </td>

                      {/* Arrow */}
                      <td style={{ padding: '11px 14px' }}>
                        <svg width={14} height={14} fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '9px 14px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: 11, color: '#94a3b8' }}>
            {list.length} of {candidates.length} candidates
          </div>
        </div>
      )}
    </div>
  );
};
