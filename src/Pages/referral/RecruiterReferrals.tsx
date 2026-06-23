import React, { useEffect, useState, useCallback, useRef } from 'react';

import { referralAPI } from '../../services/recruiterAPI';

const SS: Record<string, { bg: string; color: string }> = {
  pending:        { bg: '#f1f5f9', color: '#475569' },
  screened:       { bg: '#dbeafe', color: '#1d4ed8' },
  approved:       { bg: '#f0fdf4', color: '#15803d' },
  shortlisted:    { bg: '#f0fdf4', color: '#15803d' },
  rejected:       { bg: '#fef2f2', color: '#b91c1c' },
  interview_sent: { bg: '#fff7ed', color: '#c2410c' },
  hired:          { bg: '#f0fdf4', color: '#15803d' },
  applied:        { bg: '#e0f2fe', color: '#0369a1' },
};
const SL: Record<string, string> = {
  pending: 'Pending', screened: 'Screened', approved: 'Approved',
  shortlisted: 'Shortlisted', rejected: 'Rejected',
  interview_sent: 'Interview Sent', hired: 'Hired', applied: 'Applied',
};
const STATUSES = ['pending', 'screened', 'approved', 'shortlisted', 'interview_sent', 'hired', 'rejected'];

type Toast = { id: number; msg: string; type: 'success' | 'error' | 'info' };
let _toastId = 0;

const ToastBar: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
    {toasts.map(t => {
      const c = t.type === 'success' ? '#15803d' : t.type === 'error' ? '#b91c1c' : '#1d4ed8';
      const bg = t.type === 'success' ? '#f0fdf4' : t.type === 'error' ? '#fef2f2' : '#eff6ff';
      const bd = t.type === 'success' ? '#bbf7d0' : t.type === 'error' ? '#fecaca' : '#bfdbfe';
      return (
        <div key={t.id} style={{ background: bg, border: `1px solid ${bd}`, borderLeft: `3px solid ${c}`, borderRadius: 8, padding: '10px 14px', minWidth: 260, maxWidth: 340, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.5, flex: 1 }}>{t.msg}</span>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 15, marginLeft: 8, padding: 0, lineHeight: 1 }}>×</button>
        </div>
      );
    })}
  </div>
);

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 72 }) => {
  const color = score >= 75 ? '#15803d' : score >= 50 ? '#c2410c' : '#b91c1c';
  const r = (size / 2) - 6;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.12, color: '#94a3b8' }}>/ 100</span>
      </div>
    </div>
  );
};

