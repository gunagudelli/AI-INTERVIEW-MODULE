import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { candidateApi } from './api';
import { Candidate } from './types';
import { LoadingSpinner, EmptyState, ErrorState } from './components';
import { AdvancedFilter } from './AdvancedFilter';
import { COLORS, RADIUS, SHADOW } from './adminTheme';

type SortField = 'name' | 'bestScore' | 'createdAt';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  .cl-table tbody tr {
    border-left: 3px solid transparent;
    transition: border-color 0.12s ease, background 0.12s ease;
  }
  .cl-table tbody tr:hover {
    background: #F8FAFC !important;
    border-left-color: #2563EB;
  }
  .act-btn {
    padding: 5px 11px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.02em;
    transition: background 0.1s ease, color 0.1s ease;
    white-space: nowrap;
    font-family: inherit;
  }
  .act-btn-mail,
  .act-btn-resume { background: ${COLORS.neutralTint}; color: ${COLORS.textSecondary}; border: 1px solid ${COLORS.border}; }
  .act-btn-reject { background: ${COLORS.dangerTint}; color: ${COLORS.dangerDark}; border: 1px solid ${COLORS.dangerBorder}; }
  .act-btn-hire   { background: ${COLORS.successTint}; color: ${COLORS.successDark}; border: 1px solid ${COLORS.successBorder}; }
  .act-btn:hover  { filter: brightness(0.95); }

  .cl-select, .cl-input {
    padding: 7px 10px;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    font-size: 13px;
    color: #374151;
    background: #F8FAFC;
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s;
  }
  .cl-select:focus, .cl-input:focus { border-color: #93C5FD; }

  .cl-sort-btn {
    padding: 7px 10px;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    background: #F8FAFC;
    cursor: pointer;
    color: #64748B;
    line-height: 1;
    transition: background 0.1s, border-color 0.1s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cl-sort-btn:hover { background: #F1F5F9; border-color: #CBD5E1; }

  .cl-refresh-btn {
    padding: 7px 14px;
    border: 1px solid #E2E8F0;
    border-radius: 6px;
    background: #F8FAFC;
    cursor: pointer;
    font-size: 12px;
    color: #64748B;
    font-weight: 500;
    font-family: inherit;
    transition: background 0.1s, border-color 0.1s;
  }
  .cl-refresh-btn:hover { background: #F1F5F9; border-color: #CBD5E1; }
`;

interface CandidatesListProps {
  // When rendered inside AdminDashboard, the parent swaps in <CandidateDetail>
  // for the same tab (keeping the sidebar visible) instead of navigating to the
  // standalone /admin/candidate/:userId route, which has no sidebar at all.
  onSelectCandidate?: (userId: string) => void;
}

export const CandidatesList: React.FC<CandidatesListProps> = ({ onSelectCandidate }) => {
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
      if (sortField === 'bestScore') { av = parseFloat(a.bestScore || '0'); bv = parseFloat(b.bestScore || '0'); }
      else if (sortField === 'createdAt') { av = new Date(a.createdAt || 0).getTime(); bv = new Date(b.createdAt || 0).getTime(); }
      else { av = a.name || ''; bv = b.name || ''; }
      return sortOrder === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [candidates, search, sortField, sortOrder]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={fetchCandidates} />;

  const total = candidates.length;
  const selected = candidates.filter(c => c.examStatus === 'selected').length;
  const notSelected = candidates.filter(c => c.examStatus === 'completed').length;

  const statCards = [
    { label: 'Total', value: total, accent: '#0F172A' },
    { label: 'Selected', value: selected, accent: '#15803D' },
    { label: 'Not Selected', value: notSelected, accent: '#B91C1C' },
  ];

  return (
    <div style={{ padding: '28px 28px', fontFamily: "'Inter', 'Segoe UI', sans-serif", color: '#0F172A', minHeight: '100vh', background: '#F8FAFC' }}>
      <style>{CSS}</style>

      {/* Header: title + stats + search + sort + refresh — all in one row */}
      <div style={{ marginBottom: 14, borderBottom: '1px solid #E2E8F0', paddingBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', rowGap: 10 }}>
        <div style={{ flexShrink: 0 }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 2px', color: '#0F172A', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>Candidates</h1>
          <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0, fontWeight: 400, whiteSpace: 'nowrap' }}>Interview candidate records</p>
        </div>

        {/* Stats — compact inline pills, but with enough contrast/weight to stand out */}
        {statCards.map(s => (
          <div key={s.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.sm, height: 36, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 7, boxSizing: 'border-box', flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.accent, flexShrink: 0 }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em' }}>{s.value}</span>
            <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{s.label}</span>
          </div>
        ))}

        {/* Search */}
        <div style={{ width: 190, flexShrink: 0, position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width={13} height={13} fill="none" stroke="#94A3B8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name or skill…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="cl-input"
            style={{ width: '100%', paddingLeft: 32, paddingRight: search ? 30 : 10, boxSizing: 'border-box' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', lineHeight: 1, fontSize: 14 }}
            >
              ×
            </button>
          )}
        </div>

        <select value={sortField} onChange={e => setSortField(e.target.value as SortField)} className="cl-select" style={{ flexShrink: 0 }}>
          <option value="createdAt">Sort: Date</option>
          <option value="bestScore">Sort: Score</option>
          <option value="name">Sort: Name</option>
        </select>

        <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')} className="cl-sort-btn" title={sortOrder === 'asc' ? 'Ascending' : 'Descending'} style={{ flexShrink: 0 }}>
          <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: sortOrder === 'desc' ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', display: 'block' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </button>

        <button onClick={fetchCandidates} className="cl-refresh-btn" style={{ flexShrink: 0 }}>Refresh</button>
      </div>

      {/* Table */}
      {list.length === 0 ? (
        <EmptyState message={search ? 'No candidates match your search' : 'No candidates found'} />
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="cl-table" style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['Candidate', 'Skills', 'Experience', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => {
                  const copyPasteCount = c.copyPasteViolations ?? 0;
                  const initials = c.name?.charAt(0).toUpperCase() || '?';

                  // Deterministic avatar color from name
                  const avatarColors = ['#1E40AF', '#065F46', '#6B21A8', '#9A3412', '#1E3A5F'];
                  const avatarBg = avatarColors[(c.name?.charCodeAt(0) || 0) % avatarColors.length];

                  return (
                    <tr
                      key={c.userId}
                      style={{ borderBottom: i < list.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', background: '#fff' }}
                      onClick={() => onSelectCandidate ? onSelectCandidate(c.userId) : navigate(`/admin/candidate/${c.userId}`)}
                    >
                      {/* Candidate */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 7, background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, letterSpacing: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ margin: 0, fontWeight: 600, color: '#1D4ED8', fontSize: 13 }}>{c.name || 'N/A'}</p>
                              {copyPasteCount > 0 && (
                                <span title={`${copyPasteCount} copy-paste violation${copyPasteCount !== 1 ? 's' : ''} detected during proctoring`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 7px', background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 20, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  ⚠ {copyPasteCount}
                                </span>
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: 10.5, color: '#CBD5E1', fontFamily: "'JetBrains Mono', 'Fira Code', monospace", letterSpacing: '0.03em' }}>{c.userId?.slice(0, 10)}…</p>
                          </div>
                        </div>
                      </td>

                      {/* Skills */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {c.skills?.slice(0, 3).map((s, idx) => (
                            <span key={idx} style={{ padding: '2px 7px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 4, fontSize: 11, fontWeight: 500, letterSpacing: '0.01em' }}>{s}</span>
                          ))}
                          {(c.skills?.length || 0) > 3 && (
                            <span style={{ padding: '2px 7px', background: '#F8FAFC', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 4, fontSize: 11 }}>+{c.skills!.length - 3} more</span>
                          )}
                          {!c.skills?.length && <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>}
                        </div>
                      </td>

                      {/* Experience */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12.5, color: '#374151', fontWeight: 500 }}>
                          {c.experience > 0 ? `${c.experience} yr${c.experience !== 1 ? 's' : ''}` : 'Fresher'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
                          <button
                            className="act-btn act-btn-reject"
                            onClick={() => { if (window.confirm(`Reject ${c.name}?`)) alert(`${c.name} marked as Rejected.`); }}
                          >
                            Reject
                          </button>
                          <button
                            className="act-btn act-btn-hire"
                            onClick={() => { if (window.confirm(`Hire ${c.name}?`)) alert(`${c.name} marked as Hired.`); }}
                          >
                            Hire
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{ padding: '9px 14px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
              Showing <strong style={{ color: '#374151' }}>{list.length}</strong> of <strong style={{ color: '#374151' }}>{candidates.length}</strong> candidates
            </span>
          </div>
        </div>
      )}
    </div>
  );
};