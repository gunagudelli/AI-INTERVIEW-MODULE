import axios from 'axios';

import BASE_URL from '../Config';
const API_BASE_URL = BASE_URL;

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

export const adminAPI = {
  getUsers: async (role?: string) => {
    const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
    const response = await api.get(url);
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get(`/api/admin/users/${userId}`);
    return response.data;
  },

  createUser: async (userData: any) => {
    const response = await api.post('/api/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId: string, userData: any) => {
    const response = await api.put(`/api/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  suspendUser: async (userId: string) => {
    const response = await api.post(`/api/admin/users/${userId}/suspend`);
    return response.data;
  },

  activateUser: async (userId: string) => {
    const response = await api.post(`/api/admin/users/${userId}/activate`);
    return response.data;
  },

  getCandidates: async () => {
    const response = await api.get('/api/admin/candidates');
    return response.data;
  },

  getCandidateById: async (candidateId: string) => {
    const response = await api.get(`/api/admin/candidate/${candidateId}`);
    return response.data;
  },

  getAttempts: async (candidateId?: string) => {
    const url = candidateId ? `/api/admin/attempts?candidateId=${candidateId}` : '/api/admin/attempts';
    const response = await api.get(url);
    return response.data;
  },

  getInterviewConfig: async () => {
    const response = await api.get('/api/admin/interview-config');
    return response.data;
  },

  updateInterviewConfig: async (config: any) => {
    const response = await api.put('/api/admin/interview-config', config);
    return response.data;
  },

  getAnalytics: async (startDate?: string, endDate?: string) => {
    let url = '/api/admin/analytics';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getCandidateAnalytics: async () => {
    const response = await api.get('/api/admin/analytics/candidates');
    return response.data;
  },

  getInterviewAnalytics: async () => {
    const response = await api.get('/api/admin/analytics/interviews');
    return response.data;
  },

  getLiveMonitoring: async () => {
    const response = await api.get('/api/admin/live-monitoring');
    return response.data;
  },

  getSystemSettings: async () => {
    const response = await api.get('/api/admin/settings');
    return response.data;
  },

  updateSystemSettings: async (settings: any) => {
    const response = await api.put('/api/admin/settings', settings);
    return response.data;
  },

  exportData: async (type: 'users' | 'candidates' | 'attempts', format: 'csv' | 'excel') => {
    const response = await api.get(`/api/admin/export/${type}?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/api/admin/dashboard');
    return response.data;
  },
};

export default adminAPI;