const RecruiterReferrals: React.FC = () => {
  const recruiterUser = JSON.parse(
    localStorage.getItem('recruiter_user') ||
    localStorage.getItem('recruiter') ||
    '{}'
  );
  const recruiterId = recruiterUser?.id ?? recruiterUser?.recruiterId ?? null;

  const [referrals, setReferrals] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('approved');
  const [updating, setUpdating] = useState<number | null>(null);
  const [tab, setTab] = useState<'referrals' | 'stats' | 'analytics'>('referrals');
  const [activeReferral, setActiveReferral] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);
  const [appLoading, setAppLoading] = useState(false);
  const [sendingInterview, setSendingInterview] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [scoreModal, setScoreModal] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState<{ id: string; status: string; notes: string; next_steps: string } | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<{ id: number; currentStatus: string } | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string; email: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const ReferralActionsMenu: React.FC<{ r: any }> = ({ r }) => {
    const isClosed = r.status === 'rejected';
    return (
      <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
        <button onClick={e => { e.stopPropagation(); openReferral(r); }}
          style={{ padding: '4px 9px', fontSize: 11, fontWeight: 600, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 5, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          AI
        </button>
        <button disabled={isClosed} onClick={e => { e.stopPropagation(); setRejectModal({ id: r.id, name: r.candidate_name, email: r.candidate_email }); }}
          style={{ padding: '4px 9px', fontSize: 11, fontWeight: 600, color: isClosed ? '#94a3b8' : '#b91c1c', background: isClosed ? '#f8fafc' : '#fef2f2', border: `1px solid ${isClosed ? '#e2e8f0' : '#fecaca'}`, borderRadius: 5, cursor: isClosed ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: isClosed ? 0.5 : 1 }}>
          Reject
        </button>
        <button disabled={deleteLoading === r.id} onClick={async e => { e.stopPropagation(); await handleDeleteReferral(r.id, e as any); }}
          style={{ padding: '4px 9px', fontSize: 11, fontWeight: 600, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 5, cursor: deleteLoading === r.id ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: deleteLoading === r.id ? 0.5 : 1 }}>
          {deleteLoading === r.id ? '...' : 'Delete'}
        </button>
      </div>
    );
  };

  const toast = useCallback((msg: string, type: Toast['type'] = 'success') => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id: number) => setToasts(p => p.filter(t => t.id !== id)), []);

  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [refs, st, top] = await Promise.all([
        referralAPI.getAll({ recruiterId, status: statusFilter, search, page, limit }),
        referralAPI.getStats(recruiterId),
        referralAPI.getTopReferrers(recruiterId, 5),
      ]);
      setReferrals(refs.referrals || []);
      setTotal(refs.total || 0);
      setStats(st.stats);
      setTopReferrers(top.topReferrers || top.referrers || []);
    } catch { setReferrals([]); }
    finally { setLoading(false); }
  }, [recruiterId, statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const loadAnalytics = useCallback(async () => {
    try { const d = await referralAPI.getAnalytics(); if (d.success) setAnalytics(d.analytics); } catch {}
  }, []);
  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, loadAnalytics]);

  const handleAnalyze = async (file?: File) => {
    if (!activeReferral) return;
    setAnalyzing(true); setAnalyzeResult(null);
    toast('AI analyzing resume...', 'info');
    try {
      const result = await referralAPI.analyzeResume(activeReferral.id, file);
      setAnalyzeResult(result);
      setReferrals(prev => prev.map(r => r.id === activeReferral.id ? { ...r, status: result.status, ai_score: result.aiScore, ai_matched_skills: result.matchedSkills || [], ai_missing_skills: result.missingSkills || [], ai_eligibility: result.eligibility, ai_summary: result.reasoning } : r));
      setActiveReferral((p: any) => p ? { ...p, status: result.status, ai_score: result.aiScore } : p);
      result.status === 'approved'
        ? toast(`Auto Approved — Score: ${result.aiScore}/100${result.emailSent ? ' — Email sent' : ''}`, 'success')
        : toast(`Auto Rejected — Score: ${result.aiScore}/100`, 'error');
      setScoreModal(result);
      load();
    } catch (e: any) { toast(e?.response?.data?.error || 'AI analysis failed', 'error'); }
    finally { setAnalyzing(false); }
  };

  const handleDeleteReferral = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this referral?')) return;
    setDeleteLoading(id);
    try {
      await referralAPI.deleteReferral(id);
      setReferrals(prev => prev.filter(r => r.id !== id));
      if (activeReferral?.id === id) { setActiveReferral(null); setAppData(null); }
      toast('Referral deleted', 'success');
    } catch { toast('Failed to delete', 'error'); }
    finally { setDeleteLoading(null); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm(`Delete ${selected.length} referral(s)?`)) return;
    setBulkDeleteLoading(true);
    try {
      await referralAPI.bulkDeleteReferrals(selected);
      setReferrals(prev => prev.filter(r => !selected.includes(r.id)));
      setSelected([]);
      toast(`${selected.length} referrals deleted`, 'success');
    } catch { toast('Bulk delete failed', 'error'); }
    finally { setBulkDeleteLoading(false); }
  };

  const submitReject = async () => {
    if (!rejectModal) return;
    setRejecting(true);
    try {
      await referralAPI.submitReview(rejectModal.id, { status: 'rejected', review_notes: rejectReason || 'After careful consideration, we will not be moving forward.', next_steps: '', reviewer_name: recruiterUser?.name || 'HR Manager' });
      setReferrals(prev => prev.map(r => r.id === rejectModal.id ? { ...r, status: 'rejected' } : r));
      setActiveReferral((p: any) => p ? { ...p, status: 'rejected' } : p);
      setRejectModal(null); setRejectReason('');
      toast(`Rejected — email sent to ${rejectModal.email}`, 'error');
      load();
    } catch { toast('Rejection failed', 'error'); }
    finally { setRejecting(false); }
  };

  const submitReview = async () => {
    if (!reviewForm) return;
    try {
      await referralAPI.submitReview(reviewForm.id, { status: reviewForm.status, review_notes: reviewForm.notes, next_steps: reviewForm.next_steps, reviewer_name: 'HR Manager' });
      setReferrals(prev => prev.map(r => r.id === reviewForm.id ? { ...r, status: reviewForm.status } : r));
      setActiveReferral((p: any) => p ? { ...p, status: reviewForm.status } : p);
      setReviewForm(null);
      toast('Review submitted', 'success');
    } catch { toast('Review submission failed', 'error'); }
  };

  const openReferral = async (r: any) => {
    if (activeReferral?.id === r.id) { setActiveReferral(null); setAppData(null); setAnalyzeResult(null); return; }
    setActiveReferral(r); setAppData(null); setAnalyzeResult(null); setAppLoading(true);
    try {
      const res = await referralAPI.getApplicationsByJob(r.job_id);
      const apps: any[] = res?.applications ?? [];
      setAppData(apps.find((a: any) => a.referral_id === r.id || a.email === r.candidate_email) || null);
    } catch { setAppData(null); }
    finally { setAppLoading(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await referralAPI.updateStatus(id, recruiterId, status);
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setActiveReferral((p: any) => p ? { ...p, status } : p);
      const lbl: Record<string, string> = { approved: 'Approved', rejected: 'Rejected', hired: 'Marked as Hired', pending: 'Set to Pending' };
      toast(lbl[status] || `Updated to ${status}`, status === 'approved' || status === 'hired' ? 'success' : status === 'rejected' ? 'error' : 'info');
      if (status === 'approved' && appData?.id) {
        setSendingInterview(true);
        try { await referralAPI.sendAssessment(appData.id); toast('Interview link sent', 'success'); }
        catch { toast('Could not send interview link', 'error'); }
        finally { setSendingInterview(false); }
      }
    } catch (e: any) { toast(e?.response?.data?.error || 'Update failed', 'error'); }
    finally { setUpdating(null); }
  };

  const bulkUpdate = async () => {
    if (!selected.length) return;
    try {
      await referralAPI.bulkUpdateStatus(recruiterId, selected, bulkStatus);
      setReferrals(prev => prev.map(r => selected.includes(r.id) ? { ...r, status: bulkStatus } : r));
      toast(`${selected.length} referrals updated to "${bulkStatus}"`, 'success');
      setSelected([]);
    } catch (e: any) { toast(e?.response?.data?.error || 'Bulk update failed', 'error'); }
  };

  const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === referrals.length ? [] : referrals.map(r => r.id));

  const statCards = [
    { label: 'Total',     value: stats?.total            ?? 0, color: '#ea580c' },
    { label: 'Pending',   value: stats?.pending          ?? 0, color: '#c2410c' },
    { label: 'Approved',  value: stats?.approved         ?? 0, color: '#15803d' },
    { label: 'Hired',     value: stats?.hired            ?? 0, color: '#15803d' },
    { label: 'Rejected',  value: stats?.rejected         ?? 0, color: '#b91c1c' },
    { label: 'Referrers', value: stats?.unique_referrers ?? 0, color: '#0369a1' },
    ...(stats?.avg_score != null ? [{ label: 'Avg AI Score', value: `${parseFloat(stats.avg_score).toFixed(0)}/100`, color: parseFloat(stats.avg_score) >= 60 ? '#15803d' : '#b91c1c' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes rr-up   { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }
        @keyframes rr-right{ from { opacity:0; transform:translateX(18px); } to { opacity:1; transform:none; } }
        @keyframes rr-scale{ from { opacity:0; transform:scale(.95) translateY(8px); } to { opacity:1; transform:none; } }
        .rr-card  { transition: border-color .15s, transform .15s; }
        .rr-card:hover  { transform: translateY(-1px); border-color: #cbd5e1 !important; }
        .rr-row   { transition: background .1s; }
        .rr-row:hover td { background: #f8fafc !important; }
        .rr-btn   { transition: opacity .12s, transform .12s; }
        .rr-btn:hover { opacity: .85; transform: translateY(-1px); }
        .rr-tab   { transition: color .12s, border-color .12s; }
        .rr-desktop { display: block; }
        .rr-mobile  { display: none; }
        @media (max-width: 768px) {
          .rr-desktop { display: none !important; }
          .rr-mobile  { display: flex !important; }
          .rr-main    { flex-direction: column !important; padding: 12px 14px !important; }
          .rr-stats-grid { grid-template-columns: repeat(3,1fr) !important; }
          .rr-panel   { width: 100% !important; position: static !important; }
          .rr-header  { padding: 12px 16px !important; }
        }
      `}</style>
      <ToastBar toasts={toasts} remove={removeToast} />

      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 28px', animation: 'rr-up .2s ease' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Referral Management</h1>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: '3px 0 0' }}>Review AI scores, approve candidates and send interview links</p>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px', display: 'flex', gap: 24, alignItems: 'flex-start' }} className="rr-main">

        {/* LEFT */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Stat Cards */}
          <div className="rr-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
            {statCards.map((s, i) => (
              <div key={s.label} className="rr-card" style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 16px', animation: 'rr-up .2s ease both', animationDelay: `${i * 0.06}s` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            {(['referrals', 'stats', 'analytics'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className="rr-tab" style={{
                padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13.5, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? '#ea580c' : '#94a3b8',
                borderBottom: tab === t ? '2px solid #ea580c' : '2px solid transparent', marginBottom: -1,
              }}>
                {t === 'referrals' ? 'All Referrals' : t === 'stats' ? 'Top Referrers' : 'Analytics'}
              </button>
            ))}
          </div>

          {/* Analytics Tab */}
          {tab === 'analytics' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {!analytics ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Loading analytics...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
                    {[
                      { label: 'Total Referrals', value: analytics?.overview?.total_referrals ?? '—', color: '#ea580c' },
                      { label: 'Approval Rate',   value: analytics?.overview?.approval_rate != null ? `${analytics.overview.approval_rate}%` : '—', color: '#15803d' },
                      { label: 'Hire Rate',        value: analytics?.overview?.hire_rate != null ? `${analytics.overview.hire_rate}%` : '—', color: '#0369a1' },
                      { label: 'Avg Review Time',  value: analytics?.overview?.average_review_time ?? '—', color: '#c2410c' },
                      { label: 'Bonus Paid',       value: analytics?.overview?.total_bonus_paid ?? '—', color: '#b91c1c' },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '16px' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 600, fontSize: 14, color: '#0f172a' }}>Top Performers</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f8fafc' }}>
                        {['Employee', 'Referrals', 'Hires', 'Bonus Earned'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {(analytics?.top_performers?.length ?? 0) === 0
                          ? <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No data yet</td></tr>
                          : (analytics?.top_performers ?? []).map((p: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '11px 16px', fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{p.employee_name}</td>
                              <td style={{ padding: '11px 16px', color: '#0f172a', fontWeight: 700 }}>{p.referrals}</td>
                              <td style={{ padding: '11px 16px', color: '#15803d', fontWeight: 700 }}>{p.hires}</td>
                              <td style={{ padding: '11px 16px', color: '#c2410c', fontWeight: 600 }}>{p.bonus_earned}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {Object.entries(analytics?.department_breakdown ?? {}).map(([dept, count]: any) => (
                      <div key={dept} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{dept}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          ) : tab === 'stats' ? (
            /* Top Referrers Tab */
            <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['#', 'Employee', 'Dept', 'Total', 'Hired'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topReferrers.length === 0
                    ? <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: '0 0 4px' }}>No referrers yet</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Employees who refer candidates will appear here</p>
                    </td></tr>
                    : topReferrers.map((r: any, i: number) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{r.name}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{r.department || '—'}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ea580c' }}>{r.referral_count || r.total_referrals}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#15803d' }}>{r.hired_count || 0}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>

          ) : (
            /* Referrals Tab */
            <>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <input type="text" placeholder="Search candidate..." value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  style={{ flex: 1, minWidth: 180, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', color: '#0f172a' }} />
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                  style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: 'white', outline: 'none', color: '#0f172a' }}>
                  <option value="">All Status</option>
                  {STATUSES.map(s => <option key={s} value={s}>{SL[s] || s}</option>)}
                </select>
                <button onClick={load} style={{ padding: '9px 14px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>Refresh</button>
              </div>

              {/* Bulk Actions */}
              {selected.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eef2ff', border: '1px solid #e0e7ff', borderRadius: 8, padding: '8px 14px', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#ea580c', fontWeight: 600 }}>{selected.length} selected</span>
                  <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}
                    style={{ padding: '5px 8px', border: '1px solid #e0e7ff', borderRadius: 6, fontSize: 12, background: 'white', outline: 'none' }}>
                    {STATUSES.map(s => <option key={s} value={s}>{SL[s] || s}</option>)}
                  </select>
                  <button onClick={bulkUpdate}
                    style={{ padding: '5px 12px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Update</button>
                  <button onClick={handleBulkDelete} disabled={bulkDeleteLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: bulkDeleteLoading ? 0.5 : 1 }}>
                    {bulkDeleteLoading ? 'Deleting...' : `Delete ${selected.length}`}
                  </button>
                  <button onClick={() => setSelected([])}
                    style={{ padding: '5px 8px', background: 'none', border: 'none', fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>Clear</button>
                </div>
              )}

              {/* Table */}
              <div style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ width: 28, height: 28, border: '3px solid #e2e8f0', borderTop: '3px solid #ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                    Loading referrals...
                  </div>
                ) : referrals.length === 0 ? (
                  <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>No referrals yet</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                      {statusFilter || search
                        ? 'No referrals match your filters.'
                        : 'Referrals submitted by employees will appear here.'}
                    </p>
                    {(statusFilter || search) && (
                      <button onClick={() => { setStatusFilter(''); setSearch(''); }}
                        style={{ marginTop: 14, padding: '8px 18px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                  {/* Desktop Table */}
                  <div className="rr-desktop">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 16px', width: 36 }}>
                          <input type="checkbox" checked={selected.length === referrals.length} onChange={toggleAll} />
                        </th>
                        {['Candidate', 'Referred By', 'Job', 'AI Score', 'Status', 'Date', 'Action'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r: any, ri: number) => {
                        const st = SS[r.status] || SS.pending;
                        const isActive = activeReferral?.id === r.id;
                        const hasScore = r.ai_score != null;
                        const sc = hasScore ? (r.ai_score >= 60 ? '#15803d' : '#b91c1c') : '#94a3b8';
                        return (
                          <tr key={r.id} className="rr-row"
                            style={{ borderBottom: '1px solid #f1f5f9', background: isActive ? '#eef2ff' : selected.includes(r.id) ? '#f5f3ff' : 'white', cursor: 'pointer', animation: 'rr-up .15s ease both', animationDelay: `${Math.min(ri * 0.03, 0.3)}s` }}
                            onClick={() => openReferral(r)}
                          >
                            <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{r.candidate_name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.candidate_email}</div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{r.referred_by || r.referrer_name || '—'}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{r.job_title || `Job #${r.job_id}`}</td>
                            <td style={{ padding: '12px 16px' }} onClick={e => { e.stopPropagation(); if (hasScore) setScoreModal({ aiScore: r.ai_score, status: r.status, threshold: 60, matchedSkills: r.ai_matched_skills, missingSkills: r.ai_missing_skills, eligibility: r.ai_eligibility, reasoning: r.ai_summary }); }}>
                              {hasScore ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: r.ai_score >= 60 ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${sc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: sc }}>
                                    {r.ai_score}
                                  </div>
                                  <span style={{ fontSize: 11, color: sc, fontWeight: 600 }}>{r.ai_score >= 60 ? 'Pass' : 'Fail'}</span>
                                </div>
                              ) : <span style={{ fontSize: 11, color: '#e2e8f0' }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color, width: 'fit-content' }}>
                                  {SL[r.status] || r.status}
                                </span>
                                {(r.status === 'interview_sent' || r.status === 'approved') && (
                                  <span style={{ fontSize: 10, color: '#ea580c', fontWeight: 500 }}>Email sent</span>
                                )}
                                {r.status === 'rejected' && (
                                  <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 500 }}>Rejected</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: 11, color: '#94a3b8' }}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                              <ReferralActionsMenu r={r} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="rr-mobile" style={{ flexDirection: 'column', gap: 10, padding: 12 }}>
                    {referrals.map((r: any) => {
                      const st = SS[r.status] || SS.pending;
                      const hasScore = r.ai_score != null;
                      const sc = hasScore ? (r.ai_score >= 60 ? '#15803d' : '#b91c1c') : '#94a3b8';
                      return (
                        <div key={r.id} onClick={() => openReferral(r)}
                          style={{ background: selected.includes(r.id) ? '#f5f3ff' : 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, cursor: 'pointer' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                            <input type="checkbox" checked={selected.includes(r.id)}
                              onChange={e => { e.stopPropagation(); toggleSelect(r.id); }}
                              onClick={e => e.stopPropagation()} style={{ marginTop: 3 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{r.candidate_name}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.candidate_email}</div>
                              <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{r.job_title || `Job #${r.job_id}`} · {r.referred_by || '—'}</div>
                            </div>
                            {hasScore && (
                              <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.ai_score >= 60 ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${sc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: sc, flexShrink: 0 }}>
                                {r.ai_score}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                                {SL[r.status] || r.status}
                              </span>
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</span>
                            </div>
                            <div onClick={e => e.stopPropagation()}>
                              <ReferralActionsMenu r={r} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  </>
                )}
              </div>

              {/* Pagination */}
              {total > limit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                      style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'white', color: page === 1 ? '#94a3b8' : '#0f172a' }}>Prev</button>
                    <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
                      style={{ padding: '5px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, cursor: page * limit >= total ? 'not-allowed' : 'pointer', background: 'white', color: page * limit >= total ? '#94a3b8' : '#0f172a' }}>Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RIGHT — AI Panel */}
        {activeReferral && (
          <div className="rr-panel" style={{ width: 360, flexShrink: 0, background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: 24, animation: 'rr-right .2s ease' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{activeReferral.candidate_name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{activeReferral.candidate_email}</div>
              </div>
              <button onClick={() => { setActiveReferral(null); setAppData(null); setAnalyzeResult(null); }}
                style={{ background: '#f1f5f9', border: 'none', color: '#94a3b8', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ padding: 18, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>

              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Current Status</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: (SS[activeReferral.status] || SS.pending).bg, color: (SS[activeReferral.status] || SS.pending).color }}>
                  {SL[activeReferral.status] || activeReferral.status}
                </span>
              </div>

              {/* Action Buttons — context-aware based on status */}
              {activeReferral.status === 'rejected' ? (
                // Rejected — show Send Assessment Link only
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#b91c1c', fontWeight: 600 }}>
                    Candidate Rejected
                  </div>
                  <button
                    disabled={updating === activeReferral.id}
                    onClick={async () => {
                      if (!appData?.id) { toast('No linked application found to send assessment', 'error'); return; }
                      setUpdating(activeReferral.id);
                      try {
                        await referralAPI.sendAssessment(appData.id);
                        toast('Assessment link sent to candidate', 'success');
                      } catch { toast('Failed to send assessment link', 'error'); }
                      finally { setUpdating(null); }
                    }}
                    style={{ width: '100%', padding: '9px', background: updating === activeReferral.id ? '#f1f5f9' : '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: updating === activeReferral.id ? 'not-allowed' : 'pointer', opacity: updating === activeReferral.id ? 0.6 : 1 }}>
                    {updating === activeReferral.id ? 'Sending...' : 'Send Assessment Link'}
                  </button>
                </div>
              ) : activeReferral.status === 'hired' ? (
                // Hired — show hired badge only
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', marginBottom: 10, fontSize: 13, color: '#15803d', fontWeight: 700 }}>
                  Candidate Hired
                </div>
              ) : (
                // All other statuses — Approve / Reject / Hired / Send Assessment
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={updating === activeReferral.id || activeReferral.status === 'approved'}
                      onClick={() => updateStatus(activeReferral.id, 'approved')}
                      style={{ flex: 1, padding: '9px', background: activeReferral.status === 'approved' ? '#f0fdf4' : '#15803d', color: activeReferral.status === 'approved' ? '#15803d' : 'white', border: activeReferral.status === 'approved' ? '1px solid #bbf7d0' : 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: activeReferral.status === 'approved' ? 'default' : 'pointer', opacity: updating === activeReferral.id ? 0.5 : 1 }}>
                      {updating === activeReferral.id ? '...' : activeReferral.status === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: activeReferral.id, name: activeReferral.candidate_name, email: activeReferral.candidate_email })}
                      style={{ flex: 1, padding: '9px', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Reject
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      disabled={updating === activeReferral.id}
                      onClick={() => updateStatus(activeReferral.id, 'hired')}
                      style={{ flex: 1, padding: '9px', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: updating === activeReferral.id ? 0.5 : 1 }}>
                      Mark Hired
                    </button>
                    <button
                      disabled={updating === activeReferral.id}
                      onClick={async () => {
                        if (!appData?.id) { toast('No linked application found to send assessment', 'error'); return; }
                        setUpdating(activeReferral.id);
                        try {
                          await referralAPI.sendAssessment(appData.id);
                          toast('Assessment link sent to candidate', 'success');
                        } catch { toast('Failed to send assessment link', 'error'); }
                        finally { setUpdating(null); }
                      }}
                      style={{ flex: 1, padding: '9px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: updating === activeReferral.id ? 0.5 : 1 }}>
                      Send Link
                    </button>
                  </div>
                </div>
              )}

              {/* AI Analyze */}
              <div style={{ marginBottom: 14 }}>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) handleAnalyze(e.target.files[0]); }} />
                <button disabled={analyzing} onClick={() => appData ? handleAnalyze(undefined) : fileInputRef.current?.click()}
                  style={{ width: '100%', padding: '9px 14px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: analyzing ? 'not-allowed' : 'pointer', opacity: analyzing ? 0.7 : 1 }}>
                  {analyzing ? 'Analyzing...' : 'AI Analyze Resume'}
                </button>
              </div>

              {/* Email indicators */}
              {(activeReferral.status === 'approved' || activeReferral.status === 'interview_sent') && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#15803d', fontWeight: 500 }}>
                  Interview email sent to candidate
                </div>
              )}
              {activeReferral.status === 'rejected' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 12, color: '#b91c1c', fontWeight: 500 }}>
                  Rejection email sent to candidate
                </div>
              )}

              {/* App Data Panel */}
              {/* View CV fallback — show even when appData is null but referral has resume_url */}
              {!appLoading && !appData && activeReferral.resume_url && (
                <a href={activeReferral.resume_url} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', color: '#475569', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  View CV
                </a>
              )}
              {appLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>Loading AI evaluation...</div>
              ) : !appData ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 13, color: '#475569' }}>No resume uploaded yet</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Use AI Analyze Resume above</div>
                </div>
              ) : (
                <>
                  {(() => {
                    const ds = analyzeResult ? analyzeResult.aiScore : Number(appData.match_score) || 0;
                    const dst = analyzeResult ? analyzeResult.status : (ds >= 60 ? 'approved' : 'rejected');
                    const dm = analyzeResult ? analyzeResult.matchedSkills : appData.matched_skills;
                    const dmi = analyzeResult ? analyzeResult.missingSkills : appData.missing_skills;
                    const de = analyzeResult ? analyzeResult.eligibility : appData.eligibility_status;
                    const dr = analyzeResult ? analyzeResult.reasoning : appData.parsed_resume?.summary;
                    return (
                      <div style={{ background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 14, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                        onClick={() => setScoreModal({ aiScore: ds, status: dst, threshold: 60, matchedSkills: dm, missingSkills: dmi, reasoning: dr, eligibility: de })}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Match Score — click for details</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <ScoreRing score={ds} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{ds >= 75 ? 'Strong Match' : ds >= 50 ? 'Moderate Match' : 'Weak Match'}</div>
                            <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}>{de ? de.charAt(0).toUpperCase() + de.slice(1) : '—'} candidate</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{appData.experience_years} yr exp · {appData.location || '—'}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {(analyzeResult?.matchedSkills || appData.matched_skills)?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(analyzeResult?.matchedSkills || appData.matched_skills).map((sk: string) => (
                          <span key={sk} style={{ padding: '3px 9px', background: '#f0fdf4', color: '#15803d', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analyzeResult?.missingSkills || appData.missing_skills)?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing Skills</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {(analyzeResult?.missingSkills || appData.missing_skills).map((sk: string) => (
                          <span key={sk} style={{ padding: '3px 9px', background: '#fef2f2', color: '#b91c1c', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(analyzeResult?.reasoning || appData.parsed_resume?.summary) && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6, background: '#f8fafc', borderRadius: 8, padding: '10px 12px', border: '1px solid #e2e8f0' }}>{analyzeResult?.reasoning || appData.parsed_resume?.summary}</div>
                    </div>
                  )}
                  {appData.resume_url && (
                    <a href={appData.resume_url} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, textDecoration: 'none', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                      View Full Resume
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {statusUpdateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 24, animation: 'rr-up .15s ease' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 380, padding: 24, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Update Status</h3>
              <button onClick={() => setStatusUpdateModal(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', marginBottom: 16, color: '#0f172a' }}>
              {STATUSES.map(s => <option key={s} value={s}>{SL[s] || s}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStatusUpdateModal(null)}
                style={{ flex: 1, padding: '9px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button disabled={statusUpdating} onClick={async () => {
                setStatusUpdating(true);
                await updateStatus(statusUpdateModal.id, newStatus);
                setStatusUpdating(false);
                setStatusUpdateModal(null);
              }} style={{ flex: 1, padding: '9px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: statusUpdating ? 0.6 : 1 }}>
                {statusUpdating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Modal */}
      {scoreModal && (
        <div onClick={() => setScoreModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 24, animation: 'rr-up .15s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28, border: '1px solid #e2e8f0', animation: 'rr-scale .2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>AI Analysis Result</h3>
              <button onClick={() => setScoreModal(null)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: 20, background: scoreModal.status === 'approved' ? '#f0fdf4' : '#fef2f2', borderRadius: 10, border: `1px solid ${scoreModal.status === 'approved' ? '#bbf7d0' : '#fecaca'}` }}>
              <ScoreRing score={Number(scoreModal.aiScore) || 0} size={96} />
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: scoreModal.status === 'approved' ? '#15803d' : '#b91c1c' }}>
                  {scoreModal.status === 'approved' ? 'Auto Approved' : 'Auto Rejected'}
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Threshold: <strong>{scoreModal.threshold || 60}+</strong> to approve</div>
                {scoreModal.eligibility && <div style={{ fontSize: 12, color: '#0f172a', marginTop: 4, textTransform: 'capitalize' }}>Eligibility: <strong>{scoreModal.eligibility}</strong></div>}
              </div>
            </div>
            {scoreModal.matchedSkills?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#15803d', marginBottom: 6 }}>Matched Skills ({scoreModal.matchedSkills.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {scoreModal.matchedSkills.map((sk: string) => <span key={sk} style={{ padding: '3px 10px', background: '#f0fdf4', color: '#15803d', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{sk}</span>)}
                </div>
              </div>
            )}
            {scoreModal.missingSkills?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>Missing Skills ({scoreModal.missingSkills.length})</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {scoreModal.missingSkills.map((sk: string) => <span key={sk} style={{ padding: '3px 10px', background: '#fef2f2', color: '#b91c1c', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{sk}</span>)}
                </div>
              </div>
            )}
            {scoreModal.reasoning && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#475569', lineHeight: 1.6, border: '1px solid #e2e8f0' }}>{scoreModal.reasoning}</div>
            )}
            <button onClick={() => setScoreModal(null)}
              style={{ marginTop: 18, width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 24, animation: 'rr-up .15s ease' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 440, padding: 28, border: '1px solid #e2e8f0', animation: 'rr-scale .2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reject Referral</h3>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 18 }}>
              Rejecting <strong>{rejectModal.name}</strong> — a rejection email will be sent to <strong>{rejectModal.email}</strong>.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>Rejection Reason <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                placeholder="e.g. Skills do not match the job requirements..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, color: '#0f172a' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                style={{ flex: 1, padding: '10px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={submitReject} disabled={rejecting}
                style={{ flex: 1, padding: '10px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: rejecting ? 'not-allowed' : 'pointer', opacity: rejecting ? 0.7 : 1 }}>
                {rejecting ? 'Sending...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24, animation: 'rr-up .15s ease' }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28, border: '1px solid #e2e8f0', animation: 'rr-scale .2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Review Referral</h3>
              <button onClick={() => setReviewForm(null)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Status</label>
                <select value={reviewForm.status} onChange={e => setReviewForm(f => f ? { ...f, status: e.target.value } : f)}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, background: 'white', outline: 'none', color: '#0f172a' }}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Review Notes</label>
                <textarea value={reviewForm.notes} rows={3} onChange={e => setReviewForm(f => f ? { ...f, notes: e.target.value } : f)}
                  placeholder="Feedback about the candidate..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 5 }}>Next Steps</label>
                <input value={reviewForm.next_steps} onChange={e => setReviewForm(f => f ? { ...f, next_steps: e.target.value } : f)}
                  placeholder="e.g. Schedule technical interview..."
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const, color: '#0f172a' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setReviewForm(null)}
                  style={{ flex: 1, padding: '10px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                <button onClick={submitReview}
                  style={{ flex: 1, padding: '10px', background: '#ea580c', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Submit Review</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterReferrals;
