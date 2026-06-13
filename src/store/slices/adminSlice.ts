import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'employee' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

interface InterviewConfig {
  round: number;
  label: string;
  questions: number;
  time_limit: number;
  pass_percentage: number;
}

interface AdminState {
  users: User[];
  candidates: any[];
  attempts: any[];
  interviewConfig: InterviewConfig[];
  analytics: {
    totalUsers: number;
    totalCandidates: number;
    totalInterviews: number;
    activeInterviews: number;
  };
  liveMonitoring: any[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  users: [],
  candidates: [],
  attempts: [],
  interviewConfig: [],
  analytics: {
    totalUsers: 0,
    totalCandidates: 0,
    totalInterviews: 0,
    activeInterviews: 0,
  },
  liveMonitoring: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    deleteUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    setCandidates: (state, action: PayloadAction<any[]>) => {
      state.candidates = action.payload;
    },
    setAttempts: (state, action: PayloadAction<any[]>) => {
      state.attempts = action.payload;
    },
    setInterviewConfig: (state, action: PayloadAction<InterviewConfig[]>) => {
      state.interviewConfig = action.payload;
    },
    updateInterviewConfig: (state, action: PayloadAction<InterviewConfig>) => {
      const index = state.interviewConfig.findIndex(c => c.round === action.payload.round);
      if (index !== -1) {
        state.interviewConfig[index] = action.payload;
      }
    },
    setAnalytics: (state, action: PayloadAction<AdminState['analytics']>) => {
      state.analytics = action.payload;
    },
    setLiveMonitoring: (state, action: PayloadAction<any[]>) => {
      state.liveMonitoring = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setUsers,
  addUser,
  updateUser,
  deleteUser,
  setCandidates,
  setAttempts,
  setInterviewConfig,
  updateInterviewConfig,
  setAnalytics,
  setLiveMonitoring,
  setLoading,
  setError,
} = adminSlice.actions;

export default adminSlice.reducer;
