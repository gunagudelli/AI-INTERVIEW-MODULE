export interface QuestionResult {
  question: string;
  answer: string;
  score: string;
  feedback: string;
}

export interface RoundBreakdown {
  round: number;
  label: string;
  questionsAnswered: number;
  scored: number;
  maxScore: number;
  percentage: string;
  questions: QuestionResult[];
}

export interface Attempt {
  attemptNumber: number;
  sessionId: string;
  status: string;
  isTechnical: boolean;
  overallScore: string;
  result: string;
  totalQuestions: number;
  roundBreakdown: RoundBreakdown[];
  date: string;
}

export interface ProctoringSnapshot {
  sessionId: string;
  imageUrl: string;
  violationType: string | null;
  capturedAt: string;
}

export interface Candidate {
  userId: string;
  name: string;
  skills: string[];
  domains: string[];
  experience: number;
  isTechnical: boolean;
  resumeUrl?: string;
  copyPasteViolations?: number;
  createdAt?: string;
  proctoringSnapshots?: ProctoringSnapshot[];
  scoringBreakdown?: Record<string, { label: string; maxPerAttempt: number }>;
  // The list endpoint (GET /api/admin/candidates) returns these flat instead of
  // nested under `summary` — `summary` below only exists on the single-candidate
  // detail endpoint's response.
  bestScore?: string;
  latestScore?: string;
  examStatus?: 'selected' | 'completed' | 'in_progress' | string;
  completedAttempts?: number;
  maxRound?: number;
  totalQuestions?: number;
  summary?: {
    totalAttempts: number;
    completedAttempts: number;
    bestScore: string;
    bestResult: string;
    latestScore: string;
    latestResult: string;
    passThreshold: string;
  };
  attempts: Attempt[];
  // legacy fields kept for compatibility
  avgScore?: string;
  statistics?: { avgScore?: string; roundScores?: RoundScore[] };
  interviewResults?: InterviewResult[];
}

export interface RoundScore {
  round: number;
  avgScore: string;
  questionsAnswered: number;
}

export interface InterviewResult {
  round: number;
  question: string;
  answer: string;
  score: string;
  feedback: string;
}
