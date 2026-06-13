import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'active' | 'inactive' | 'closed';
  createdAt: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'screened' | 'shortlisted' | 'interview_sent' | 'rejected';
  score: number;
  appliedDate: string;
}

interface RecruiterState {
  jobs: Job[];
  candidates: Candidate[];
  selectedJob: Job | null;
  selectedCandidate: Candidate | null;
  pipeline: {
    applied: number;
    pending: number;
    screened: number;
    shortlisted: number;
    interview_sent: number;
    rejected: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: RecruiterState = {
  jobs: [],
  candidates: [],
  selectedJob: null,
  selectedCandidate: null,
  pipeline: {
    applied: 0,
    pending: 0,
    screened: 0,
    shortlisted: 0,
    interview_sent: 0,
    rejected: 0,
  },
  loading: false,
  error: null,
};

const recruiterSlice = createSlice({
  name: 'recruiter',
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload;
    },
    addJob: (state, action: PayloadAction<Job>) => {
      state.jobs.push(action.payload);
    },
    updateJob: (state, action: PayloadAction<Job>) => {
      const index = state.jobs.findIndex(j => j.id === action.payload.id);
      if (index !== -1) {
        state.jobs[index] = action.payload;
      }
    },
    deleteJob: (state, action: PayloadAction<string>) => {
      state.jobs = state.jobs.filter(j => j.id !== action.payload);
    },
    setSelectedJob: (state, action: PayloadAction<Job | null>) => {
      state.selectedJob = action.payload;
    },
    setCandidates: (state, action: PayloadAction<Candidate[]>) => {
      state.candidates = action.payload;
    },
    updateCandidateStatus: (state, action: PayloadAction<{ id: string; status: Candidate['status'] }>) => {
      const candidate = state.candidates.find(c => c.id === action.payload.id);
      if (candidate) {
        candidate.status = action.payload.status;
      }
    },
    setSelectedCandidate: (state, action: PayloadAction<Candidate | null>) => {
      state.selectedCandidate = action.payload;
    },
    updatePipeline: (state, action: PayloadAction<RecruiterState['pipeline']>) => {
      state.pipeline = action.payload;
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
  setJobs,
  addJob,
  updateJob,
  deleteJob,
  setSelectedJob,
  setCandidates,
  updateCandidateStatus,
  setSelectedCandidate,
  updatePipeline,
  setLoading,
  setError,
} = recruiterSlice.actions;

export default recruiterSlice.reducer;
