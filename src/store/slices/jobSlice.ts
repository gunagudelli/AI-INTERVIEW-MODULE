import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import recruiterAPI from '../../services/recruiterAPI';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
  location: string;
  type: string;
  experience: string;
  salary: string;
  status: 'active' | 'inactive' | 'closed';
  createdAt: string;
  updatedAt: string;
  applicantsCount?: number;
}

interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  filters: {
    status: string;
    search: string;
  };
  loading: boolean;
  error: string | null;
}

const initialState: JobState = {
  jobs: [],
  selectedJob: null,
  filters: {
    status: 'all',
    search: '',
  },
  loading: false,
  error: null,
};

// Async thunks
export const fetchJobs = createAsyncThunk('job/fetchJobs', async () => {
  const response = await recruiterAPI.getAllJobs();
  return response;
});

export const fetchJobById = createAsyncThunk('job/fetchJobById', async (jobId: string) => {
  const response = await recruiterAPI.getJobById(jobId);
  return response;
});

export const createJob = createAsyncThunk('job/createJob', async (jobData: any) => {
  const response = await recruiterAPI.createJob(jobData);
  return response;
});

export const updateJob = createAsyncThunk(
  'job/updateJob',
  async ({ jobId, jobData }: { jobId: string; jobData: any }) => {
    const response = await recruiterAPI.updateJob(jobId, jobData);
    return response;
  }
);

export const deleteJob = createAsyncThunk('job/deleteJob', async (jobId: string) => {
  await recruiterAPI.deleteJob(jobId);
  return jobId;
});

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<JobState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch jobs
    builder.addCase(fetchJobs.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchJobs.fulfilled, (state, action) => {
      state.loading = false;
      state.jobs = action.payload;
    });
    builder.addCase(fetchJobs.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch jobs';
    });

    // Fetch job by ID
    builder.addCase(fetchJobById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchJobById.fulfilled, (state, action) => {
      state.loading = false;
      state.selectedJob = action.payload;
    });
    builder.addCase(fetchJobById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch job';
    });

    // Create job
    builder.addCase(createJob.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createJob.fulfilled, (state, action) => {
      state.loading = false;
      state.jobs.push(action.payload);
    });
    builder.addCase(createJob.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to create job';
    });

    // Update job
    builder.addCase(updateJob.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateJob.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.jobs.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
      if (state.selectedJob?.id === action.payload.id) {
        state.selectedJob = action.payload;
      }
    });
    builder.addCase(updateJob.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to update job';
    });

    // Delete job
    builder.addCase(deleteJob.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteJob.fulfilled, (state, action) => {
      state.loading = false;
      state.jobs = state.jobs.filter(j => j.id !== action.payload);
      if (state.selectedJob?.id === action.payload) {
        state.selectedJob = null;
      }
    });
    builder.addCase(deleteJob.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to delete job';
    });
  },
});

export const { setFilters, clearFilters, setSelectedJob, clearError } = jobSlice.actions;
export default jobSlice.reducer;
