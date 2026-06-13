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

export const notificationAPI = {
  getNotifications: async (userId: string) => {
    const response = await api.get(`/api/notifications/${userId}`);
    return response.data;
  },

  markAsRead: async (userId: string, notificationId: string) => {
    const response = await api.put(`/api/notifications/${userId}/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (userId: string) => {
    const response = await api.put(`/api/notifications/${userId}/read-all`);
    return response.data;
  },

  deleteNotification: async (userId: string, notificationId: string) => {
    const response = await api.delete(`/api/notifications/${userId}/${notificationId}`);
    return response.data;
  },

  getUnreadCount: async (userId: string) => {
    const response = await api.get(`/api/notifications/${userId}/unread-count`);
    return response.data;
  },
};

export default notificationAPI;
