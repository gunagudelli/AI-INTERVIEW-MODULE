import React, { useEffect, useState } from 'react';
import { panelAssignmentAdminAPI } from '../../services/recruiterAPI';
import { COLORS, RADIUS, SHADOW } from '../../AIMockInterview/admin/adminTheme';

const StatPill: React.FC<{ label: string; value: React.ReactNode; dot: string }> = ({ label, value, dot }) => (
  <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, boxShadow: SHADOW.sm, height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
    <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{value}</span>
    <span style={{ fontSize: 10.5, color: COLORS.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
  </div>
);

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:             { label: 'Waiting for Response', color: '#0369A1', bg: '#F0F9FF' },
  rejected:            { label: 'Rejected',             color: '#B91C1C', bg: '#FEF2F2' },
  slots_submitted:     { label: 'Accepted (Slots Submitted)', color: '#B45309', bg: '#FFFBEB' },
  recruiter_confirmed: { label: 'Interview Scheduled',  color: '#4338CA', bg: '#EEF2FF' },
  candidate_invited:   { label: 'Candidate Invited',    color: '#A21CAF', bg: '#FAE8FF' },
  completed:           { label: 'Interview Completed',  color: '#15803D', bg: '#F0FDF4' },
  cancelled:           { label: 'Cancelled',             color: '#64748B', bg: '#F1F5F9' },
};

const EVENT_LABEL: Record<string, string> = {
  assigned: 'Panel Assigned',
  email_sent: 'Email Sent',
  email_failed: 'Email Failed',
  viewed: 'Viewed by Panel',
  accepted: 'Accepted',
  rejected: 'Rejected',
  slots_submitted: 'Slots Submitted',
  recruiter_confirmed: 'Recruiter Confirmed',
  candidate_invited: 'Candidate Invited',
  completed: 'Completed',
  cancelled: 'Cancelled',
  reassigned: 'Reassigned',
};

const PanelAssignmentsMonitor: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [auditTrail, setAuditTrail] = useState<Record<number, any[]>>({});

  const load = () => {
    setLoading(true);
    panelAssignmentAdminAPI.list({ status: statusFilter || undefined })
      .then(res => {
        setAssignments(res.assignments || []);
        setCounts(res.counts || {});
      })
      .catch(() => { setAssignments([]); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const toggleExpand = (id: number) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!auditTrail[id]) {
      panelAssignmentAdminAPI.getAuditTrail(id)
        .then(trail => setAuditTrail(prev => ({ ...prev, [id]: trail })))
        .catch(() => setAuditTrail(prev => ({ ...prev, [id]: [] })));
    }
  };

  const totalAssigned = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div style={{ padding: '20px 24px', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 16px' }}>Interview Panel Assignments</h2>

      {/* Status summary — compact pills instead of large padded cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <StatPill label="Panel Assigned" value={totalAssigned} dot={COLORS.brand} />
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <StatPill key={key} label={meta.label} value={counts[key] || 0} dot={meta.color} />
        ))}
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 12 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '7px 12px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, color: '#374151' }}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading…</p>
        ) : assignments.length === 0 ? (
          <p style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>No panel assignments yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {['Candidate', 'Job', 'Panel Member', 'Status', 'Assigned At', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => {
                const meta = STATUS_META[a.status] || { label: a.status, color: '#64748B', bg: '#F1F5F9' };
                const isExpanded = expandedId === a.id;
                return (
                  <React.Fragment key={a.id}>
                    <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{a.candidate_name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{a.job_title}</td>
                      <td style={{ padding: '10px 14px', fontSize: 12.5, color: '#64748B' }}>{a.panel_member_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>{meta.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: '#94A3B8' }}>
                        {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button onClick={() => toggleExpand(a.id)}
                          style={{ padding: '5px 11px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 11.5, fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                          {isExpanded ? 'Hide' : 'Audit'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: '10px 14px 16px', background: '#F8FAFC' }}>
                          {!auditTrail[a.id] ? (
                            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Loading audit trail…</p>
                          ) : auditTrail[a.id].length === 0 ? (
                            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>No audit events.</p>
                          ) : (
                            <ol style={{ margin: 0, paddingLeft: 18 }}>
                              {auditTrail[a.id].map((ev: any) => (
                                <li key={ev.id} style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>
                                  <strong>{EVENT_LABEL[ev.event] || ev.event}</strong>
                                  {ev.actor ? ` — ${ev.actor}` : ''}
                                  {' · '}
                                  <span style={{ color: '#94A3B8' }}>{new Date(ev.created_at).toLocaleString('en-IN')}</span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PanelAssignmentsMonitor;
