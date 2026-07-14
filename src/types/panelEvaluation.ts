// Shared shapes for the Interview Evaluation Workflow (panel-evaluation feature).
// Keys must match the backend's canonical 17 rating categories exactly
// (src/modules/panelEvaluation/panelEvaluation.model.js RATING_KEYS).

export interface PanelEvaluationRatings {
  communication_skills: number;
  technical_knowledge: number;
  react_native: number;
  react_js: number;
  javascript: number;
  typescript: number;
  html_css: number;
  redux: number;
  api_integration: number;
  database_knowledge: number;
  problem_solving: number;
  coding_skills: number;
  debugging: number;
  system_design: number;
  confidence: number;
  learning_ability: number;
  overall_performance: number;
}

export const RATING_CATEGORIES: Array<{ key: keyof PanelEvaluationRatings; label: string }> = [
  { key: 'communication_skills', label: 'Communication Skills' },
  { key: 'technical_knowledge', label: 'Technical Knowledge' },
  { key: 'react_native', label: 'React Native' },
  { key: 'react_js', label: 'React.js' },
  { key: 'javascript', label: 'JavaScript' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'html_css', label: 'HTML/CSS' },
  { key: 'redux', label: 'Redux' },
  { key: 'api_integration', label: 'API Integration' },
  { key: 'database_knowledge', label: 'Database Knowledge' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'coding_skills', label: 'Coding Skills' },
  { key: 'debugging', label: 'Debugging' },
  { key: 'system_design', label: 'System Design' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'learning_ability', label: 'Learning Ability' },
  { key: 'overall_performance', label: 'Overall Performance' },
];

export type EvaluationRecommendation = 'Strong Hire' | 'Hire' | 'Hold' | 'Reject';

export const RECOMMENDATION_OPTIONS: EvaluationRecommendation[] = ['Strong Hire', 'Hire', 'Hold', 'Reject'];

export type EvaluationStatus = 'draft' | 'submitted' | 'locked';

// Shared display metadata — was previously redefined identically in EvaluationsList.tsx,
// PanelEvaluationsAnalytics.tsx, and EvaluationDetail.tsx; consolidated here.
export const EVALUATION_STATUS_META: Record<EvaluationStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Pending', color: '#B45309', bg: '#FFFBEB' },
  submitted: { label: 'Submitted', color: '#4338CA', bg: '#EEF2FF' },
  locked: { label: 'Locked', color: '#15803D', bg: '#F0FDF4' },
};

export const RECOMMENDATION_META: Record<EvaluationRecommendation, { color: string; bg: string }> = {
  'Strong Hire': { color: '#15803D', bg: '#F0FDF4' },
  'Hire': { color: '#15803D', bg: '#F0FDF4' },
  'Hold': { color: '#B45309', bg: '#FFFBEB' },
  'Reject': { color: '#B91C1C', bg: '#FEF2F2' },
};

export interface EvaluationDraftPayload {
  ratings?: Partial<PanelEvaluationRatings>;
  recommendation?: EvaluationRecommendation;
  strengths?: string;
  areasForImprovement?: string;
  interviewNotes?: string;
  interviewDurationMinutes?: number;
}

export interface EvaluationSubmitPayload {
  ratings: PanelEvaluationRatings;
  recommendation: EvaluationRecommendation;
  strengths: string;
  areasForImprovement: string;
  interviewNotes: string;
  interviewDurationMinutes?: number;
}

export interface PanelEvaluation {
  id: number;
  assignment_id: number;
  panel_member_id: number;
  application_id: number;
  ratings: Partial<PanelEvaluationRatings>;
  overall_score: number | null;
  recommendation: EvaluationRecommendation | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  interview_notes: string | null;
  interview_duration_minutes: number | null;
  status: EvaluationStatus;
  submitted_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
  // Present on recruiter/admin read views (joined fields), not on the token-authed payload
  panel_member_name?: string;
  panel_member_email?: string;
  candidate_name?: string;
  candidate_email?: string;
  resume_url?: string;
  job_title?: string;
  recruiter_name?: string;
  confirmed_slot?: { date: string; startTime: string; endTime?: string } | null;
  meeting_link?: string | null;
  teams_meeting_id?: string | null;
  interview_instructions?: string | null;
}

export interface EvaluationStatistics {
  totalInterviews: number;
  pendingEvaluations: number;
  completedEvaluations: number;
  avgScore: number | null;
  avgDurationMinutes: number | null;
  recommendationBreakdown: Record<EvaluationRecommendation, number>;
  panelPerformance: Array<{ panel_member_name: string; count: number; avg_score: number }>;
  recruiterPerformance: Array<{ recruiter_name: string; count: number; avg_score: number }>;
  monthly: Array<{ month: string; count: number; avg_score: number }>;
}
