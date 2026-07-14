import axios from 'axios';
import type { EvaluationDraftPayload, EvaluationSubmitPayload } from '../types/panelEvaluation';

import BASE_URL from '../Config';
const BASE = BASE_URL;

// authenticated instance — recruiter token
const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recruiter_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// authenticated instance — employee token
const empApi = axios.create({ baseURL: BASE });
empApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_ref_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// no-auth instance — public calls
const pub = axios.create({ baseURL: BASE });

// authenticated instance — admin token (matches localStorage key set by LoginAdmin.tsx)
const adminApi = axios.create({ baseURL: BASE });
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const postEmployeeAuth = async (endpoint: 'register' | 'login', payload: Record<string, unknown>) => {
  const primaryPath = `/api/auth/employee/${endpoint}`;
  const fallbackPath = `/api/referrals/employee/${endpoint}`;

  try {
    const response = await pub.post(primaryPath, payload);
    return response.data;
  } catch (primaryError) {
    const response = await pub.post(fallbackPath, payload);
    return response.data;
  }
};

// ── RECRUITER AUTH ───────────────────────────────────────────
export const recruiterAuth = {
  login:    (email: string, password: string) =>
    pub.post('/api/auth/recruiter/login', { email, password }).then(r => r.data),
  register: (data: object) =>
    pub.post('/api/auth/recruiter/register', data).then(r => r.data),
};

// ── EMPLOYEE AUTH ────────────────────────────────────────────
export const employeeAuth = {
  register: (data: object) =>
    postEmployeeAuth('register', data as Record<string, unknown>),
  login: (email: string, password: string) =>
    postEmployeeAuth('login', { email, password }),
};

