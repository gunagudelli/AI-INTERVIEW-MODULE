import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import recruiterAPI from '../../services/recruiterAPI';

interface Evaluation {
  candidateId: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: 'hire' | 'reject' | 'maybe';
  evaluatedBy: string;
  evaluatedAt: string;
}

interface ComparisonData {
  candidates: any[];
  metrics: string[];
  summary: string;
}

interface EvaluationState {
  evaluations: { [candidateId: string]: Evaluation };
  comparisonData: ComparisonData | null;
  selectedCandidates: string[];
  loading: boolean;
  error: string | null;
}

const initialState: EvaluationState = {
  evaluations: {},
  comparisonData: null,
  selectedCandidates: [],
  loading: false,
  error: null,
};

// Async thunks
export const evaluateCandidate = createAsyncThunk(
  'evaluation/evaluateCandidate',
  async ({ candidateId, evaluation }: { candidateId: string; evaluation: any }) => {
    // evaluateCandidate not in API — store evaluation locally
    const response = evaluation;
    return { candidateId, evaluation: response };
  }
);

export const fetchEvaluationReport = createAsyncThunk(
  'evaluation/fetchReport',
  async (candidateId: string) => {
    const response = await recruiterAPI.getEvaluationReport(candidateId);
    return { candidateId, report: response as Evaluation };
  }
);

export const compareCandidates = createAsyncThunk(
  'evaluation/compareCandidates',
  async (candidateIds: string[]) => {
    const response = await recruiterAPI.compareCandidates(candidateIds);
    return response as { candidates: any[]; metrics: string[]; summary: string };
  }
);

const evaluationSlice = createSlice({
  name: 'evaluation',
  initialState,
  reducers: {
    addSelectedCandidate: (state, action: PayloadAction<string>) => {
      if (!state.selectedCandidates.includes(action.payload)) {
        state.selectedCandidates.push(action.payload);
      }
    },
    removeSelectedCandidate: (state, action: PayloadAction<string>) => {
      state.selectedCandidates = state.selectedCandidates.filter(id => id !== action.payload);
    },
    clearSelectedCandidates: (state) => {
      state.selectedCandidates = [];
    },
    setSelectedCandidates: (state, action: PayloadAction<string[]>) => {
      state.selectedCandidates = action.payload;
    },
    clearComparisonData: (state) => {
      state.comparisonData = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Evaluate candidate
    builder.addCase(evaluateCandidate.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(evaluateCandidate.fulfilled, (state, action) => {
      state.loading = false;
      state.evaluations[action.payload.candidateId] = action.payload.evaluation;
    });
    builder.addCase(evaluateCandidate.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to evaluate candidate';
    });

    // Fetch evaluation report
    builder.addCase(fetchEvaluationReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchEvaluationReport.fulfilled, (state, action) => {
      state.loading = false;
      state.evaluations[action.payload.candidateId] = action.payload.report;
    });
    builder.addCase(fetchEvaluationReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to fetch evaluation report';
    });

    // Compare candidates
    builder.addCase(compareCandidates.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(compareCandidates.fulfilled, (state, action) => {
      state.loading = false;
      state.comparisonData = {
        candidates: action.payload?.candidates ?? [],
        metrics: action.payload?.metrics ?? [],
        summary: action.payload?.summary ?? '',
      };
    });
    builder.addCase(compareCandidates.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Failed to compare candidates';
    });
  },
});

export const {
  addSelectedCandidate,
  removeSelectedCandidate,
  clearSelectedCandidates,
  setSelectedCandidates,
  clearComparisonData,
  clearError,
} = evaluationSlice.actions;

export default evaluationSlice.reducer;
