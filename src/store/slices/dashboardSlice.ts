import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import recruiterAPI from '../../services/recruiterAPI';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  totalApplications: number;
  averageScore: number;
  conversionRate: number;
  timeToHire: number;
  topPerformingJobs: Array<{
    id: string;
    title: string;
    applicants: number;
    hires: number;
  }>;
  applicationsByMonth: Array<{
    month: string;
    count: number;
  }>;
  candidatesByStatus: {
    [key: string]: number;
  };
  sourceBreakdown: Array<{
    source: string;
    count: number;
  }>;
}

interface PipelineStats {
  applied: number;
  screening: number;
  interview: number;
  shortlisted: number;
  rejected: number;
  hired: number;
}

interface DashboardState {
  stats: DashboardStats | null;
  pipeline: PipelineStats;
  dateRange: string;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: DashboardState = {
  stats: null,
  pipeline: {
    applied: 0,
    screening: 0,
    interview: 0,
    shortlisted: 0,
    rejected: 0,
    hired: 0,
  },
  dateRange: '30',
  loading: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (dateRange?: string) => {
    const response = await recruiterAPI.getDashboardStats();
    return response;
  }
);

export const fetchPipelineStats = createAsyncThunk(
  'dashboard/fetchPipeline',
  async (jobId?: string) => {
    const response = await recruiterAPI.getPipeline();
    return response;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<string>) => {
      state.dateRange = action.payload;
    },
    updatePipelineStats: (state, action: PayloadAction<PipelineStats>) => {
      state.pipeline = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetDashboard: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch dashboard stats
    builder.addCase(fetchDashboardStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDashboardStats.fulfilled, (state, action) => {
      state.loading = false;
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    });
    builder.addCase(fetchDashboardStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch dashboard stats';
    });

    // Fetch pipeline stats
    builder.addCase(fetchPipelineStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPipelineStats.fulfilled, (state, action) => {
      state.loading = false;
      state.pipeline = action.payload;
    });
    builder.addCase(fetchPipelineStats.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch pipeline stats';
    });
  },
});

export const { setDateRange, updatePipelineStats, clearError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