// ── RECRUITER API ────────────────────────────────────────────
export const recruiterAPI = {

  // Dashboard
  // Response: { totalJobs, totalCandidates, pipeline: { in_progress, completed }, stats: { total_applications, interviews_scheduled } }
  getDashboard:      () => api.get('/api/recruiter/dashboard').then(r => r.data),
  getDashboardStats: () => api.get('/api/recruiter/dashboard').then(r => r.data),
  getPipeline:       () => api.get('/api/recruiter/dashboard').then(r => r.data.pipeline ?? {}),

  // Profile
  getProfile:    () => api.get('/api/recruiter/profile').then(r => r.data),
  updateProfile: (data: object) => api.put('/api/recruiter/profile', data).then(r => r.data),

  // Jobs
  // getJobs → returns raw response (used by JobsList which reads .jobs)
  getJobs: (params?: object) =>
    api.get('/api/recruiter/jobs', { params }).then(r => r.data),

  // getAllJobs → returns flat array (used by dropdowns, CandidatesList)
  getAllJobs: () =>
    api.get('/api/recruiter/jobs').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.jobs ?? []);
    }),

  // getPublicJobs → no auth, used by employee referral portal
  getPublicJobs: () =>
    pub.get('/api/jobs/public').then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.jobs ?? []);
    }),

  // getJobsForEmployee → only jobs from the employee's company recruiter
  getJobsForEmployee: (employeeId: string | number) =>
    pub.get('/api/referrals/jobs', { params: { employeeId } }).then(r => {
      const d = r.data;
      return Array.isArray(d) ? d : (d?.jobs ?? []);
    }),

  // getJobById → returns { job: {...} } or raw object
  getJobById: (id: string | number) =>
    api.get(`/api/recruiter/jobs/${id}`).then(r => r.data),

  createJob:     (data: object) => api.post('/api/recruiter/jobs', data).then(r => r.data),
  updateJob:     (id: string | number, data: object) => api.put(`/api/recruiter/jobs/${id}`, data).then(r => r.data),
  deleteJob:     (id: string | number) => api.delete(`/api/recruiter/jobs/${id}`).then(r => r.data),

  // generateLinks → { jobId, applicationLink, applyLink, link, assessmentLink }
  generateLinks: (id: string | number) =>
    api.post(`/api/recruiter/jobs/${id}/assessment-link`).then(r => r.data),

  // Applications
  getApplications: (jobId: string | number, params?: object) =>
    api.get(`/api/recruiter/jobs/${jobId}/applications`, { params }).then(r => r.data),

  // getApplication → { application: { id, name, email, phone, location, experience_years,
  //   expected_salary, job_title, source, assessment_code, status, applied_at, updated_at,
  //   match_score, eligibility_status, matched_skills[], missing_skills[], resume_url,
  //   recruiter_note, parsed_resume: { name, email, phone, summary, skills[], education, projects[] } } }
  getApplication: (id: string | number) =>
    api.get(`/api/recruiter/applications/${id}`).then(r => r.data),

  shortlist:      (id: string | number) => api.patch(`/api/recruiter/applications/${id}/shortlist`).then(r => r.data),
  reject:         (id: string | number) => api.patch(`/api/recruiter/applications/${id}/reject`).then(r => r.data),

  // sendAssessment → { success, emailSent, sentTo }
  sendAssessment: (id: string | number) =>
    api.post(`/api/recruiter/applications/${id}/send-assessment`).then(r => r.data),

  addNote:  (id: string | number, note: string) =>
    api.post(`/api/recruiter/applications/${id}/note`, { note }).then(r => r.data),
  rescreen: (id: string | number, skills?: string[]) =>
    api.post(`/api/recruiter/applications/${id}/rescreen`, skills ? { skills } : {}).then(r => r.data),

  deleteApplication: (id: string | number) =>
    api.delete(`/api/recruiter/applications/${id}`).then(r => r.data),

  bulkDeleteApplications: (ids: (string | number)[]) =>
    api.delete('/api/recruiter/applications/bulk', { data: { ids } }).then(r => r.data),

  // PATCH /api/applications/:id/status — body: { status }
  updateStatus: (id: string | number, status: string) =>
    api.patch(`/api/applications/${id}/status`, { status }).then(r => r.data),

  // GET /api/applications/job/:jobId
  // Response: { applications: [{ id, referral_id, name, email, phone, match_score,
  //   matched_skills[], missing_skills[], experience_years, location, eligibility_status,
  //   resume_url, status, applied_at, parsed_resume: { summary, skills[] } }] }
  getCandidatesByJob: async (jobId: string | number) => {
    const r = await api.get(`/api/recruiter/jobs/${jobId}/applications`);
    const list: any[] = r.data?.applications ?? r.data ?? [];

    return list.map((a: any) => {
      // Backend now returns interview_score, exam_completed, interview_result
      // directly from the DB (same source as Admin module)
      const interviewScore: number | null =
        a.interview_score !== null && a.interview_score !== undefined
          ? parseFloat(String(a.interview_score))
          : null;

      const examCompleted: boolean = a.exam_completed === true;

      const currentStatus = (a.status || '').toLowerCase();
      const shouldPromote =
        examCompleted &&
        !['hired', 'rejected', 'panel_assigned', 'assessed', 'approved', 'shortlisted'].includes(currentStatus);

      return {
        ...a,
        score:           parseFloat(a.match_score ?? 0) || 0,
        appliedAt:       a.applied_at || a.appliedAt,
        experience:      a.experience_years ?? 0,
        interviewScore,
        interviewResult: a.interview_result ?? null,
        exam_completed:  examCompleted,
        status:          shouldPromote ? 'assessed' : a.status,
      };
    });
  },

  // Match resume vs JD (no DB save)
  matchJD: (formData: FormData) =>
    api.post('/api/applications/match-jd', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  // POST /api/recruiter/applications/:id/decision — Hired / Reject with email
  sendDecision: (id: string | number, decision: 'hired' | 'rejected', reason?: string) =>
    api.post(`/api/recruiter/applications/${id}/decision`, { decision, reason }).then(r => r.data),

  getEvaluationReport: (_candidateId: string) => Promise.resolve({}),
  compareCandidates:   (_ids: string[]) => Promise.resolve({ candidates: [], metrics: [], summary: '' }),

  // Resume Pool
  uploadResumePool: (formData: FormData) =>
    api.post('/api/recruiter/resume-pool/bulk', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  getResumePool: () =>
    api.get('/api/recruiter/resume-pool').then(r => r.data),
  matchResumePool: (jobId: string | number) =>
    api.post(`/api/recruiter/resume-pool/match/${jobId}`).then(r => r.data),
  deleteResumePool: (id: string | number) =>
    api.delete(`/api/recruiter/resume-pool/${id}`).then(r => r.data),

  // AI Bulk Resume Pool (Admin)
  bulkUploadResumes: (formData: FormData) =>
    api.post('/api/admin/bulk-resume-pool/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  bulkAssignCandidate: (candidateId: string, jobId: string, resumeFileName: string) =>
    api.post('/api/admin/bulk-resume-pool/assign', { candidateId, jobId, resumeFileName }).then(r => r.data),
  bulkMoveToTalentPool: (candidateId: string, resumeFileName: string) =>
    api.post('/api/admin/bulk-resume-pool/talent-pool', { candidateId, resumeFileName }).then(r => r.data),
  bulkRejectCandidate: (candidateId: string) =>
    api.post('/api/admin/bulk-resume-pool/reject', { candidateId }).then(r => r.data),

  // Panel Assignment
  getActivePanelMembers: () =>
    api.get('/api/panel-members', { params: { status: 'active' } }).then(r => r.data?.data ?? r.data ?? []),

  // Backward compatible: still accepts a single panelMemberId (existing call sites keep working).
  // New optional 3rd overload usage: pass an array via panelMemberIds for multi-assign.
  assignPanel: (applicationId: string | number, panelMemberId: number | number[], jobId?: string | number) => {
    const body = Array.isArray(panelMemberId)
      ? { panelMemberIds: panelMemberId, jobId }
      : { panelMemberId, jobId };
    return api.post(`/api/recruiter/applications/${applicationId}/assign-panel`, body).then(r => r.data);
  },

  getPanelAssignments: (applicationId: string | number) =>
    api.get(`/api/recruiter/applications/${applicationId}/panel-assignments`).then(r => r.data?.assignments ?? []),

  confirmPanelSlot: (
    assignmentId: string | number,
    slot: { date: string; startTime: string; endTime?: string },
    meetingLink?: string,
    interviewInstructions?: string
  ) =>
    api.post(`/api/recruiter/panel-assignments/${assignmentId}/confirm-slot`, {
      slot, meetingLink, interviewInstructions,
    }).then(r => r.data),

  reassignPanel: (assignmentId: string | number, panelMemberId: number) =>
    api.post(`/api/recruiter/panel-assignments/${assignmentId}/reassign`, { panelMemberId }).then(r => r.data),

  completePanelAssignment: (assignmentId: string | number) =>
    api.post(`/api/recruiter/panel-assignments/${assignmentId}/complete`).then(r => r.data),
};

// ── PANEL RESPONSE (public, token-based — no recruiter/employee login) ───────
export const panelResponseAPI = {
  getAssignment: (token: string) =>
    pub.get(`/api/panel-response/${token}`).then(r => r.data?.assignment),

  accept: (token: string, availableSlots: Array<{ date: string; startTime: string; endTime?: string }>) =>
    pub.post(`/api/panel-response/${token}/accept`, { availableSlots }).then(r => r.data),

  reject: (token: string, reason: string) =>
    pub.post(`/api/panel-response/${token}/reject`, { reason }).then(r => r.data),
};

// ── ADMIN: PANEL ASSIGNMENT MONITORING ────────────────────────────────────────
export const panelAssignmentAdminAPI = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    adminApi.get('/api/admin/panel-assignments', { params }).then(r => r.data),

  getAuditTrail: (assignmentId: string | number) =>
    adminApi.get(`/api/admin/panel-assignments/${assignmentId}/audit`).then(r => r.data?.audit ?? []),
};

// ── ADMIN HIRING MONITOR (all jobs + application/hire/reject status) ──
export const adminHiringAPI = {
  getOverview: () => adminApi.get('/api/admin/overview').then(r => r.data),

  getJobCandidates: (jobId: string | number) =>
    adminApi.get(`/api/admin/jobs/${jobId}/candidates`).then(r => r.data?.candidates ?? []),
};

// ── PANEL EVALUATION (public, token-based — no login, mirrors panelResponseAPI) ──
export const panelEvaluationAPI = {
  getByToken: (token: string) =>
    pub.get(`/api/panel-evaluation/${token}`).then(r => r.data),

  markCompleteAndStart: (token: string) =>
    pub.post(`/api/panel-evaluation/${token}/start`).then(r => r.data),

  saveDraft: (token: string, payload: EvaluationDraftPayload) =>
    pub.put(`/api/panel-evaluation/${token}/draft`, payload).then(r => r.data?.evaluation),

  submit: (token: string, payload: EvaluationSubmitPayload) =>
    pub.post(`/api/panel-evaluation/${token}/submit`, payload).then(r => r.data?.evaluation),
};

// ── RECRUITER: PANEL EVALUATIONS (JWT, read-only) ─────────────────────────────
export const recruiterEvaluationAPI = {
  list: (params?: { status?: string; recommendation?: string; page?: number; limit?: number }) =>
    api.get('/api/recruiter/panel-evaluations', { params }).then(r => r.data?.evaluations ?? []),

  getByAssignment: (assignmentId: string | number) =>
    api.get(`/api/recruiter/panel-evaluations/${assignmentId}`).then(r => r.data?.evaluation),
};

// ── ADMIN: PANEL EVALUATIONS (JWT, read-all + unlock) ─────────────────────────
export const adminEvaluationAPI = {
  list: (params?: { status?: string; recommendation?: string; page?: number; limit?: number }) =>
    adminApi.get('/api/admin/panel-evaluations', { params }).then(r => r.data?.evaluations ?? []),

  getStatistics: () =>
    adminApi.get('/api/admin/panel-evaluations/statistics').then(r => r.data?.stats),

  getAuditTrail: (evaluationId: string | number) =>
    adminApi.get(`/api/admin/panel-evaluations/${evaluationId}/audit`).then(r => r.data?.audit ?? []),

  unlock: (evaluationId: string | number, reason: string) =>
    adminApi.post(`/api/admin/panel-evaluations/${evaluationId}/unlock`, { reason }).then(r => r.data?.evaluation),
};

export interface JdApprovalSubmitPayload {
  jobTitle: string;
  department?: string;
  vacancies: number;
  experienceMin: number;
  skills?: string[];
  employmentType: string;
  workMode: string;
  location: string;
  salary: string;
  hiringReason?: string;
  hiringManager?: string;
  expectedJoiningDate?: string;
}

// ── RECRUITER: JD APPROVAL REQUESTS ───────────────────────────────────────────
export const jdApprovalAPI = {
  submit: (data: JdApprovalSubmitPayload) =>
    api.post('/api/jd-approval', data).then(r => r.data?.request),

  listMine: () =>
    api.get('/api/jd-approval/mine').then(r => r.data?.requests ?? []),

  getBadge: () =>
    api.get('/api/jd-approval/badge').then(r => r.data?.unseen ?? 0),

  markSeen: (id: string | number) =>
    api.post(`/api/jd-approval/${id}/seen`).then(r => r.data?.request),

  markAllSeen: () =>
    api.post('/api/jd-approval/seen-all').then(r => r.data),
};

// ── ADMIN: JD APPROVAL REQUESTS ───────────────────────────────────────────────
export const adminJdApprovalAPI = {
  listPending: () =>
    adminApi.get('/api/admin/jd-approval/pending').then(r => r.data?.requests ?? []),

  listAll: (status?: 'all' | 'pending' | 'approved' | 'rejected') =>
    adminApi.get('/api/admin/jd-approval/all', { params: status ? { status } : undefined }).then(r => r.data?.requests ?? []),

  getBadge: () =>
    adminApi.get('/api/admin/jd-approval/badge').then(r => r.data?.pending ?? 0),

  getDetail: (id: string | number) =>
    adminApi.get(`/api/admin/jd-approval/${id}`).then(r => r.data?.request),

  approve: (id: string | number) =>
    adminApi.post(`/api/admin/jd-approval/${id}/approve`).then(r => r.data?.request),

  reject: (id: string | number, reason?: string) =>
    adminApi.post(`/api/admin/jd-approval/${id}/reject`, { reason }).then(r => r.data?.request),
};

// ── REFERRAL API ─────────────────────────────────────────────
export const referralAPI = {

  // Employee Auth — /api/referrals/employee/*
  employeeRegister: (data: object) =>
    postEmployeeAuth('register', data as Record<string, unknown>),
  employeeLogin: (email: string, password: string) =>
    postEmployeeAuth('login', { email, password }),

  // Employee: submit referral (employee token)
  refer: (data: object) =>
    empApi.post('/api/referrals', data).then(r => r.data),

  // Employee: own referrals (employee token)
  getMyReferrals: (_employeeId?: string | number) =>
    empApi.get('/api/referrals/mine').then(r => r.data),

  // Public: track by code
  trackByCode: (code: string) =>
    pub.get(`/api/referrals/status/${code}`).then(r => r.data),

  // Public: get by id (tracking modal)
  getById: (id: number | string) =>
    empApi.get(`/api/referrals/${id}`).then(r => r.data),

  // Recruiter: all referrals filtered by recruiter's JDs (recruiter token)
  // Backend must JOIN jobs ON jobs.recruiter_id = decoded_recruiter_id from JWT
  getAll: (params?: object) =>
    api.get('/api/referrals', { params }).then(r => r.data),

  // Recruiter: stats
  getStats: (_recruiterId?: string | number | null) =>
    api.get('/api/referrals/stats').then(r => r.data),

  // Recruiter: top referrers
  getTopReferrers: (_recruiterId?: string | number | null, limit = 5) =>
    api.get('/api/referrals/top-referrers', { params: { limit } }).then(r => r.data),

  // Recruiter: applications for AI panel
  getApplicationsByJob: (jobId: string | number) =>
    api.get(`/api/applications/job/${jobId}`).then(r => r.data),

  // Recruiter: send assessment
  sendAssessment: (applicationId: string | number) =>
    api.post(`/api/recruiter/applications/${applicationId}/send-assessment`).then(r => r.data),

  // Recruiter: update referral status
  updateStatus: (id: number | string, _recruiterId: string | number | null, status: string) =>
    api.patch(`/api/referrals/${id}/status`, { status }).then(r => r.data),

  // Recruiter: bulk update status
  bulkUpdateStatus: (_recruiterId: string | number | null, ids: number[], status: string) =>
    api.patch('/api/referrals/bulk/status', { ids, status }).then(r => r.data),

  deleteReferral: (id: string | number) =>
    api.delete(`/api/referrals/${id}`).then(r => r.data),

  bulkDeleteReferrals: (ids: (string | number)[]) =>
    api.delete('/api/referrals/bulk', { data: { ids } }).then(r => r.data),

  // Recruiter: analytics
  getAnalytics: () =>
    api.get('/api/admin/referrals/analytics').then(r => r.data),

  // Recruiter: AI analyze resume
  analyzeResume: (id: string | number, file?: File) => {
    const form = new FormData();
    if (file) form.append('resume', file);
    return api.post(`/api/referrals/${id}/analyze`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  // Recruiter: submit review
  submitReview: (id: string | number, data: { status: string; review_notes: string; next_steps: string; reviewer_name: string }) =>
    api.put(`/api/admin/referrals/${id}/review`, data).then(r => r.data),
};

// ── APPLICATIONS (public apply) ──────────────────────────────
export const applicationAPI = {
  // POST /api/applications/apply
  // Body FormData: { resume(file), jobId, name, email, phone, referralId, employeeId }
  // Response: { success, application: { id, match_score, matched_skills[], missing_skills[] } }
  apply: (formData: FormData) =>
    pub.post('/api/applications/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),

  matchJD: (formData: FormData) =>
    pub.post('/api/applications/match-jd', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data),
};

export default recruiterAPI;
