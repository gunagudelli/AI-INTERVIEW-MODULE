import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ShieldCheck, LogOut, CheckCircle2, XCircle } from 'lucide-react';
import { AdminAttempts } from './AdminAttempts';
import { CandidatesList } from './CandidatesList';
import { CandidateDetail } from './CandidateDetail';
import { AdminAnalytics } from './AdminAnalytics';
import { InterviewConfig } from './InterviewConfig';
import { SuperResumePool } from './SuperResumePool';
import { BulkResumePool } from './BulkResumePool';
import AdminPanelMembers from '../../Pages/admin/AdminPanelMembers';
import PanelAssignmentsMonitor from '../../Pages/admin/PanelAssignmentsMonitor';
import PanelEvaluationsAnalytics from '../../Pages/admin/PanelEvaluationsAnalytics';
import HiringMonitor from '../../Pages/admin/HiringMonitor';
import { adminJdApprovalAPI } from '../../services/recruiterAPI';
import { COLORS, RADIUS, SHADOW, badge, buttonPrimary, buttonSecondary, buttonDanger, modalOverlay, modalPanel, card, tableHeaderRow, tableHeaderCell, tableCell } from './adminTheme';

type Tab = 'candidates' | 'attempts' | 'analytics' | 'round-settings' | 'super-resume-pool' | 'bulk-resume-pool' | 'panel-members' | 'panel-assignments' | 'panel-evaluations' | 'hiring-monitor' | 'jd-approvals';

type NavLeaf = { key: Tab; label: string; icon: React.ReactNode };
type NavGroup = { group: string; icon: React.ReactNode; items: NavLeaf[] };
type NavEntry = NavLeaf | NavGroup;

const CHEVRON = (
  <svg width={13} height={13} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 9l-7 7-7-7" />
  </svg>
);

const NAV_LEAVES: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'candidates',
    label: 'Candidates',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'round-settings',
    label: 'Round Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },

  {
    key: 'analytics',
    label: 'Analytics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'hiring-monitor',
    label: 'Hiring Monitor',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l7-3 7 3z" />
      </svg>
    ),
  },
  {
    key: 'jd-approvals',
    label: 'JD Approvals',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m-9 9h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'super-resume-pool',
    label: 'Super Resume Pool',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: 'bulk-resume-pool',
    label: 'AI Bulk Pool',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'panel-members',
    label: 'Panel Members',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    key: 'panel-assignments',
    label: 'Panel Assignments',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'panel-evaluations',
    label: 'Panel Evaluations',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.52-4.674z" />
      </svg>
    ),
  },
];

const leaf = (key: Tab) => NAV_LEAVES.find(l => l.key === key)!;

// Related items grouped under a collapsible header instead of a long flat list —
// Resume Pool (2 items) and Panel (3 items).
const NAV: NavEntry[] = [
  leaf('candidates'),
  leaf('round-settings'),
  leaf('analytics'),
  leaf('hiring-monitor'),
  leaf('jd-approvals'),
  {
    group: 'Resume Pool',
    icon: leaf('super-resume-pool').icon,
    items: [leaf('super-resume-pool'), leaf('bulk-resume-pool')],
  },
  {
    group: 'Panel',
    icon: leaf('panel-members').icon,
    items: [leaf('panel-members'), leaf('panel-assignments'), leaf('panel-evaluations')],
  },
];

const GROUP_TABS: Record<string, Tab[]> = {
  'Resume Pool': ['super-resume-pool', 'bulk-resume-pool'],
  'Panel': ['panel-members', 'panel-assignments', 'panel-evaluations'],
};

interface JdApprovalRequest {
  id: number;
  recruiter_id: number;
  recruiter_name: string | null;
  recruiter_email: string | null;
  job_title: string;
  department: string | null;
  vacancies: number;
  experience_min: number | null;
  skills: string[];
  employment_type: string | null;
  work_mode: string | null;
  location: string | null;
  salary: string | null;
  hiring_reason: string | null;
  hiring_manager: string | null;
  expected_joining_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  requested_at: string;
}

