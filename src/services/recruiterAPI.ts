import axios from 'axios';

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
    pub.post('/api/auth/employee/register', data).then(r => r.data),
  login: (email: string, password: string) =>
    pub.post('/api/auth/employee/login', { email, password }).then(r => r.data),
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
    return list.map((a: any) => ({
      ...a,
      score:           parseFloat(a.match_score ?? a.matchScore ?? 0) || 0,
      appliedAt:       a.applied_at || a.appliedAt,
      experience:      a.experience_years ?? a.experienceYears ?? 0,
      interviewResult: a.interview_result ?? a.interviewResult ?? null,
      interviewScore:  a.interview_score  ?? a.interviewScore  ?? null,
    }));
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
    api.post('/api/recruiter/resume-pool', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
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
};

// ── REFERRAL API ─────────────────────────────────────────────
export const referralAPI = {

  // Employee Auth — /api/referrals/employee/*
  employeeRegister: (data: object) =>
    pub.post('/api/referrals/employee/register', data).then(r => r.data),
  employeeLogin: (email: string, password: string) =>
    pub.post('/api/referrals/employee/login', { email, password }).then(r => r.data),

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
