import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Lock } from 'lucide-react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Rating from '@mui/material/Rating';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import { panelEvaluationAPI } from '../../services/recruiterAPI';
import {
  PanelEvaluationRatings, RATING_CATEGORIES, RECOMMENDATION_OPTIONS,
  EvaluationRecommendation, PanelEvaluation,
} from '../../types/panelEvaluation';

// Brand color chosen from AIMockInterview/components/interviewStyles.ts's --brand token
// (interview.tsx uses a different #2563EB inline — the two are inconsistent app-wide;
// not reconciled here, out of scope for this feature).
const BRAND = '#0F62FE';
// Microsoft Teams brand purple — matches the color used for the real Teams join button in
// the backend's email templates (email.service.js's TEAMS_BRAND_COLOR), so the "this is a
// real Teams meeting" visual cue is consistent between email and app.
const TEAMS_BRAND_COLOR = '#5B5FC7';

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, sans-serif; }
  .pep-btn { transition: filter .1s; cursor: pointer; font-family: inherit; }
  .pep-btn:hover { filter: brightness(0.95); }
  .pep-btn:disabled { cursor: not-allowed; opacity: 0.55; }
`;

const emptyRatings: Partial<PanelEvaluationRatings> = {};

const PanelEvaluationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [evaluation, setEvaluation] = useState<PanelEvaluation | null>(null);
  const [starting, setStarting] = useState(false);

  const [ratings, setRatings] = useState<Partial<PanelEvaluationRatings>>(emptyRatings);
  const [recommendation, setRecommendation] = useState<EvaluationRecommendation | ''>('');
  const [strengths, setStrengths] = useState('');
  const [areasForImprovement, setAreasForImprovement] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewDurationMinutes, setInterviewDurationMinutes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  const load = () => {
    if (!token) return;
    panelEvaluationAPI.getByToken(token)
      .then((res: any) => {
        setAssignment(res.assignment);
        setEvaluation(res.evaluation);
        if (res.evaluation) {
          setRatings(res.evaluation.ratings || {});
          setRecommendation(res.evaluation.recommendation || '');
          setStrengths(res.evaluation.strengths || '');
          setAreasForImprovement(res.evaluation.areas_for_improvement || '');
          setInterviewNotes(res.evaluation.interview_notes || '');
          setInterviewDurationMinutes(
            res.evaluation.interview_duration_minutes != null ? String(res.evaluation.interview_duration_minutes) : ''
          );
        }
      })
      .catch((err: any) => setError(err?.response?.data?.error || 'This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleStart = async () => {
    if (!token) return;
    setStarting(true);
    setError(null);
    try {
      const res = await panelEvaluationAPI.markCompleteAndStart(token);
      setAssignment(res.assignment);
      setEvaluation(res.evaluation);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to start evaluation.');
    } finally {
      setStarting(false);
    }
  };

  const setRating = (key: keyof PanelEvaluationRatings, value: number | null) =>
    setRatings(prev => ({ ...prev, [key]: value ?? 0 }));

  const ratingValues = useMemo(
    () => RATING_CATEGORIES.map(c => Number(ratings[c.key]) || 0),
    [ratings]
  );
  const filledCount = ratingValues.filter(v => v > 0).length;
  const averageRating = filledCount ? ratingValues.reduce((a, b) => a + b, 0) / RATING_CATEGORIES.length : 0;
  const overallPercent = Math.round((averageRating / 10) * 100);

  const isLocked = evaluation && evaluation.status !== 'draft';
  const allRatingsFilled = filledCount === RATING_CATEGORIES.length;
  const canSubmit = allRatingsFilled && !!recommendation && strengths.trim() && areasForImprovement.trim() && interviewNotes.trim();

  const handleSubmit = async () => {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ratings: ratings as PanelEvaluationRatings,
        recommendation: recommendation as EvaluationRecommendation,
        strengths: strengths.trim(),
        areasForImprovement: areasForImprovement.trim(),
        interviewNotes: interviewNotes.trim(),
        interviewDurationMinutes: interviewDurationMinutes ? Number(interviewDurationMinutes) : undefined,
      };
      const updated = await panelEvaluationAPI.submit(token, payload);
      setEvaluation(updated);
      setDoneMessage('Evaluation submitted and locked. Thank you!');
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Failed to submit evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <style>{CSS}</style>
        <p style={{ color: '#64748B', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 20 }}>
        <style>{CSS}</style>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #FECACA', padding: '32px', maxWidth: 440, textAlign: 'center' }}>
          <XCircle size={32} color="#DC2626" style={{ marginBottom: 12 }} />
          <h2 style={{ fontSize: 16, color: '#0F172A', margin: '0 0 8px' }}>Unable to load evaluation</h2>
          <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  const skills: string[] = Array.isArray(assignment?.matched_skills) ? assignment.matched_skills
    : Array.isArray(assignment?.job_required_skills) ? assignment.job_required_skills : [];

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '32px 16px', color: '#0F172A' }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Interview Evaluation</h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
          Hi {assignment?.panel_member_name || 'there'}, please complete this evaluation after your interview with the candidate below.
        </p>

        {doneMessage && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #BBF7D0', padding: '20px 22px', marginBottom: 16, textAlign: 'center' }}>
            <CheckCircle size={28} color="#16A34A" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14, color: '#0F172A', margin: 0 }}>{doneMessage}</p>
          </div>
        )}

        {/* Header card: candidate / job / interview details */}
        <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Candidate & Interview Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, fontSize: 13.5 }}>
              <div><strong>Candidate:</strong> {assignment?.candidate_name}</div>
              <div><strong>Candidate Email:</strong> {assignment?.candidate_email}</div>
              <div><strong>Job Role:</strong> {assignment?.job_title}</div>
              <div><strong>Interview ID:</strong> {assignment?.id}</div>
              <div><strong>Interview Date:</strong> {assignment?.confirmed_slot?.date || 'N/A'}</div>
              <div><strong>Recruiter:</strong> {assignment?.recruiter_name || 'N/A'}</div>
              <div><strong>Panel:</strong> {assignment?.panel_member_name}</div>
              {assignment?.teams_meeting_id ? (
                <div><strong>Teams Meeting ID:</strong> {assignment.teams_meeting_id}</div>
              ) : (
                <div><strong>Meeting Link / Instructions:</strong> {assignment?.meeting_link ? (
                  <a href={assignment.meeting_link} target="_blank" rel="noreferrer">{assignment.meeting_link}</a>
                ) : 'N/A'}</div>
              )}
            </Box>
            {assignment?.teams_meeting_id && assignment?.meeting_link && (
              <Button
                variant="contained"
                href={assignment.meeting_link}
                target="_blank"
                rel="noreferrer"
                sx={{ mt: 2, backgroundColor: TEAMS_BRAND_COLOR, '&:hover': { backgroundColor: TEAMS_BRAND_COLOR } }}>
                Join Microsoft Teams Meeting
              </Button>
            )}
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                {skills.map((sk: string) => (
                  <span key={sk} style={{ padding: '2px 9px', background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11.5, fontWeight: 500 }}>{sk}</span>
                ))}
              </div>
            )}
            {assignment?.resume_url && (
              <a href={assignment.resume_url} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, padding: '6px 12px', border: '1px solid #E2E8F0', borderRadius: 6, fontSize: 12.5, color: '#374151', textDecoration: 'none', fontWeight: 600 }}>
                <FileText size={13} /> View Resume
              </a>
            )}
          </CardContent>
        </Card>

        {/* No evaluation started yet: show the "mark complete" gate */}
        {!evaluation && (
          <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 3 }}>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
              Once your interview with the candidate has ended, mark it complete to start the evaluation.
            </Typography>
            {error && <p style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 12 }}>{error}</p>}
            <Button variant="contained" disabled={starting} onClick={handleStart}
              sx={{ backgroundColor: BRAND, '&:hover': { backgroundColor: BRAND } }}>
              {starting ? 'Starting…' : 'Mark Interview Complete & Start Evaluation'}
            </Button>
          </Card>
        )}

        {evaluation && (
          <>
            {/* Score summary */}
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={overallPercent} size={84} thickness={4}
                    sx={{ color: BRAND }} />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="caption" fontWeight={700}>{averageRating.toFixed(1)}/10</Typography>
                  </Box>
                </Box>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Average Rating: <strong>{averageRating.toFixed(2)} / 10</strong> ({filledCount}/{RATING_CATEGORIES.length} categories rated)
                  </Typography>
                  <LinearProgress variant="determinate" value={overallPercent}
                    sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { backgroundColor: BRAND } }} />
                </Box>
                {isLocked && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#B45309', fontSize: 12, fontWeight: 700 }}>
                    <Lock size={14} /> {evaluation.status === 'locked' ? 'Locked' : evaluation.status}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Technical Rating</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {RATING_CATEGORIES.map(cat => (
                    <Box key={cat.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant="body2" sx={{ minWidth: 180 }}>{cat.label}</Typography>
                      <Rating
                        max={10}
                        precision={1}
                        value={ratings[cat.key] || 0}
                        onChange={(_e, val) => setRating(cat.key, val)}
                        disabled={!!isLocked}
                      />
                      <Typography variant="body2" sx={{ minWidth: 28, textAlign: 'right', color: '#64748B' }}>
                        {ratings[cat.key] || 0}/10
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Recommendation</Typography>
                <RadioGroup
                  row
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value as EvaluationRecommendation)}
                >
                  {RECOMMENDATION_OPTIONS.map(opt => (
                    <FormControlLabel key={opt} value={opt} disabled={!!isLocked} control={<Radio />} label={opt} />
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Feedback</Typography>
                <TextField
                  label="Strengths" multiline minRows={2} fullWidth sx={{ mb: 2 }}
                  value={strengths} onChange={e => setStrengths(e.target.value)} disabled={!!isLocked}
                />
                <TextField
                  label="Areas for Improvement" multiline minRows={2} fullWidth sx={{ mb: 2 }}
                  value={areasForImprovement} onChange={e => setAreasForImprovement(e.target.value)} disabled={!!isLocked}
                />
                <TextField
                  label="Interview Notes" multiline minRows={2} fullWidth sx={{ mb: 2 }}
                  value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} disabled={!!isLocked}
                />
                <TextField
                  label="Interview Duration (minutes)" type="number" sx={{ width: 220 }}
                  value={interviewDurationMinutes} onChange={e => setInterviewDurationMinutes(e.target.value)} disabled={!!isLocked}
                />
              </CardContent>
            </Card>

            {!isLocked && (
              <Card variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                {submitError && <p style={{ color: '#DC2626', fontSize: 12.5, marginBottom: 12 }}>{submitError}</p>}
                {!canSubmit && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#94A3B8', mb: 1 }}>
                    Rate all {RATING_CATEGORIES.length} categories, choose a recommendation, and fill in all three feedback fields to submit.
                  </Typography>
                )}
                <Button variant="contained" disabled={!canSubmit || submitting} onClick={handleSubmit}
                  sx={{ backgroundColor: BRAND, '&:hover': { backgroundColor: BRAND } }}>
                  {submitting ? 'Submitting…' : 'Submit Evaluation'}
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PanelEvaluationPage;
