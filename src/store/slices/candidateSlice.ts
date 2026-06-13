import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import candidateAPI from '../../services/candidateAPI';

interface Interview {
  id: string;
  sessionId: string;
  jobTitle: string;
  company: string;
  date: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  score: number;
  rounds: {
    round1: number;
    round2: number;
    round3: number;
    round4: number;
    round5: number;
  };
  totalScore: number;
  result: 'pass' | 'fail' | 'pending';
}

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  resumeUrl?: string;
  resumeScore?: number;
  atsScore?: number;
  skills: string[];
  experience: number;
  education: string;
  location: string;
  avatar?: string;
}

interface DashboardStats {
  totalInterviews: number;
  passedInterviews: number;
  failedInterviews: number;
  averageScore: number;
  resumeScore: number;
  atsScore: number;
  upcomingInterviews: number;
}

interface CandidateState {
  profile: Profile | null;
  dashboardStats: DashboardStats | null;
  interviews: Interview[];
  upcomingInterviews: Interview[];
  recentActivity: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  filters: {
    status: string;
    dateFrom: string;
    dateTo: string;
    searchQuery: string;
  };
}

const initialState: CandidateState = {
  profile: null,
  dashboardStats: null,
  interviews: [],
  upcomingInterviews: [],
  recentActivity: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  filters: {
    status: 'all',
    dateFrom: '',
    dateTo: '',
    searchQuery: '',
  },
};

export const fetchDashboardStats = createAsyncThunk(
  'candidate/fetchDashboardStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getDashboardStats(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'candidate/fetchProfile',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getProfile(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'candidate/updateProfile',
  async ({ userId, data }: { userId: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.updateProfile(userId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const fetchInterviewHistory = createAsyncThunk(
  'candidate/fetchInterviewHistory',
  async ({ userId, page, filters }: { userId: string; page: number; filters: any }, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getInterviewHistory(userId, page, filters);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch interview history');
    }
  }
);

export const fetchUpcomingInterviews = createAsyncThunk(
  'candidate/fetchUpcomingInterviews',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.getUpcomingInterviews(userId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch upcoming interviews');
    }
  }
);

export const downloadScorecard = createAsyncThunk(
  'candidate/downloadScorecard',
  async ({ userId, sessionId }: { userId: string; sessionId: string }, { rejectWithValue }) => {
    try {
      const response = await candidateAPI.downloadScorecard(userId, sessionId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to download scorecard');
    }
  }
);

const candidateSlice = createSlice({
  name: 'candidate',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<any>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Profile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Interview History
      .addCase(fetchInterviewHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInterviewHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.interviews = action.payload.interviews;
        state.totalPages = action.payload.totalPages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchInterviewHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Upcoming Interviews
      .addCase(fetchUpcomingInterviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUpcomingInterviews.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingInterviews = action.payload;
      })
      .addCase(fetchUpcomingInterviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, setCurrentPage, clearError } = candidateSlice.actions;
export default candidateSlice.reducer;