const EMPLOYMENT_TYPE_LABEL: Record<string, string> = { 'full-time': 'Full Time', 'part-time': 'Part Time', contract: 'Contract', internship: 'Internship' };
const WORK_MODE_LABEL: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

// ── Notification dropdown: basic info per pending request ──────────────────
const JdApprovalDropdown: React.FC<{
  requests: JdApprovalRequest[];
  onClose: () => void;
  onSelect: (r: JdApprovalRequest) => void;
}> = ({ requests, onClose, onSelect }) => createPortal(
  <>
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
    <div style={{ position: 'fixed', top: 60, right: 16, width: 340, maxHeight: 440, overflowY: 'auto', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.lg, zIndex: 91 }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.borderSoft}`, fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
        JD Approval Requests
      </div>
      {requests.length === 0 ? (
        <div style={{ padding: '24px 14px', fontSize: 12, color: COLORS.textMuted, textAlign: 'center' }}>No pending requests</div>
      ) : requests.map(r => (
        <div key={r.id} onClick={() => onSelect(r)} style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.borderSoft}`, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: COLORS.textPrimary }}>{r.job_title}</span>
            <span style={badge('warning')}>Pending</span>
          </div>
          <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 3 }}>
            {r.recruiter_name || 'Recruiter'} · {r.department || 'No dept'} · {r.vacancies} position{r.vacancies !== 1 ? 's' : ''} · {new Date(r.requested_at).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  </>,
  document.body
);

