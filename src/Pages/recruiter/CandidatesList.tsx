import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, FileText } from "lucide-react";
import recruiterAPI, {
  recruiterEvaluationAPI,
} from "../../services/recruiterAPI";
import { STATUS_LABEL, getStatusStyle } from "../../styles/theme";
import { ToastContainer } from "../../components/common/Toast";
import { useNotification } from "../../hooks/useNotification";

const STATUSES = [
  "",
  "applied",
  "pending",
  "screened",
  "interview_sent",
  "shortlisted",
  "approved",
  "hired",
  "rejected",
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes cl-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

  .cl-row { border-left: 3px solid transparent; transition: background .12s ease, border-color .12s ease; animation: cl-in .15s ease both; }
  .cl-row:hover { background: #F8FAFC !important; border-left-color: #1D4ED8; }

  .cl-card { animation: cl-in .15s ease both; transition: border-color .12s, box-shadow .12s; }
  .cl-card:hover { border-color: #CBD5E1 !important; }

  .cl-btn { transition: filter .1s, background .1s, border-color .1s; cursor: pointer; font-family: inherit; }
  .cl-btn:hover { filter: brightness(0.95); }
  .cl-btn:disabled { cursor: not-allowed; opacity: 0.55; }

  .cl-input, .cl-select { font-family: inherit; outline: none; transition: border-color .15s; }
  .cl-input:focus, .cl-select:focus { border-color: #93C5FD; }

  .cl-job-link { transition: color .1s; }
  .cl-job-link:hover { color: #1E3A8A !important; text-decoration: underline; }

  .cl-table-wrap { display: block; }
  .cl-cards { display: none; }

  @media (max-width: 768px) {
    .cl-table-wrap { display: none; }
    .cl-cards { display: flex; flex-direction: column; gap: 10px; }
    .cl-header-pad { padding: 14px 16px !important; }
    .cl-wrap { padding: 16px !important; }
  }

  .cl-table { width: 100%; min-width: 820px; border-collapse: collapse; table-layout: fixed; }
  .cl-table th, .cl-table td { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cl-col-cand   { width: 22%; }
  .cl-col-job    { width: 16%; }
  .cl-col-rscore { width: 8%; }
  .cl-col-status { width: 16%; }
  .cl-col-date   { width: 8%; }
  .cl-col-action { width: 30%; overflow: visible !important; }
`;

const avatarColors = ["#1E40AF", "#065F46", "#6B21A8", "#9A3412", "#1E3A5F"];

const Avatar: React.FC<{ name: string; size?: number }> = ({
  name,
  size = 36,
}) => {
  const bg = avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? 10 : 8,
        flexShrink: 0,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.36,
      }}
    >
      {(name || "U")[0].toUpperCase()}
    </div>
  );
};

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const bg = score >= 70 ? "#F0FDF4" : score >= 50 ? "#FFFBEB" : "#FEF2F2";
  const color = score >= 70 ? "#15803D" : score >= 50 ? "#B45309" : "#B91C1C";
  const border = score >= 70 ? "#BBF7D0" : score >= 50 ? "#FDE68A" : "#FECACA";
  return (
    <span
      style={{
        padding: "2px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {score}%
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = getStatusStyle(status);
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
};

const CandidatesList: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [jobFilter, setJobFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [decisionLoading, setDecisionLoading] = useState<string | null>(null);
  // Panel-assignment / evaluation state — true interview completion is the panel evaluation
  // being submitted/locked, not merely a panel assignment reaching 'completed' (that status
  // only means the evaluation form was opened). Mirrors the same gate in JobApplications.tsx.
  const [panelAssignments, setPanelAssignments] = useState<
    Record<string, any[]>
  >({});
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const {
    toasts,
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
    removeNotification,
  } = useNotification();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const jobList = await recruiterAPI.getAllJobs();
      setJobs(jobList);
      const results = await Promise.all(
        jobList.map((job: any) =>
          recruiterAPI
            .getCandidatesByJob(job.id)
            .then((apps: any[]) =>
              apps.map((a: any) => ({
                ...a,
                jobTitle: job.title,
                jobId: job.id,
              })),
            )
            .catch(() => []),
        ),
      );
      const apps = results.flat();
      setApplications(apps);
      apps.forEach((a: any) => {
        recruiterAPI
          .getPanelAssignments(String(a.id))
          .then((rows: any[]) =>
            setPanelAssignments((prev) => ({ ...prev, [String(a.id)]: rows })),
          )
          .catch(() => {});
      });
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch the panel evaluation once its assignment has reached 'completed' — see the
  // identical pattern (and rationale) in JobApplications.tsx.
  useEffect(() => {
    Object.entries(panelAssignments).forEach(([appId, rows]) => {
      const latest = rows && rows.length ? rows[0] : null;
      if (latest?.status === "completed" && evaluations[appId] === undefined) {
        recruiterEvaluationAPI
          .getByAssignment(latest.id)
          .then((ev: any) =>
            setEvaluations((prev) => ({ ...prev, [appId]: ev ?? null })),
          )
          .catch(() => setEvaluations((prev) => ({ ...prev, [appId]: null })));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelAssignments]);

  const handleSendAssessment = async (appId: string) => {
    setActionLoading(appId + "send");
    try {
      const res = await recruiterAPI.sendAssessment(appId);
      res.emailSent
        ? notifySuccess(`Email sent to ${res.sentTo}`)
        : notifyInfo("Link generated");
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status: "interview_sent" } : a,
        ),
      );
    } catch {
      notifyError("Failed to send assessment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecision = async (
    appId: string,
    decision: "hired" | "rejected",
    email: string,
  ) => {
    if (
      !window.confirm(
        `${decision === "hired" ? "Hire" : "Reject"} this candidate?`,
      )
    )
      return;
    setDecisionLoading(appId + decision);
    try {
      const res = await recruiterAPI.sendDecision(appId, decision);
      res.emailSent
        ? notifySuccess(`Email sent to ${res.sentTo}`)
        : notifyInfo("Decision saved");
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId
            ? { ...a, finalDecision: decision, status: decision }
            : a,
        ),
      );
    } catch {
      notifyError("Failed to update decision");
    } finally {
      setDecisionLoading(null);
    }
  };

  // Panel-assignment / evaluation status for an application — shown in the Status/Exam column
  // (desktop table) or the badge row (mobile card), kept out of the Actions cell so button rows
  // stay a single tidy line instead of wrapping.
  const renderEvaluationBadge = (a: any) => {
    const latestAssignment = panelAssignments[String(a.id)]?.[0] || null;
    if (!latestAssignment) return null;
    const evaluation = evaluations[String(a.id)];
    const evaluationSubmitted =
      !!evaluation && ["submitted", "locked"].includes(evaluation.status);
    return (
      <div style={{ marginTop: 4, maxWidth: 200 }}>
        <span
          style={{
            display: "inline-block",
            padding: "1px 7px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: evaluationSubmitted ? "#F0FDF4" : "#FFFBEB",
            color: evaluationSubmitted ? "#15803D" : "#B45309",
            border: `1px solid ${evaluationSubmitted ? "#BBF7D0" : "#FDE68A"}`,
          }}
        >
          {evaluationSubmitted
            ? "Interview Completed"
            : `Panel: ${latestAssignment.status.replace(/_/g, " ")}`}
        </span>
        {evaluationSubmitted && (
          <div
            style={{
              fontSize: 10.5,
              color: "#94A3B8",
              marginTop: 2,
              whiteSpace: "normal",
            }}
          >
            {evaluation?.panel_member_name}
            {evaluation?.overall_score != null
              ? ` · ${evaluation.overall_score}/10`
              : ""}
          </div>
        )}
        {/* Only shown while the meeting is still upcoming/joinable — once the evaluation is
            submitted the interview is over, so the join link is no longer actionable. */}
        {!evaluationSubmitted && latestAssignment.meeting_link && (
          <div style={{ marginTop: 3 }}>
            <a
              href={latestAssignment.meeting_link}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: latestAssignment.teams_meeting_id
                  ? "#5B5FC7"
                  : "#1D4ED8",
                textDecoration: "none",
              }}
            >
              {latestAssignment.teams_meeting_id
                ? "🟣 Join Teams Meeting"
                : "Join Meeting →"}
            </a>
          </div>
        )}
      </div>
    );
  };

  const renderActionButtons = (a: any, compact = false) => {
    const isClosed = a.status === "hired" || a.status === "rejected";
    const examDone =
      a.exam_completed === true ||
      a.examCompleted === true ||
      a.interview_score != null ||
      a.interviewScore != null;
    const sendKey = a.id + "send";
    const hireKey = a.id + "hired";
    const rejectKey = a.id + "rejected";
    const sending = actionLoading === sendKey;
    const decisionBusy =
      decisionLoading === hireKey || decisionLoading === rejectKey;
    const base = compact
      ? {
          flex: 1,
          padding: "9px",
          fontSize: 12.5,
          fontWeight: 700,
          borderRadius: 7,
          whiteSpace: "nowrap" as const,
        }
      : {
          padding: "5px 10px",
          fontSize: 11.5,
          fontWeight: 600,
          borderRadius: 6,
          whiteSpace: "nowrap" as const,
        };

    const latestAssignment = panelAssignments[String(a.id)]?.[0] || null;
    const evaluation = evaluations[String(a.id)];
    const evaluationSubmitted =
      !!evaluation && ["submitted", "locked"].includes(evaluation.status);
    const panelInFlight =
      !!latestAssignment &&
      !["rejected", "cancelled"].includes(latestAssignment.status);
    const decisionGatedByInterview = panelInFlight && !evaluationSubmitted;

    return (
      <div
        style={{
          display: "flex",
          gap: compact ? 8 : 6,
          flexWrap: "nowrap",
          alignItems: "center",
        }}
      >
        <button
          className="cl-btn"
          onClick={() => navigate(`/recruiter/applications/${a.id}`)}
          style={{
            ...base,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: "#1D4ED8",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
          }}
        >
          View
        </button>
        {a.resume_url && (
          <a
            href={a.resume_url}
            target="_blank"
            rel="noreferrer"
            className="cl-btn"
            style={{
              ...base,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: "#374151",
              background: "#fff",
              border: "1px solid #E2E8F0",
              textDecoration: "none",
            }}
          >
            <FileText size={11} /> CV
          </a>
        )}
        {!isClosed && !examDone && (
          <button
            className="cl-btn"
            onClick={() => handleSendAssessment(a.id)}
            disabled={sending}
            style={{
              ...base,
              color: "#fff",
              background: "#1D4ED8",
              border: "none",
            }}
          >
            {sending
              ? "..."
              : a.status === "interview_sent"
                ? "Resend"
                : "Send Link"}
          </button>
        )}
        {examDone && !isClosed && !decisionGatedByInterview && (
          <button
            className="cl-btn"
            onClick={() => handleDecision(a.id, "hired", a.email)}
            disabled={decisionBusy}
            style={{
              ...base,
              color: "#fff",
              background: "#16A34A",
              border: "none",
            }}
          >
            {decisionLoading === hireKey ? "..." : "Hire"}
          </button>
        )}
        {!isClosed && !decisionGatedByInterview && (
          <button
            className="cl-btn"
            onClick={() => handleDecision(a.id, "rejected", a.email)}
            disabled={decisionBusy}
            style={{
              ...base,
              color: "#fff",
              background: "#DC2626",
              border: "none",
            }}
          >
            {decisionLoading === rejectKey ? "..." : "Reject"}
          </button>
        )}
      </div>
    );
  };

  const filtered = applications.filter((a) => {
    if (
      statusFilter &&
      (statusFilter === "shortlisted"
        ? !["shortlisted", "approved"].includes((a.status || "").toLowerCase())
        : a.status !== statusFilter)
    )
      return false;
    if (jobFilter && String(a.jobId) !== jobFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !a.name?.toLowerCase().includes(q) &&
        !a.email?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "2.5px solid #E2E8F0",
            borderTop: "2.5px solid #1D4ED8",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'Inter', -apple-system, sans-serif",
        animation: "cl-in .2s ease",
        color: "#0F172A",
      }}
    >
      <style>{CSS}</style>
      <ToastContainer toasts={toasts} onClose={removeNotification} />

      <div
        className="cl-header-pad"
        style={{
          background: "#FAFAFA",
          borderBottom: "1px solid #E2E8F0",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0F172A",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Applications
          </h1>
          <p
            style={{
              fontSize: 12.5,
              color: "#94A3B8",
              margin: "3px 0 0",
              fontWeight: 500,
            }}
          >
            {filtered.length} candidate{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 11,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cl-input"
              style={{
                width: 220,
                paddingLeft: 34,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                background: "#fff",
                boxSizing: "border-box",
                color: "#0F172A",
              }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="cl-select"
              style={{
                padding: "8px 30px 8px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                background: "#fff",
                color: "#374151",
                minWidth: 150,
                appearance: "none",
              }}
            >
              <option value="">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={String(j.id)}>
                  {j.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="cl-select"
              style={{
                padding: "8px 30px 8px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontSize: 13,
                background: "#fff",
                color: "#374151",
                minWidth: 140,
                appearance: "none",
              }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? STATUS_LABEL[s] || s : "All Status"}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>

      <div className="cl-wrap" style={{ padding: "20px 28px" }}>
        {filtered.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              padding: "64px 24px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#94A3B8", fontSize: 14, margin: 0 }}>
              No applications found
            </p>
          </div>
        ) : (
          <>
            <div
              className="cl-table-wrap"
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table className="cl-table">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #E2E8F0",
                        background: "#F8FAFC",
                      }}
                    >
                      <th
                        className="cl-col-cand"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Candidate
                      </th>
                      <th
                        className="cl-col-job"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Job
                      </th>
                      <th
                        className="cl-col-rscore"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Resume
                      </th>
                      <th
                        className="cl-col-status"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Status / Exam
                      </th>
                      <th
                        className="cl-col-date"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Date
                      </th>
                      <th
                        className="cl-col-action"
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: "#94A3B8",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a: any, i: number) => {
                      const score =
                        parseFloat(a.match_score ?? a.score ?? 0) || 0;
                      const examScore =
                        parseFloat(
                          a.interview_score ?? a.interviewScore ?? 0,
                        ) || null;
                      return (
                        <tr
                          key={a.id}
                          className="cl-row"
                          style={{
                            borderBottom: "1px solid #F1F5F9",
                            animationDelay: `${Math.min(i * 0.03, 0.3)}s`,
                          }}
                        >
                          <td
                            className="cl-col-cand"
                            style={{
                              padding: "12px 14px",
                              overflow: "visible",
                              whiteSpace: "normal",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 9,
                              }}
                            >
                              <Avatar name={a.name} size={30} />
                              <div style={{ minWidth: 130 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "#0F172A",
                                    overflow: "visible",
                                    whiteSpace: "normal",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {a.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#94A3B8",
                                    overflow: "visible",
                                    whiteSpace: "normal",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {a.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td
                            className="cl-col-job"
                            style={{
                              padding: "12px 14px",
                              overflow: "visible",
                              whiteSpace: "normal",
                              minWidth: 100,
                            }}
                          >
                            <button
                              onClick={() =>
                                navigate(
                                  `/recruiter/jobs/${a.jobId}/applications`,
                                )
                              }
                              className="cl-job-link"
                              style={{
                                fontSize: 12,
                                color: "#1D4ED8",
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                                fontWeight: 600,
                                overflow: "visible",
                                whiteSpace: "normal",
                                overflowWrap: "break-word",
                                maxWidth: "100%",
                                display: "block",
                                textAlign: "left",
                              }}
                            >
                              {a.jobTitle || `Job #${a.jobId}`}
                            </button>
                          </td>
                          <td
                            className="cl-col-rscore"
                            style={{ padding: "12px 14px" }}
                          >
                            <ScoreBadge score={score} />
                          </td>
                          <td
                            className="cl-col-status"
                            style={{
                              padding: "12px 14px",
                              overflow: "visible",
                              whiteSpace: "normal",
                            }}
                          >
                            <StatusBadge status={a.status || "pending"} />
                            {examScore != null && (
                              <div style={{ marginTop: 4 }}>
                                <span
                                  style={{
                                    padding: "1px 7px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background:
                                      examScore >= 70
                                        ? "#F0FDF4"
                                        : examScore >= 50
                                          ? "#FFFBEB"
                                          : "#FEF2F2",
                                    color:
                                      examScore >= 70
                                        ? "#15803D"
                                        : examScore >= 50
                                          ? "#B45309"
                                          : "#B91C1C",
                                    border: `1px solid ${examScore >= 70 ? "#BBF7D0" : examScore >= 50 ? "#FDE68A" : "#FECACA"}`,
                                  }}
                                >
                                  {examScore}%
                                </span>
                              </div>
                            )}
                            {renderEvaluationBadge(a)}
                          </td>
                          <td
                            className="cl-col-date"
                            style={{
                              padding: "12px 14px",
                              fontSize: 11.5,
                              color: "#94A3B8",
                              fontWeight: 500,
                            }}
                          >
                            {a.applied_at || a.appliedAt
                              ? new Date(
                                  a.applied_at || a.appliedAt,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                })
                              : "—"}
                          </td>
                          <td
                            className="cl-col-action"
                            style={{ padding: "12px 14px" }}
                          >
                            {renderActionButtons(a)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="cl-cards">
              {filtered.map((a: any, i: number) => {
                const score = parseFloat(a.match_score ?? a.score ?? 0) || 0;
                return (
                  <div
                    key={a.id}
                    className="cl-card"
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #E2E8F0",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      animationDelay: `${Math.min(i * 0.04, 0.3)}s`,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 11 }}
                    >
                      <Avatar name={a.name} size={42} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0F172A",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {a.name}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94A3B8",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {a.email}
                        </div>
                      </div>
                      <ScoreBadge score={score} />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <StatusBadge status={a.status || "pending"} />
                      <span
                        style={{
                          fontSize: 12,
                          color: "#1D4ED8",
                          fontWeight: 600,
                        }}
                      >
                        {a.jobTitle || `Job #${a.jobId}`}
                      </span>
                      {(a.applied_at || a.appliedAt) && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#94A3B8",
                            marginLeft: "auto",
                            fontWeight: 500,
                          }}
                        >
                          {new Date(
                            a.applied_at || a.appliedAt,
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      )}
                    </div>
                    {renderEvaluationBadge(a)}

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        paddingTop: 10,
                        borderTop: "1px solid #F1F5F9",
                      }}
                    >
                      {renderActionButtons(a, true)}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CandidatesList;
