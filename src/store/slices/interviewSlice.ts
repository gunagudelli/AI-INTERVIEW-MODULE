import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface InterviewState {
  currentRound: number | null;
  currentQuestion: number;
  totalQuestions: number;
  sessionId: string | null;
  candidateId: string | null;
  sessionStatsId: string | null;
  parsedResume: any | null;
  capturedImage: string | null;
  isActive: boolean;
  timeLeft: number;
  violations: string[];
  score: number;
  status: 'idle' | 'in-progress' | 'completed' | 'failed';
}

const initialState: InterviewState = {
  currentRound: null,
  currentQuestion: 0,
  totalQuestions: 0,
  sessionId: null,
  candidateId: null,
  sessionStatsId: null,
  parsedResume: null,
  capturedImage: null,
  isActive: false,
  timeLeft: 0,
  violations: [],
  score: 0,
  status: 'idle',
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    startInterview: (state, action: PayloadAction<{ sessionId: string; candidateId: string }>) => {
      state.sessionId = action.payload.sessionId;
      state.candidateId = action.payload.candidateId;
      state.isActive = true;
      state.status = 'in-progress';
    },
    setRound: (state, action: PayloadAction<{ round: number; totalQuestions: number }>) => {
      state.currentRound = action.payload.round;
      state.totalQuestions = action.payload.totalQuestions;
      state.currentQuestion = 1;
    },
    nextQuestion: (state) => {
      state.currentQuestion += 1;
    },
    setParsedResume: (state, action: PayloadAction<any>) => {
      state.parsedResume = action.payload;
    },
    setCapturedImage: (state, action: PayloadAction<string>) => {
      state.capturedImage = action.payload;
    },
    setSessionStatsId: (state, action: PayloadAction<string>) => {
      state.sessionStatsId = action.payload;
    },
    setTimeLeft: (state, action: PayloadAction<number>) => {
      state.timeLeft = action.payload;
    },
    addViolation: (state, action: PayloadAction<string>) => {
      state.violations.push(action.payload);
    },
    updateScore: (state, action: PayloadAction<number>) => {
      state.score = action.payload;
    },
    endInterview: (state) => {
      state.isActive = false;
      state.status = 'completed';
    },
    resetInterview: () => initialState,
  },
});

export const {
  startInterview,
  setRound,
  nextQuestion,
  setParsedResume,
  setCapturedImage,
  setSessionStatsId,
  setTimeLeft,
  addViolation,
  updateScore,
  endInterview,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;