// ── Full detail modal with Approve / Reject actions ─────────────────────────
const JdApprovalDetailModal: React.FC<{
  request: JdApprovalRequest;
  onClose: () => void;
  onDecided: () => void;
}> = ({ request, onClose, onDecided }) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const approve = async () => {
    setSaving(true);
    try { await adminJdApprovalAPI.approve(request.id); onDecided(); onClose(); }
    catch { /* surfaced via badge/list not refreshing — acceptable for this internal tool */ }
    finally { setSaving(false); }
  };

  const reject = async () => {
    setSaving(true);
    try { await adminJdApprovalAPI.reject(request.id, reason.trim() || undefined); onDecided(); onClose(); }
    catch { /* best-effort */ }
    finally { setSaving(false); }
  };

  const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div style={{ fontSize: 13.5, color: COLORS.textSecondary }}>
      {label} : <strong style={{ color: COLORS.textPrimary, fontWeight: 700 }}>{value}</strong>
    </div>
  );

  return createPortal(
    <div style={modalOverlay} onClick={onClose}>
      <div style={{ ...modalPanel(600), padding: 0, overflow: 'hidden', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '14px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, margin: 0, letterSpacing: '-0.1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.job_title}</h2>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Requested {new Date(request.requested_at).toLocaleString()}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textMuted, flexShrink: 0, padding: 2 }}><X size={18} /></button>
        </div>

        <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '65vh', overflowY: 'auto' }}>

          {/* Recruiter */}
          <div style={{ fontSize: 13.5, color: COLORS.textSecondary, paddingBottom: 16, borderBottom: `1px solid ${COLORS.borderSoft}` }}>
            <strong style={{ color: COLORS.textPrimary }}>{request.recruiter_name || 'Recruiter'}</strong>
            {' · '}{request.recruiter_email || 'no email'}
            {request.department ? ` · ${request.department}` : ''}
          </div>

          {/* Details grid — plain text, no boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 16, columnGap: 16 }}>
            <Field label="Positions" value={request.vacancies} />
            <Field label="Experience" value={`${request.experience_min ?? 0}+ yrs`} />
            <Field label="Employment Type" value={EMPLOYMENT_TYPE_LABEL[request.employment_type || ''] || request.employment_type || '—'} />
            <Field label="Work Mode" value={WORK_MODE_LABEL[request.work_mode || ''] || request.work_mode || '—'} />
            <Field label="Location" value={request.location || '—'} />
            <Field label="Salary" value={request.salary || '—'} />
            <Field label="Hiring Manager" value={request.hiring_manager || '—'} />
            <Field label="Expected Joining" value={request.expected_joining_date ? new Date(request.expected_joining_date).toLocaleDateString() : '—'} />
          </div>

          {/* Skills */}
          {request.skills?.length > 0 && (
            <div style={{ paddingTop: 4, borderTop: `1px solid ${COLORS.borderSoft}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, marginTop: 16 }}>Required Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
                {request.skills.map(sk => (
                  <span key={sk} style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.textPrimary }}>{sk}</span>
                ))}
              </div>
            </div>
          )}

          {/* Hiring reason */}
          {request.hiring_reason && (
            <div style={{ paddingTop: 16, borderTop: `1px solid ${COLORS.borderSoft}` }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Hiring Reason</div>
              <div style={{ color: COLORS.textPrimary, lineHeight: 1.6, fontSize: 13.5, fontStyle: 'italic' }}>
                "{request.hiring_reason}"
              </div>
            </div>
          )}

          {/* Decision / actions */}
          {request.status !== 'pending' ? (
            <div style={{ padding: '12px 14px', borderRadius: RADIUS.md, background: request.status === 'approved' ? COLORS.successTint : COLORS.dangerTint, border: `1px solid ${request.status === 'approved' ? COLORS.successBorder : COLORS.dangerBorder}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {request.status === 'approved'
                ? <CheckCircle2 size={18} style={{ color: COLORS.successDark, flexShrink: 0, marginTop: 1 }} />
                : <XCircle size={18} style={{ color: COLORS.dangerDark, flexShrink: 0, marginTop: 1 }} />}
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: request.status === 'approved' ? COLORS.successDark : COLORS.dangerDark }}>
                  {request.status === 'approved' ? 'Approved' : 'Rejected'}
                </div>
                {request.status === 'rejected' && request.rejection_reason && (
                  <div style={{ marginTop: 4, fontSize: 13, color: COLORS.textPrimary }}>Reason: {request.rejection_reason}</div>
                )}
              </div>
            </div>
          ) : rejecting && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: COLORS.textSecondary, marginBottom: 6 }}>Rejection reason (optional)</label>
              <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Let the recruiter know why…" style={{ width: '100%', minHeight: 70, padding: '9px 12px', border: `1.5px solid ${COLORS.border}`, borderRadius: RADIUS.sm, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
          )}
        </div>

        {request.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: `1px solid ${COLORS.border}`, background: COLORS.pageBg }}>
            {!rejecting ? (
              <>
                <button onClick={approve} disabled={saving} style={{ ...buttonPrimary, background: COLORS.success, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  <CheckCircle2 size={15} /> {saving ? 'Approving…' : 'Approve'}
                </button>
                <button onClick={() => setRejecting(true)} disabled={saving} style={{ ...buttonDanger, flex: 1 }}>
                  <XCircle size={15} /> Reject
                </button>
              </>
            ) : (
              <>
                <button onClick={reject} disabled={saving} style={{ ...buttonDanger, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Rejecting…' : 'Confirm Reject'}
                </button>
                <button onClick={() => setRejecting(false)} disabled={saving} style={{ ...buttonSecondary, flex: 1 }}>Back</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

// ── Persistent audit view: every JD approval request and its decision ──────
// The bell only ever shows pending requests — once decided, a request has no
// other home in the admin panel without this tab.
type JdFilter = 'all' | 'pending' | 'approved' | 'rejected';

const JdApprovalHistoryTab: React.FC = () => {
  const [filter, setFilter]     = useState<JdFilter>('all');
  const [requests, setRequests] = useState<JdApprovalRequest[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<JdApprovalRequest | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try { setRequests(await adminJdApprovalAPI.listAll(filter)); }
    catch { setRequests([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const FILTERS: { value: JdFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: '0 0 4px' }}>JD Approval Requests</h1>
      <p style={{ fontSize: 12.5, color: COLORS.textMuted, margin: '0 0 18px' }}>Every request submitted by recruiters and its decision — the audit trail for JD creation.</p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px', borderRadius: RADIUS.pill, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${filter === f.value ? COLORS.brand : COLORS.border}`,
              background: filter === f.value ? COLORS.brandTint : COLORS.surface,
              color: filter === f.value ? COLORS.brand : COLORS.textSecondary,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {selected && (
        <JdApprovalDetailModal request={selected} onClose={() => setSelected(null)} onDecided={load} />
      )}

      <div style={{ ...card, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>No requests found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={tableHeaderRow}>
                <th style={tableHeaderCell}>Recruiter</th>
                <th style={tableHeaderCell}>Job Title</th>
                <th style={tableHeaderCell}>Department</th>
                <th style={tableHeaderCell}>Positions</th>
                <th style={tableHeaderCell}>Requested</th>
                <th style={tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)} className="adm-row-hover" style={{ borderBottom: `1px solid ${COLORS.borderSoft}`, cursor: 'pointer' }}>
                  <td style={tableCell}>{r.recruiter_name || '—'}</td>
                  <td style={tableCell}>{r.job_title}</td>
                  <td style={tableCell}>{r.department || '—'}</td>
                  <td style={tableCell}>{r.vacancies}</td>
                  <td style={tableCell}>{new Date(r.requested_at).toLocaleDateString()}</td>
                  <td style={tableCell}>
                    <span style={badge(r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning')}>
                      {r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [active, setActive] = useState<Tab>('candidates');
  // When set, the Candidates tab shows this candidate's detail view instead of the
  // list — keeps the sidebar/header shell visible instead of navigating to the
  // standalone /admin/candidate/:userId route (which has no sidebar at all).
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  // Switching tabs always resets Candidates back to the list view (not stuck on
  // whichever candidate you last opened).
  const handleTabChange = (tab: Tab) => { setActive(tab); setSelectedCandidateId(null); };
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const [group, tabs] of Object.entries(GROUP_TABS)) {
      initial[group] = tabs.includes('candidates');
    }
    return initial;
  });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('isAdminAuthenticated');
    sessionStorage.removeItem('adminEmail');
    navigate('/login-admin');
  };

  // Route guard: this page has no wrapper checking auth before rendering, so
  // without this, logging out (or just hitting Back) leaves the whole
  // dashboard visible with no valid session — only the API calls would 401.
  useEffect(() => {
    if (!localStorage.getItem('admin_token')) {
      navigate('/login-admin', { replace: true });
    }
  }, [navigate]);

  // ── JD Approval notification bell ─────────────────────────────────────────
  const [pendingCount,   setPendingCount]   = useState(0);
  const [jdDropdownOpen, setJdDropdownOpen] = useState(false);
  const [jdPending,      setJdPending]      = useState<JdApprovalRequest[]>([]);
  const [jdSelected,     setJdSelected]     = useState<JdApprovalRequest | null>(null);

  const loadJdBadge = useCallback(async () => {
    try { setPendingCount(await adminJdApprovalAPI.getBadge()); } catch { /* not logged in yet, or offline */ }
  }, []);

  useEffect(() => {
    loadJdBadge();
    const t = setInterval(loadJdBadge, 30000);
    return () => clearInterval(t);
  }, [loadJdBadge]);

  const openJdDropdown = async () => {
    if (jdDropdownOpen) { setJdDropdownOpen(false); return; }
    try { setJdPending(await adminJdApprovalAPI.listPending()); } catch { setJdPending([]); }
    setJdDropdownOpen(true);
  };

  const refreshJdData = () => { loadJdBadge(); adminJdApprovalAPI.listPending().then(setJdPending).catch(() => {}); };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <style>{`
        @keyframes adm-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes adm-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes adm-pulse-bar {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .adm-card {
          transition: box-shadow 0.18s, border-color 0.18s;
        }
        .adm-card:hover {
          box-shadow: 0 4px 18px rgba(79,70,229,0.07);
          border-color: #c7d2fe !important;
        }
        .adm-row-hover:hover td {
          background: #fafbff !important;
        }
        .adm-fadein {
          animation: adm-fadein 0.22s ease both;
        }
        .adm-nav-btn {
          transition: background 0.12s, color 0.12s, border-right-color 0.12s;
        }
        .adm-nav-btn:hover {
          background: ${COLORS.shellActiveBg} !important;
          color: ${COLORS.shellActiveText} !important;
        }
        .adm-shimmer-skel {
          background: linear-gradient(90deg, #eef0f3 25%, #f5f6f8 50%, #eef0f3 75%);
          background-size: 800px 100%;
          animation: adm-shimmer 1.4s ease-in-out infinite;
          border-radius: 4px;
        }
      `}</style>
      {/* ── Top Bar ── */}
      <header className="h-14 flex items-center px-6 gap-4 flex-shrink-0" style={{ background: COLORS.shellHeaderBg, borderBottom: `1px solid ${COLORS.shellBorder}` }}>
        <div className="flex items-center gap-3">
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.04em', lineHeight: 1 }}>ASKOXY.AI</div>
            <div style={{ color: COLORS.shellText, fontWeight: 600, fontSize: 10, letterSpacing: '0.12em', marginTop: 2 }}>SUPER ADMIN</div>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <div onClick={openJdDropdown} style={{ position: 'relative', display: 'flex', cursor: 'pointer', padding: 6, borderRadius: RADIUS.sm }}>
            <Bell size={17} style={{ color: pendingCount > 0 ? '#fff' : COLORS.shellText }} />
            {pendingCount > 0 && (
              <span style={{ position: 'absolute', top: 1, right: 1, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 8, background: COLORS.danger, color: '#fff', fontSize: 9.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          {jdDropdownOpen && (
            <JdApprovalDropdown
              requests={jdPending}
              onClose={() => setJdDropdownOpen(false)}
              onSelect={(r) => { setJdSelected(r); setJdDropdownOpen(false); }}
            />
          )}
          {jdSelected && (
            <JdApprovalDetailModal
              request={jdSelected}
              onClose={() => setJdSelected(null)}
              onDecided={refreshJdData}
            />
          )}
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: COLORS.shellActiveBg }}>
            <ShieldCheck size={14} color="#fff" />
          </div>
          <span className="text-xs hidden md:block" style={{ color: COLORS.shellText, fontWeight: 600, letterSpacing: '0.03em' }}>ADMIN</span>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* ── Sidebar ── */}
        <aside style={{ width: 220, background: COLORS.shellSidebarBg, borderRight: `1px solid ${COLORS.shellBorder}`, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${COLORS.shellBorder}` }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: COLORS.shellTextDim, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Navigation</p>
          </div>
          <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {NAV.map(item => {
              if ('group' in item) {
                const isOpen = !!openGroups[item.group];
                const groupActive = GROUP_TABS[item.group]?.includes(active);
                return (
                  <div key={item.group}>
                    <button
                      onClick={() => setOpenGroups(p => ({ ...p, [item.group]: !p[item.group] }))}
                      className="adm-nav-btn"
                      style={{
                        width: 'calc(100% - 20px)', display: 'flex', alignItems: 'center', gap: 10,
                        margin: '0 10px 2px', padding: '9px 12px', border: 'none', background: 'none',
                        borderRadius: RADIUS.sm,
                        cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 400,
                        color: groupActive ? COLORS.shellActiveTextSoft : COLORS.shellText,
                        transition: 'all 0.12s',
                      }}
                    >
                      <span style={{ color: groupActive ? COLORS.shellActiveTextSoft : COLORS.shellTextDim, display: 'flex', flexShrink: 0 }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.group}</span>
                      <span style={{ color: COLORS.shellTextDim, display: 'flex', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                        {CHEVRON}
                      </span>
                    </button>
                    {isOpen && item.items.map(sub => (
                      <button
                        key={sub.key}
                        onClick={() => handleTabChange(sub.key)}
                        className="adm-nav-btn"
                        style={{
                          width: 'calc(100% - 20px)', display: 'flex', alignItems: 'center', gap: 10,
                          margin: '0 10px 2px', padding: '9px 12px 9px 28px', border: 'none',
                          borderRadius: RADIUS.sm,
                          cursor: 'pointer', textAlign: 'left', fontSize: 12.5, fontWeight: 500,
                          color: active === sub.key ? COLORS.shellActiveText : COLORS.shellText,
                          backgroundColor: active === sub.key ? COLORS.shellActiveBg : 'transparent',
                          transition: 'all 0.12s',
                        }}
                      >
                        <span style={{ color: active === sub.key ? COLORS.shellActiveText : COLORS.shellTextDim, display: 'flex', flexShrink: 0 }}>
                          {sub.icon}
                        </span>
                        {sub.label}
                      </button>
                    ))}
                  </div>
                );
              }
              return (
                <button
                  key={item.key}
                  onClick={() => handleTabChange(item.key)}
                  className="adm-nav-btn"
                  style={{
                    width: 'calc(100% - 20px)', display: 'flex', alignItems: 'center', gap: 10,
                    margin: '0 10px 2px', padding: '9px 12px', border: 'none',
                    borderRadius: RADIUS.sm,
                    cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 500,
                    color: active === item.key ? COLORS.shellActiveText : COLORS.shellText,
                    backgroundColor: active === item.key ? COLORS.shellActiveBg : 'transparent',
                    transition: 'all 0.12s',
                  }}
                >
                  <span style={{ color: active === item.key ? COLORS.shellActiveText : COLORS.shellTextDim, display: 'flex', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${COLORS.shellBorder}` }}>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.08)', border: `1px solid ${COLORS.shellBorder}`, borderRadius: RADIUS.sm, color: COLORS.shellText, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
              <LogOut size={13} /> Logout
            </button>
          </div>
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${COLORS.shellBorder}` }}>
            <p style={{ fontSize: 11, color: COLORS.shellText, margin: 0 }}>AI Interview Portal</p>
            <p style={{ fontSize: 10, color: COLORS.shellTextDim, margin: '2px 0 0' }}>v1.0</p>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Breadcrumb */}
          <div style={{ background: '#fff', borderBottom: `1px solid ${COLORS.border}`, padding: '10px 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#6b7280' }}>
              <span>Admin</span>
              <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span style={{ color: '#111827', fontWeight: 600 }}>
                {active === 'round-settings' ? 'Round Settings' : active === 'super-resume-pool' ? 'Super Resume Pool' : active === 'bulk-resume-pool' ? 'AI Bulk Resume Pool' : active.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>
          </div>
          <div key={active} style={{ flex: 1, overflowY: 'auto' }} className="adm-fadein">

          {active === 'candidates' && (
            selectedCandidateId
              ? <CandidateDetail userId={selectedCandidateId} onBack={() => setSelectedCandidateId(null)} />
              : <CandidatesList onSelectCandidate={setSelectedCandidateId} />
          )}
          {active === 'round-settings' && <InterviewConfig />}
          {active === 'attempts' && <AdminAttempts />}
          {active === 'analytics' && <AdminAnalytics />}
          {active === 'hiring-monitor' && <HiringMonitor />}
          {active === 'jd-approvals' && <JdApprovalHistoryTab />}
          {active === 'super-resume-pool' && <SuperResumePool />}
          {active === 'bulk-resume-pool' && <BulkResumePool />}
          {active === 'panel-members' && <AdminPanelMembers />}
          {active === 'panel-assignments' && <PanelAssignmentsMonitor />}
          {active === 'panel-evaluations' && <PanelEvaluationsAnalytics />}
          </div>
        </main>
      </div>
    </div>
  );
};
