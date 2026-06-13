import React, { useState, useEffect, useRef } from 'react';
import { api } from './lib/api';
import { SpinnerIcon } from './components/SpinnerIcon';

interface Props {
  userId: string;
  sessionId: string;
  parsed: any;
  onComplete: () => void;
}

const TIME_LIMIT = 300;

function parsePassageQuestion(raw: string) {
  const passageMatch = raw.match(/\*\*Read the following passage:\*\*\s*([\s\S]*?)\*\*Task:\*\*/i);
  const taskMatch    = raw.match(/\*\*Task:\*\*\s*([\s\S]*?)$/i);
  return {
    passage: passageMatch ? passageMatch[1].trim() : raw,
    task:    taskMatch    ? taskMatch[1].trim()    : '',
  };
}

export default function Round3ParagraphPage({ userId, sessionId, parsed, onComplete }: Props) {
  const [question,    setQuestion]    = useState<string>('');
  const [qNo,         setQNo]         = useState(1);
  const [totalQ,      setTotalQ]      = useState(3);
  const [timeLeft,    setTimeLeft]    = useState(TIME_LIMIT);
  const [stopped,     setStopped]     = useState(false);
  const [answer,      setAnswer]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [feedback,    setFeedback]    = useState<{ score: number; text: string } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [violations,  setViolations]  = useState(0);
  const [warnMsg,     setWarnMsg]     = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* load first question */
  useEffect(() => {
    api.startInterview({ userId, sessionId, skills: parsed?.skills || [], domain: parsed?.domains?.[0] || 'General', yearsOfExperience: parsed?.experience || 0 })
      .then((data: any) => {
        setQuestion(data.question || '');
        setQNo(data.question_no || 1);
        setTotalQ(data.total_questions || 3);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  /* timer */
  useEffect(() => {
    if (!question || stopped || timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft(x => x - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, stopped]);

  useEffect(() => {
    if (timeLeft === 0 && question && !stopped) { setStopped(true); handleSubmit(true); }
  }, [timeLeft]); // eslint-disable-line

  /* tab switch */
  useEffect(() => {
    const fn = () => {
      if (document.hidden) {
        setViolations(v => v + 1);
        setWarnMsg('Tab switch detected! This has been flagged.');
        setTimeout(() => setWarnMsg(''), 4000);
      }
    };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, []);

  async function handleSubmit(timeExpired = false) {
    if (submitting) return;
    const ans = answer.trim() || 'No answer provided';
    if (!timeExpired && ans.length < 50) { alert('Please write at least 50 characters.'); return; }
    setStopped(true);
    setSubmitting(true);
    try {
      const data = await api.submitAnswer({ userId, sessionId, question, answer: ans, isTimeExpired: timeExpired });

      if (data.last) setFeedback({ score: data.last.score, text: data.last.feedback });

      if (data.advancedTo === 4 || data.roundType === 'communication' || data.finished || data.doneRound === 3) {
        setTimeout(onComplete, data.last ? 2500 : 800);
        return;
      }

      const nextQ = data.nextQuestion || data.question;
      if (nextQ) {
        setTimeout(() => {
          setQuestion(nextQ);
          setQNo(data.question_no || qNo + 1);
          setTotalQ(data.total_questions || totalQ);
          setAnswer('');
          setFeedback(null);
          setTimeLeft(TIME_LIMIT);
          setStopped(false);
          setSubmitting(false);
          if (textareaRef.current) textareaRef.current.value = '';
        }, data.last ? 2500 : 0);
      } else {
        setTimeout(onComplete, 1000);
      }
    } catch (err: any) {
      alert(err?.message || 'Submission failed.');
      setSubmitting(false);
      setStopped(false);
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <SpinnerIcon /><p style={{ color: '#64748b' }}>Loading Round 3…</p>
    </div>
  );

  const { passage, task } = parsePassageQuestion(question);
  const timerColor  = timeLeft <= 10 ? '#ef4444' : timeLeft <= 30 ? '#f59e0b' : '#64748b';
  const progressPct = (qNo / totalQ) * 100;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* violation bar */}
      {warnMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999, background: '#b91c1c', color: '#fff', fontSize: 12, padding: '6px 16px', display: 'flex', gap: 8 }}>
          ⚠ {warnMsg} <span style={{ marginLeft: 'auto' }}>{violations} flag{violations > 1 ? 's' : ''}</span>
        </div>
      )}

      {/* header strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', marginBottom: 20, borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Professional Assessment — Round 3</span>
          <span style={{ fontSize: 12, color: '#64748b' }}>Question {qNo} of {totalQ}</span>
        </div>

        {/* progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
          <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#8b5cf6', transition: 'width .3s' }} />
          </div>
          <span style={{ fontSize: 11, color: '#64748b' }}>{Math.round(progressPct)}%</span>
        </div>

        {/* timer */}
        <div style={{ padding: '5px 12px', background: timeLeft <= 10 ? '#fef2f2' : '#f8fafc', border: `1px solid ${timeLeft <= 10 ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 6, fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: timerColor }}>
          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
        </div>

        {violations > 0 && (
          <div style={{ padding: '4px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
            ⚠ {violations} violation{violations > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* passage card */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#8b5cf6', marginBottom: 10 }}>Read the following passage</div>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#1e293b', margin: 0 }}>{passage}</p>
      </div>

      {/* task */}
      {task && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#2563eb', marginBottom: 6 }}>Task</div>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', margin: 0, lineHeight: 1.65 }}>{task}</p>
        </div>
      )}

      {/* feedback */}
      {feedback && (
        <div style={{ background: feedback.score >= 6 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${feedback.score >= 6 ? '#86efac' : '#fca5a5'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: feedback.score >= 6 ? '#16a34a' : '#dc2626', marginBottom: 6 }}>
            AI Feedback — Score: {feedback.score}/10
          </div>
          <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.65 }}>{feedback.text}</p>
        </div>
      )}

      {/* textarea */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Your Answer</span>
          <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 500, color: answer.length >= 50 ? '#16a34a' : '#f59e0b' }}>
            {answer.length} chars{answer.length < 50 ? ` (min 50)` : ' ✓'}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          disabled={stopped && !feedback}
          rows={8}
          placeholder={stopped ? 'Time expired — submitted automatically' : 'Write your response here based on the passage and task above…'}
          onPaste={e => { e.preventDefault(); setViolations(v => v + 1); setWarnMsg('Paste detected! Write in your own words.'); setTimeout(() => setWarnMsg(''), 4000); }}
          style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, lineHeight: 1.7, resize: 'vertical', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* submit */}
      <button
        onClick={() => handleSubmit(false)}
        disabled={submitting || (stopped && !feedback) || answer.trim().length < 50}
        style={{ width: '100%', padding: '13px', background: submitting ? '#a78bfa' : '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: answer.trim().length < 50 ? 0.5 : 1 }}
      >
        {submitting ? 'Submitting…' : feedback ? `Next Question ${qNo < totalQ ? '→' : '— Finish Round 3'}` : 'Submit Answer →'}
      </button>
    </div>
  );
}
