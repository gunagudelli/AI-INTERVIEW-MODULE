import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const candidateAPI = {
  getDashboardStats: async (userId: string) => {
    const response = await api.get(`/api/candidate/${userId}/dashboard`);
    return response.data;
  },

  getProfile: async (userId: string) => {
    const response = await api.get(`/api/candidate/${userId}/profile`);
    return response.data;
  },

  updateProfile: async (userId: string, data: any) => {
    const response = await api.put(`/api/candidate/${userId}/profile`, data);
    return response.data;
  },

  uploadResume: async (userId: string, formData: FormData) => {
    const response = await api.post(`/api/candidate/${userId}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getInterviewHistory: async (userId: string, page: number = 1, filters: any = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...filters,
    });
    const response = await api.get(`/api/candidate/${userId}/interviews?${params}`);
    return response.data;
  },

  getInterviewDetails: async (userId: string, sessionId: string) => {
    const response = await api.get(`/api/candidate/${userId}/interviews/${sessionId}`);
    return response.data;
  },

  getUpcomingInterviews: async (userId: string) => {
    const response = await api.get(`/api/candidate/${userId}/upcoming`);
    return response.data;
  },

  downloadScorecard: async (userId: string, sessionId: string) => {
    const response = await api.get(`/api/candidate/${userId}/scorecard/${sessionId}`, {
      responseType: 'blob',
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `scorecard_${sessionId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },

  getRecentActivity: async (userId: string) => {
    const response = await api.get(`/api/candidate/${userId}/activity`);
    return response.data;
  },

  scheduleInterview: async (userId: string, data: any) => {
    const response = await api.post(`/api/candidate/${userId}/schedule`, data);
    return response.data;
  },

  cancelInterview: async (userId: string, sessionId: string) => {
    const response = await api.post(`/api/candidate/${userId}/cancel/${sessionId}`);
    return response.data;
  },

  getSkillsAssessment: async (userId: string) => {
    const response = await api.get(`/api/candidate/${userId}/skills`);
    return response.data;
  },

  updateSkills: async (userId: string, skills: string[]) => {
    const response = await api.put(`/api/candidate/${userId}/skills`, { skills });
    return response.data;
  },
};

export default candidateAPI;
