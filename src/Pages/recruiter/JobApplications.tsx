import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Edit, Search, Filter, Trash2, FileText, Send, CheckCircle, XCircle, UserCheck, ChevronDown } from 'lucide-react';
import recruiterAPI, { recruiterEvaluationAPI } from '../../services/recruiterAPI';
import { ToastContainer } from '../../components/common/Toast';
import { useNotification } from '../../hooks/useNotification';

const PASSING_SCORE = 50;

const PANEL_STATUS_MAP: Record<string, [string, string, string]> = {
  pending:              ['#F0F9FF', '#0369A1', 'Panel: Pending'],
  rejected:             ['#FEF2F2', '#B91C1C', 'Panel: Rejected'],
  slots_submitted:      ['#FFFBEB', '#B45309', 'Panel: Awaiting Confirmation'],
  recruiter_confirmed:  ['#EEF2FF', '#4338CA', 'Panel: Confirmed'],
  candidate_invited:    ['#FAE8FF', '#A21CAF', 'Candidate Invited'],
  // 'completed' here only means the panel interview happened and the evaluation form was
  // opened — NOT that a hiring decision is ready. Real completion is driven by
  // panel_evaluations.status (submitted/locked), rendered separately below. Do not relabel
  // this back to "Interview Completed" — that was the source of the premature-completion bug.
  completed:            ['#F0FDF4', '#15803D', 'Awaiting Evaluation'],
  cancelled:            ['#F1F5F9', '#64748B', 'Panel: Cancelled'],
};

const PanelStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const [bg, col, label] = PANEL_STATUS_MAP[status] ?? ['#F1F5F9', '#64748B', status];
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: col, whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
      {label}
    </span>
  );
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes ja-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

  .ja-row { border-left: 3px solid transparent; transition: border-color .12s ease, background .12s ease; animation: ja-in .15s ease both; }
  .ja-row:hover { background: #F8FAFC !important; border-left-color: #1D4ED8; }
  .ja-row.selected { background: #EFF6FF !important; border-left-color: #1D4ED8; }

  .ja-stat { animation: ja-in .18s ease both; transition: border-color .15s, transform .1s; }
  .ja-stat:hover { border-color: #CBD5E1 !important; }

  .ja-btn { transition: filter .1s, background .1s, border-color .1s; cursor: pointer; font-family: inherit; }
  .ja-btn:hover { filter: brightness(0.95); }
  .ja-btn:disabled { cursor: not-allowed; opacity: 0.55; }

  .ja-input, .ja-select { font-family: inherit; outline: none; transition: border-color .15s; }
  .ja-input:focus, .ja-select:focus { border-color: #93C5FD; }

  .ja-edit-btn:hover { background: #F1F5F9 !important; border-color: #CBD5E1 !important; }
  .ja-back-btn:hover { color: #374151 !important; }
  .ja-cancel-btn:hover { color: #374151 !important; }

  th { white-space: nowrap; }
`;

const STAGE_MAP: Record<string, [string, string]> = {
  applied:             ['#EFF6FF', '#1D4ED8'],
  pending:             ['#F1F5F9', '#64748B'],
  screened:            ['#FEF9C3', '#A16207'],
  shortlisted:         ['#DBEAFE', '#1D4ED8'],
  interview_sent:      ['#FFFBEB', '#B45309'],
  interview_scheduled: ['#FAE8FF', '#A21CAF'],
  assessed:            ['#F5F3FF', '#7C3AED'],
  rejected:            ['#FEF2F2', '#B91C1C'],
  hired:               ['#F0FDF4', '#15803D'],
  panel_assigned:      ['#F0F9FF', '#0369A1'],
};
const STAGE_LABEL: Record<string, string> = {
  applied: 'Applied', pending: 'Pending', screened: 'Screened',
  shortlisted: 'Shortlisted', interview_sent: 'Assessment Sent',
  interview_scheduled: 'Scheduled', assessed: 'Assessed',
  rejected: 'Rejected', hired: 'Hired',
  panel_assigned: 'Panel Assigned',
};

const StageBadge: React.FC<{ status: string }> = ({ status }) => {
  const [bg, col] = STAGE_MAP[status?.toLowerCase()] ?? ['#F1F5F9', '#64748B'];
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color: col, whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
      {STAGE_LABEL[status?.toLowerCase()] || status || 'Pending'}
    </span>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? '#15803D' : score >= 50 ? '#B45309' : '#B91C1C';
  const bg    = score >= 70 ? '#F0FDF4' : score >= 50 ? '#FFFBEB' : '#FEF2F2';
  const border = score >= 70 ? '#BBF7D0' : score >= 50 ? '#FDE68A' : '#FECACA';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      {score}%
    </span>
  );
};

const avatarColors = ['#1E40AF', '#065F46', '#6B21A8', '#9A3412', '#1E3A5F'];
const Avatar: React.FC<{ name: string }> = ({ name }) => {
  const bg = avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: 12.5,
    }}>
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
};

interface PanelMember { id: number; name: string; email: string; expertise?: string; }

const AssignPanelModal: React.FC<{
  appId: string; jobId: string; onClose: () => void;
  onAssigned: (appId: string) => void;
  onError: (msg: string) => void;
}> = ({ appId, jobId, onClose, onAssigned, onError }) => {
  const [members, setMembers] = useState<PanelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    recruiterAPI.getActivePanelMembers()
      .then((data: any) => setMembers(Array.isArray(data) ? data : data?.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setAssigning(true);
    try {
      await recruiterAPI.assignPanel(appId, Array.from(selectedIds), jobId);
      onAssigned(appId);
      onClose();
    } catch (err: any) {
      onError(err?.response?.data?.error || 'Failed to assign panel member(s)');
    } finally { setAssigning(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 440, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Assign Panel Member(s)</h3>
          <button onClick={onClose} className="ja-cancel-btn" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8', lineHeight: 1, fontFamily: 'inherit' }}>×</button>
        </div>
        <div style={{ padding: '8px 20px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: '20px 0' }}>Loading panel members…</p>
          ) : members.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, padding: '20px 0' }}>No active panel members found.</p>
          ) : members.map(m => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={selectedIds.has(m.id)} onChange={() => toggle(m.id)} style={{ cursor: 'pointer' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{m.name}</div>
                  <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1 }}>{m.email}{m.expertise ? ` · ${m.expertise}` : ''}</div>
                </div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} className="ja-cancel-btn" style={{ padding: '7px 14px', background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button
            className="ja-btn"
            onClick={handleAssign}
            disabled={assigning || selectedIds.size === 0}
            style={{ padding: '7px 16px', background: '#0369A1', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
            {assigning ? 'Assigning…' : `Assign ${selectedIds.size || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
};

interface Slot { date: string; startTime: string; endTime?: string; }

const ConfirmSlotModal: React.FC<{
  assignment: any; onClose: () => void;
  onConfirmed: (appId: string) => void;
  onError: (msg: string) => void;
}> = ({ assignment, onClose, onConfirmed, onError }) => {
  const slots: Slot[] = Array.isArray(assignment?.proposed_slots) ? assignment.proposed_slots : [];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(slots.length === 1 ? 0 : null);
  const [meetingLink, setMeetingLink] = useState('');
  const [instructions, setInstructions] = useState('');
  const [confirming, setConfirming] = useState(false);
  // Set once confirmPanelSlot succeeds — shows the actual generated meeting (Teams or manual)
  // inside the modal instead of just closing on a generic toast, so the recruiter can see
  // exactly what was created before dismissing.
  const [confirmedResult, setConfirmedResult] = useState<any | null>(null);

  const handleConfirm = async () => {
    if (selectedIdx === null) return;
    setConfirming(true);
    try {
      const res = await recruiterAPI.confirmPanelSlot(assignment.id, slots[selectedIdx], meetingLink, instructions);
      onConfirmed(String(assignment.application_id));
      setConfirmedResult(res?.assignment || {});
    } catch (err: any) {
      onError(err?.response?.data?.error || 'Failed to confirm slot');
    } finally { setConfirming(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 12, width: 440, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Confirm Interview Slot</h3>
          <button onClick={onClose} className="ja-cancel-btn" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94A3B8', lineHeight: 1, fontFamily: 'inherit' }}>×</button>
        </div>
        {confirmedResult ? (
          <>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: '0 0 6px' }}>Slot confirmed — candidate invited</p>
              {confirmedResult.meeting_link?.includes('teams.microsoft.com') ? (
                <>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 14px' }}>A Microsoft Teams meeting was created automatically.</p>
                  <a href={confirmedResult.meeting_link} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#5B5FC7', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                    Join Microsoft Teams Meeting
                  </a>
                  {confirmedResult.teams_meeting_id && (
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '10px 0 0' }}>Teams Meeting ID: {confirmedResult.teams_meeting_id}</p>
                  )}
                </>
              ) : confirmedResult.meeting_link ? (
                <>
                  <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 14px' }}>Meeting link shared with the candidate.</p>
                  <a href={confirmedResult.meeting_link} target="_blank" rel="noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#2563EB', color: '#fff', borderRadius: 7, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                    Join Meeting
                  </a>
                </>
              ) : (
                <p style={{ fontSize: 12.5, color: '#94A3B8', margin: 0 }}>No meeting link was set — the candidate was still invited with the confirmed date/time.</p>
              )}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} className="ja-btn" style={{ padding: '7px 18px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <p style={{ fontSize: 12.5, color: '#64748B', margin: '0 0 10px' }}>Panel member: <strong style={{ color: '#0F172A' }}>{assignment?.panel_member_name}</strong></p>
              {slots.length === 0 ? (
                <p style={{ color: '#94A3B8', fontSize: 13 }}>No slots were submitted.</p>
              ) : slots.map((s, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${selectedIdx === idx ? '#0369A1' : '#E2E8F0'}`, borderRadius: 8, marginBottom: 8, cursor: 'pointer', background: selectedIdx === idx ? '#F0F9FF' : '#fff' }}>
                  <input type="radio" checked={selectedIdx === idx} onChange={() => setSelectedIdx(idx)} />
                  <span style={{ fontSize: 13, color: '#0F172A' }}>{s.date} · {s.startTime}{s.endTime ? ` - ${s.endTime}` : ''}</span>
                </label>
              ))}
              <div style={{ marginTop: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Meeting Link (optional — leave blank to auto-create a Teams meeting)</label>
                <input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/... (or leave blank for auto-generated Teams link)" className="ja-input"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Interview Instructions (optional)</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} className="ja-input"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={onClose} className="ja-cancel-btn" style={{ padding: '7px 14px', background: 'none', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button
                className="ja-btn"
                onClick={handleConfirm}
                disabled={confirming || selectedIdx === null}
                style={{ padding: '7px 16px', background: '#16A34A', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 600 }}>
                {confirming ? 'Confirming…' : 'Confirm & Invite Candidate'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const JobApplications: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignPanelFor, setAssignPanelFor] = useState<string | null>(null);
  const [panelAssignments, setPanelAssignments] = useState<Record<string, any[]>>({});
  const [confirmSlotAssignment, setConfirmSlotAssignment] = useState<any | null>(null);
  // Panel evaluation status per application — undefined = not yet fetched, null = fetched, none found.
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const { toasts, success: notifySuccess, error: notifyError, info: notifyInfo, removeNotification } = useNotification();

  useEffect(() => {
    if (!jobId) return;
    Promise.all([
      recruiterAPI.getCandidatesByJob(jobId).then(setApplications).catch(() => setApplications([])),
      recruiterAPI.getJobById(jobId).then(res => setJob(res?.job ?? res)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [jobId]);

  // Load panel-assignment status per application (additive — only for apps that have ever had a panel assigned).
  const refreshPanelAssignments = (appId: string) => {
    recruiterAPI.getPanelAssignments(appId)
      .then((rows: any[]) => setPanelAssignments(prev => ({ ...prev, [appId]: rows })))
      .catch(() => {});
  };

  useEffect(() => {
    if (!applications.length) return;
    applications.forEach(a => refreshPanelAssignments(String(a.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications.length, jobId]);

  const getLatestAssignment = (appId: string) => {
    const rows = panelAssignments[appId];
    return rows && rows.length ? rows[0] : null; // findByApplication is ORDER BY created_at DESC
  };

  // Fetch the panel evaluation once its assignment has reached 'completed' — an evaluation
  // row only ever exists from that point on (created atomically alongside the completion
  // transition). This is the real "interview finished" signal, distinct from
  // panel_assignments.status='completed' (which only means the evaluation form was opened).
  useEffect(() => {
    Object.entries(panelAssignments).forEach(([appId, rows]) => {
      const latest = rows && rows.length ? rows[0] : null;
      if (latest?.status === 'completed' && evaluations[appId] === undefined) {
        recruiterEvaluationAPI.getByAssignment(latest.id)
          .then((ev: any) => setEvaluations(prev => ({ ...prev, [appId]: ev ?? null })))
          .catch(() => setEvaluations(prev => ({ ...prev, [appId]: null })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelAssignments]);

  const handleDecision = async (appId: string, decision: 'hired' | 'rejected') => {
    if (!window.confirm(`${decision === 'hired' ? 'Hire' : 'Reject'} this candidate?`)) return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      res.emailSent ? notifySuccess(`Email sent to ${res.sentTo}.`) : notifyInfo('Decision recorded.');
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, finalDecision: decision, status: decision } : a));
    } catch { notifyError('Failed to update decision'); }
    finally { setDecisionLoading(null); }
  };

  const handleDeleteApplication = async (appId: string) => {
    if (!window.confirm('Delete this application?')) return;
    setActionLoading(appId + 'del');
    try {
      await recruiterAPI.deleteApplication(appId);
      setApplications(prev => prev.filter(a => String(a.id) !== String(appId)));
      setSelected(prev => { const s = new Set(prev); s.delete(appId); return s; });
      notifySuccess('Application deleted successfully');
    } catch { notifyError('Failed to delete application'); }
    finally { setActionLoading(null); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} application(s)?`)) return;
    setDeleteLoading(true);
    try {
      await recruiterAPI.bulkDeleteApplications(Array.from(selected));
      setApplications(prev => prev.filter(a => !selected.has(String(a.id))));
      setSelected(new Set());
      notifySuccess('Applications deleted successfully');
    } catch { notifyError('Failed to bulk delete'); }
    finally { setDeleteLoading(false); }
  };

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const handleSendAssessment = async (appId: string) => {
    setActionLoading(appId + 'send');
    try {
      const res = await recruiterAPI.sendAssessment(appId);
      const candidateEmail = res.sentTo || applications.find(a => String(a.id) === String(appId))?.email || '';
      setApplications(prev => prev.map(a => String(a.id) === String(appId) ? { ...a, status: 'interview_sent' } : a));
      if (res.emailSent) {
        notifySuccess(`Interview link sent to ${candidateEmail}`);
      } else {
        notifyInfo(`Assessment link generated. Code: ${res.assessmentCode}`);
      }
    } catch (err: any) {
      notifyError(err?.response?.data?.error || err?.message || 'Failed to send assessment');
    }
    finally { setActionLoading(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <div style={{ width: 26, height: 26, border: '2.5px solid #E2E8F0', borderTop: '2.5px solid #1D4ED8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const skills: string[] = job?.skills ?? job?.required_skills ?? [];
  const filtered = applications.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name?.toLowerCase().includes(q) && !a.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = [
    { label: 'Total',       count: applications.length,                                                              color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
    { label: 'Shortlisted', count: applications.filter(a => ['shortlisted', 'approved'].includes((a.status || '').toLowerCase())).length, color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'In Progress', count: applications.filter(a => a.status === 'interview_sent' && !a.exam_completed).length, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
    { label: 'Assessed',    count: applications.filter(a => a.exam_completed === true).length,                        color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'Hired',       count: applications.filter(a => a.status === 'hired').length,                             color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'Rejected',    count: applications.filter(a => a.status === 'rejected').length,                          color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0F172A' }}>
      <style>{CSS}</style>
      <ToastContainer toasts={toasts} onClose={removeNotification} />
      {assignPanelFor && jobId && (
        <AssignPanelModal
          appId={assignPanelFor}
          jobId={jobId}
          onClose={() => setAssignPanelFor(null)}
          onAssigned={(appId) => {
            setApplications(prev => prev.map(a => String(a.id) === appId ? { ...a, status: 'panel_assigned' } : a));
            refreshPanelAssignments(appId);
            notifySuccess('Panel member(s) assigned — invitation email sent.');
          }}
          onError={notifyError}
        />
      )}

      {confirmSlotAssignment && (
        <ConfirmSlotModal
          assignment={confirmSlotAssignment}
          onClose={() => setConfirmSlotAssignment(null)}
          onConfirmed={(appId) => {
            refreshPanelAssignments(appId);
            notifySuccess('Slot confirmed — candidate has been invited.');
          }}
          onError={notifyError}
        />
      )}

      {/* Top bar */}
      <div style={{ background: '#FAFAFA', borderBottom: '1px solid #E2E8F0', padding: '13px 28px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 30 }}>
        <button onClick={() => navigate(-1)} className="ja-back-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'inherit', fontWeight: 500, transition: 'color .1s' }}>
          <ArrowLeft size={14} /> Back
        </button>
        <span style={{ color: '#E2E8F0' }}>|</span>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0, letterSpacing: '-0.01em' }}>
          {job?.title || 'Applications'}
        </h1>
        {job?.status && (
          <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: job.status === 'active' ? '#F0FDF4' : '#F1F5F9', color: job.status === 'active' ? '#15803D' : '#64748B' }}>
            {job.status}
          </span>
        )}
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 28px' }}>

        {/* Job card */}
        {job && (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '18px 22px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: skills.length ? 12 : 0, gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{job.title}</h2>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#64748B', fontWeight: 500 }}><MapPin size={12} />{job.location}</span>}
                  {job.type && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#64748B', fontWeight: 500 }}><Clock size={12} />{job.type}</span>}
                  {(job.experience_min ?? job.experience) && <span style={{ fontSize: 12.5, color: '#64748B', fontWeight: 500 }}>{job.experience_min ?? job.experience}+ yrs</span>}
                </div>
              </div>
              <button onClick={() => navigate(`/recruiter/jobs/${jobId}/edit`)} className="ja-edit-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 12.5, color: '#374151', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
                <Edit size={12} /> Edit
              </button>
            </div>
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {skills.map((sk: string) => (
                  <span key={sk} style={{ padding: '2px 9px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11.5, fontWeight: 500 }}>{sk}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="ja-stat"
              style={{ padding: '12px 16px', background: '#fff', borderRadius: 9, border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden', animationDelay: `${i * 0.04}s` }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.color }} />
              <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 9, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} className="ja-input"
              style={{ width: '100%', padding: '8px 10px 8px 32px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, background: '#F8FAFC', boxSizing: 'border-box', color: '#0F172A' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={12} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="ja-select"
              style={{ padding: '8px 30px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 7, fontSize: 13, background: '#F8FAFC', color: '#374151', minWidth: 170, appearance: 'none' }}>
              <option value="">All Stages</option>
              {(['applied', 'pending', 'screened', 'interview_sent', 'shortlisted', 'approved', 'hired', 'rejected']).map(s => (
                <option key={s} value={s}>{STAGE_LABEL[s] || s}</option>
              ))}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Bulk Delete Bar */}
        {selected.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8 }}>
            <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>{selected.size} selected</span>
            <button className="ja-btn" onClick={handleBulkDelete} disabled={deleteLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              <Trash2 size={12} /> {deleteLoading ? 'Deleting…' : `Delete ${selected.size}`}
            </button>
            <button onClick={() => setSelected(new Set())} className="ja-cancel-btn" style={{ fontSize: 12.5, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit', transition: 'color .1s' }}>Cancel</button>
          </div>
        )}

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '64px 24px', textAlign: 'center' }}>
            <p style={{ color: '#94A3B8', fontSize: 14, margin: 0 }}>No applications found</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ padding: '10px 14px', width: 36 }}>
                      <input type="checkbox"
                        checked={filtered.length > 0 && selected.size === filtered.length}
                        onChange={() => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((a: any) => String(a.id))))}
                        style={{ cursor: 'pointer' }} />
                    </th>
                    {['Candidate', 'AI Score', 'Eligibility', 'Stage', 'Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: any, i: number) => {
                    const lastActivity = a.applied_at || a.appliedAt;
                    const examScore: number | null = a.interviewScore !== null && a.interviewScore !== undefined ? a.interviewScore : null;
                    const examDone = a.exam_completed === true;
                    const isEligible = examDone && examScore !== null && examScore >= PASSING_SCORE;
                    const normalizedStatus = (a.status || '').toLowerCase();
                    const isClosed = ['hired', 'rejected', 'panel_assigned'].includes(normalizedStatus);
                    const assessmentSent = normalizedStatus === 'interview_sent';
                    const visibleStatus = normalizedStatus === 'approved' ? 'shortlisted' : normalizedStatus;
                    const isSelected = selected.has(String(a.id));

                    const latestAssignment = getLatestAssignment(String(a.id));
                    // Score is shown as a signal, not a gate — the recruiter decides who's
                    // worth a panel interview, regardless of the AI's number.
                    const canAssignPanel = !isClosed && examDone &&
                      (!latestAssignment || ['rejected', 'cancelled'].includes(latestAssignment.status));

                    // True interview completion = the panel's evaluation was submitted/locked —
                    // not merely that a panel was assigned/accepted/confirmed (panel_assignments
                    // 'completed' just opens the evaluation form). While a panel interview is
                    // in flight (assigned through evaluation-pending), Hire/Reject stay disabled;
                    // applications that never had a panel assigned are unaffected (existing
                    // AI-assessment-only gating still applies).
                    const evaluation = evaluations[String(a.id)];
                    const evaluationSubmitted = !!evaluation && ['submitted', 'locked'].includes(evaluation.status);
                    const panelInFlight = !!latestAssignment && !['rejected', 'cancelled'].includes(latestAssignment.status);
                    const decisionGatedByInterview = panelInFlight && !evaluationSubmitted;

                    return (
                      <tr key={a.id} className={`ja-row${isSelected ? ' selected' : ''}`}
                        style={{ borderBottom: '1px solid #F1F5F9', animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>

                        {/* Checkbox */}
                        <td style={{ padding: '12px 14px' }}>
                          <input type="checkbox" checked={isSelected}
                            onChange={() => toggleSelect(String(a.id))} style={{ cursor: 'pointer' }} />
                        </td>

                        {/* Candidate */}
                        <td style={{ padding: '12px 14px', minWidth: 170 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar name={a.name} />
                            <div style={{ minWidth: 140 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{a.name}</div>
                              <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 1, whiteSpace: 'normal', overflowWrap: 'break-word' }}>{a.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* AI Score */}
                        <td style={{ padding: '12px 14px' }}>
                          {examScore != null
                            ? <ScoreBadge score={examScore} />
                            : <span style={{ fontSize: 12, color: '#CBD5E1' }}>—</span>}
                        </td>

                        {/* Eligibility */}
                        <td style={{ padding: '12px 14px' }}>
                          {!examDone
                            ? <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>Pending</span>
                            : isEligible
                              ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>Eligible</span>
                              : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>Not Eligible</span>}
                        </td>

                        {/* Stage */}
                        <td style={{ padding: '12px 14px', overflow: 'visible', whiteSpace: 'normal' }}>
                          <StageBadge status={a.finalDecision || visibleStatus || 'pending'} />
                          {/* Panel/evaluation status — only shown once a panel has ever been
                              assigned. Shows the real "Interview Completed" state once the
                              panel's evaluation is submitted/locked (with panel member + score),
                              otherwise the assignment's own in-progress status. Kept out of the
                              Actions cell so that button row stays a single tidy line. */}
                          {latestAssignment && (
                            <div style={{ marginTop: 4, maxWidth: 220 }}>
                              {evaluationSubmitted ? (
                                <>
                                  <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: '#F0FDF4', color: '#15803D', whiteSpace: 'nowrap' }}>
                                    Interview Completed
                                  </span>
                                  <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                                    {evaluation?.panel_member_name}{evaluation?.overall_score != null ? ` · ${evaluation.overall_score}/10` : ''}
                                  </div>
                                </>
                              ) : (
                                <PanelStatusBadge status={latestAssignment.status} />
                              )}
                              {/* Only shown while the meeting is still upcoming/joinable — once
                                  the evaluation is submitted the interview is over, so the join
                                  link is no longer actionable and would just be clutter. */}
                              {!evaluationSubmitted && latestAssignment.meeting_link && (
                                <div style={{ marginTop: 3 }}>
                                  <a href={latestAssignment.meeting_link} target="_blank" rel="noreferrer"
                                    style={{ fontSize: 10.5, fontWeight: 700, color: latestAssignment.teams_meeting_id ? '#5B5FC7' : '#1D4ED8', textDecoration: 'none' }}>
                                    {latestAssignment.teams_meeting_id ? '🟣 Join Teams Meeting' : 'Join Meeting →'}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td style={{ padding: '12px 14px', fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {lastActivity ? new Date(lastActivity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>

                            {/* Resume */}
                            {a.resume_url && (
                              <button className="ja-btn"
                                onClick={() => window.open(a.resume_url, '_blank')}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <FileText size={12} /> CV
                              </button>
                            )}

                            {/* Send / Resend Link */}
                            {!isClosed && !examDone && (
                              <button className="ja-btn"
                                onClick={() => handleSendAssessment(String(a.id))}
                                disabled={actionLoading === String(a.id) + 'send'}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <Send size={12} />
                                {actionLoading === String(a.id) + 'send' ? '…' : assessmentSent ? 'Resend' : 'Send Link'}
                              </button>
                            )}

                            {/* Assign / Reassign Panel */}
                            {canAssignPanel && (
                              <button className="ja-btn"
                                onClick={() => setAssignPanelFor(String(a.id))}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: 'none', background: '#0369A1', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <UserCheck size={12} /> {latestAssignment?.status === 'rejected' ? 'Reassign Panel' : 'Assign Panel'}
                              </button>
                            )}

                            {/* Confirm Slot (panel accepted + submitted availability) */}
                            {latestAssignment?.status === 'slots_submitted' && (
                              <button className="ja-btn"
                                onClick={() => setConfirmSlotAssignment(latestAssignment)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: 'none', background: '#B45309', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <UserCheck size={12} /> Confirm Slot
                              </button>
                            )}

                            {/* Hire — score is informational only, not a gate; the recruiter
                                decides. Still requires the panel evaluation to be submitted/
                                locked once a panel interview is in flight. */}
                            {!isClosed && examDone && !decisionGatedByInterview && (
                              <button className="ja-btn"
                                onClick={() => handleDecision(String(a.id), 'hired')}
                                disabled={!!decisionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <CheckCircle size={12} /> Hire
                              </button>
                            )}
                            {!isClosed && examDone && decisionGatedByInterview && (
                              <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic', whiteSpace: 'nowrap' }} title="Hire/Reject unlock once the panel's evaluation is submitted">
                                Awaiting interview evaluation
                              </span>
                            )}

                            {/* Reject — same evaluation gate as Hire while a panel interview is in flight */}
                            {!isClosed && !decisionGatedByInterview && (
                              <button className="ja-btn"
                                onClick={() => handleDecision(String(a.id), 'rejected')}
                                disabled={!!decisionLoading}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                                <XCircle size={12} /> Reject
                              </button>
                            )}

                            {/* Delete */}
                            <button className="ja-btn"
                              onClick={() => handleDeleteApplication(String(a.id))}
                              disabled={actionLoading === String(a.id) + 'del'}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', flexShrink: 0 }}>
                              <Trash2 size={12} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 500 }}>
                Showing <strong style={{ color: '#374151' }}>{filtered.length}</strong> of <strong style={{ color: '#374151' }}>{applications.length}</strong> application{applications.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplications;
