import axios from 'axios';
import { Candidate } from './types';
import BASE_URL from '../../Config';
const API_BASE = `${BASE_URL}/api/admin`;

export const candidateApi = {
  getCandidates: async (): Promise<Candidate[]> => {
    const { data } = await axios.get(`${API_BASE}/candidates`);
    return data;
  },

  getCandidateById: async (userId: string): Promise<Candidate> => {
    const [candidateRes, imagesRes] = await Promise.allSettled([
      axios.get(`${API_BASE}/candidate/${userId}`),
      axios.get(`${API_BASE}/candidate/${userId}/images`),
    ]);
    const candidate = candidateRes.status === 'fulfilled' ? candidateRes.value.data : {};
    if (imagesRes.status === 'fulfilled') {
      const { examImages = [], proctoringSnapshots = [] } = imagesRes.value.data;
      candidate.examImages = examImages;
      candidate.proctoringSnapshots = proctoringSnapshots;
    }
    return candidate;
  },

  getAttemptLimit: async (): Promise<{ maxAttempts: number }> => {
    const { data } = await axios.get(`${API_BASE}/attempts/limit`);
    return data;
  },

  updateAttemptLimit: async (maxAttempts: number): Promise<{ success: boolean; maxAttempts: number }> => {
    const { data } = await axios.post(`${API_BASE}/attempts/limit`, { maxAttempts });
    return data;
  },

  getUserAttempts: async (userId: string) => {
    const { data } = await axios.get(`${API_BASE}/attempts/${userId}`);
    return data;
  },

  // Interview Config - Round Settings
  getInterviewConfig: async () => {
    const { data } = await axios.get(`${API_BASE}/interview-config`);
    return data;
  },

  updateInterviewConfig: async (rounds: Array<{round: number, questions: number, time_limit: number, label: string}>) => {
    const { data } = await axios.post(`${API_BASE}/interview-config`, { rounds });
    return data;
  }
};
