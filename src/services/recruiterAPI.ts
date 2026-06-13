import axios from 'axios';

const BASE = process.env.REACT_APP_RECRUITER_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

// authenticated instance — recruiter token
const api = axios.create({ baseURL: BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('recruiter_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// no-auth instance — employee / public calls
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

  // POST /api/referrals
  // Body: { employeeId, candidateName, candidateEmail, candidatePhone, jobId, notes, relationship }
  // Response: { success, referral: { id, referral_code, job_title } }
  refer: (data: object) =>
    pub.post('/api/referrals', data).then(r => r.data),

  // GET /api/referrals/mine?employeeId=
  // Response: { success, referrals: [{ id, candidate_name, candidate_email, candidate_phone,
  //   job_title, job_id, status, referral_code, created_at, updated_at, notes,
  //   review_notes, next_steps }] }
  getMyReferrals: (employeeId: string | number) =>
    pub.get('/api/referrals/mine', { params: { employeeId } }).then(r => r.data),

  // GET /api/referrals/status/:referral_code
  // Response: { success, referral: { candidate_name, job_title, referral_code, status,
  //   review_notes, next_steps, expected_bonus,
  //   status_history: [{ status, date, note }] } }
  trackByCode: (code: string) =>
    pub.get(`/api/referrals/status/${code}`).then(r => r.data),

  // GET /api/referrals?status=&search=&page=&limit=&recruiterId=
  // Response: { success, referrals: [...], total }
  getAll: (params?: object) =>
    pub.get('/api/referrals', { params }).then(r => r.data),

  getById: (id: number | string) =>
    pub.get(`/api/referrals/${id}`).then(r => r.data),

  // GET /api/referrals/stats?recruiterId=
  // Response: { success, stats: { total, pending, approved, rejected, hired, unique_referrers } }
  getStats: (recruiterId?: string | number | null) =>
    pub.get('/api/referrals/stats', { params: { recruiterId } }).then(r => r.data),

  // GET /api/referrals/top-referrers?recruiterId=&limit=5
  // Response: { success, topReferrers: [{ id, name, email, department, total_referrals, hired_count }] }
  getTopReferrers: (recruiterId?: string | number | null, limit = 5) =>
    pub.get('/api/referrals/top-referrers', { params: { recruiterId, limit } }).then(r => r.data),

  // GET /api/applications/job/:jobId — for AI panel
  getApplicationsByJob: (jobId: string | number) =>
    pub.get(`/api/applications/job/${jobId}`).then(r => r.data),

  // POST /api/recruiter/applications/:id/send-assessment
  sendAssessment: (applicationId: string | number) =>
    pub.post(`/api/recruiter/applications/${applicationId}/send-assessment`).then(r => r.data),

  // PATCH /api/referrals/:id/status — body: { status }
  updateStatus: (id: number | string, _recruiterId: string | number | null, status: string) =>
    pub.patch(`/api/referrals/${id}/status`, { status }).then(r => r.data),

  // PATCH /api/referrals/bulk/status — body: { ids[], status }
  bulkUpdateStatus: (_recruiterId: string | number | null, ids: number[], status: string) =>
    pub.patch('/api/referrals/bulk/status', { ids, status }).then(r => r.data),

  // GET /api/admin/referrals/analytics
  // Response: { success, analytics: { overview: { total_referrals, approval_rate, hire_rate,
  //   average_review_time, total_bonus_paid },
  //   top_performers: [{ employee_name, referrals, hires, bonus_earned }],
  //   department_breakdown: { "Engineering": 5 } } }
  getAnalytics: () =>
    pub.get('/api/admin/referrals/analytics').then(r => r.data),

  // POST /api/referrals/:id/analyze — upload resume → AI score → auto approve/reject
  // multipart/form-data: resume (file, optional if already on record)
  // Response: { success, aiScore, status, decision, threshold, matchedSkills[], missingSkills[], eligibility, reasoning }
  analyzeResume: (id: string | number, file?: File) => {
    const form = new FormData();
    if (file) form.append('resume', file);
    return pub.post(`/api/referrals/${id}/analyze`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  // PUT /api/admin/referrals/:id/review
  // Body: { status, review_notes, next_steps, reviewer_name }
  submitReview: (id: string | number, data: { status: string; review_notes: string; next_steps: string; reviewer_name: string }) =>
    pub.put(`/api/admin/referrals/${id}/review`, data).then(r => r.data),
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
