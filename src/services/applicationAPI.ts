import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_RECRUITER_API_URL || process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const applicationAPI = {
  // POST /api/applications/apply — multipart/form-data
  apply: async (formData: FormData) => {
    const response = await api.post('/api/applications/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // GET /api/applications/job/:jobId?minScore=70
  getByJob: async (jobId: string, filters?: { minScore?: number; eligibility?: string }) => {
    const params = new URLSearchParams();
    if (filters?.minScore) params.append('minScore', String(filters.minScore));
    if (filters?.eligibility) params.append('eligibility', filters.eligibility);
    const qs = params.toString();
    const response = await api.get(`/api/applications/job/${jobId}${qs ? '?' + qs : ''}`);
    const data = response.data;
    const list = Array.isArray(data) ? data : (data?.applications ?? []);
    // Normalize postgres snake_case → camelCase
    return list.map((a: any) => ({
      ...a,
      matchScore:   parseFloat(a.match_score   ?? a.matchScore   ?? 0) || 0,
      eligibility:  a.eligibility_status        || a.eligibility  || 'not_eligible',
      appliedAt:    a.applied_at                || a.appliedAt    || a.created_at,
      resumeUrl:    a.resume_url                || a.resumeUrl    || null,
      experienceYears: a.experience_years       ?? a.experienceYears ?? 0,
      matchedSkills: a.matched_skills           || a.matchedSkills || [],
      missingSkills: a.missing_skills           || a.missingSkills || [],
    }));
  },

  // GET /api/applications/:id
  getById: async (id: string) => {
    const response = await api.get(`/api/applications/${id}`);
    const a = response.data;
    const raw = parseFloat(a.match_score ?? a.matchScore ?? 0);
    return {
      ...a,
      matchScore:      isNaN(raw) ? 0 : raw,
      eligibility:     a.eligibility_status || a.eligibility || 'not_eligible',
      appliedAt:       a.applied_at || a.appliedAt || a.created_at,
      resumeUrl:       a.resume_url || a.resumeUrl || null,
      experienceYears: a.experience_years ?? a.experienceYears ?? 0,
      matchedSkills:   a.matched_skills || a.matchedSkills || [],
      missingSkills:   a.missing_skills || a.missingSkills || [],
      aiSummary:       a.aiSummary || a.ai_summary || '',
    };
  },

  // PATCH /api/applications/:id/status
  updateStatus: async (id: string, status: string) => {
    const response = await api.patch(`/api/applications/${id}/status`, { status });
    return response.data;
  },

  // POST /api/applications/:id/send-assessment
  sendAssessment: async (id: string) => {
    const response = await api.post(`/api/applications/${id}/send-assessment`);
    return response.data;
  },

  // GET /api/jobs/public (no auth — candidate job list)
  getPublicJobs: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/public`);
    const data = response.data;
    return Array.isArray(data) ? data : (data?.jobs ?? []);
  },

  // GET /api/recruiter/jobs/:id
  getJobByApplyToken: async (token: string) => {
    const response = await api.get(`/api/applications/job-by-token/${token}`);
    return response.data;
  },

  // POST /api/applications/parse-resume — extracts name/email/phone/experience from resume
  parseResume: async (file: File, jobId?: string) => {
    const fd = new FormData();
    fd.append('resume', file);
    if (jobId) fd.append('jobId', jobId);
    const response = await api.post('/api/applications/parse-resume', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default applicationAPI;
