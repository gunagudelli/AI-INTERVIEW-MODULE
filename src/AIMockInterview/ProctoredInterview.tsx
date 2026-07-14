import React, { useState, useEffect, useRef } from 'react';

export const ProctoredInterview: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [violations, setViolations] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);
  const [level, setLevel] = useState(5);
  const [questionNo, setQuestionNo] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(7);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [sessionId, setSessionId] = useState('');
  const violationRequestInFlight = useRef(false);
  const lastViolationAt = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get('session') || '');
  }, []);

  useEffect(() => {
    if (!user || !sessionId) return;
    const handleVisibility = () => {
      if (!document.hidden) return;

      const now = Date.now();
      if (violationRequestInFlight.current || now - lastViolationAt.current < 1500) {
        return;
      }

      violationRequestInFlight.current = true;
      lastViolationAt.current = now;

      fetch('/api/proctoring/track-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, sessionId, type: 'tab_switch' })
      })
        .then(res => res.json())
        .then(data => {
          setViolations(data.count);
          if (data.action === 'terminate') {
            alert('Interview terminated due to violations');
            window.location.href = '/interview-terminated';
          }
        })
        .catch(() => {})
        .finally(() => {
          violationRequestInFlight.current = false;
        });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user, sessionId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!user || !sessionId) return;
    e.preventDefault();
    if (violationRequestInFlight.current) return;

    violationRequestInFlight.current = true;
    fetch('/api/proctoring/track-violation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId, type: 'copy_paste' })
    })
      .then(res => res.json())
      .then(data => setViolations(data.count))
      .catch(() => {})
      .finally(() => {
        violationRequestInFlight.current = false;
      });
  };

  const submitAnswer = async () => {
    if (!user || !sessionId) return;
    const res = await fetch('/api/multi-level-interview/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, sessionId, answer })
    });

    if (!res.ok) {
      throw new Error(`Failed to submit answer: ${res.status}`);
    }

    const data = await res.json();

    if (data.completed) {
      window.location.href = `/results?session=${sessionId}`;
    } else {
      setQuestion(data.question);
      setAnswer('');
      setTimeLeft(data.timeLimit);
      setQuestionNo(data.questionNo);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6 flex justify-between items-center">
          <span className="text-white font-semibold">
            Level {level} • Question {questionNo}/{totalQuestions}
          </span>
          <span className="text-white font-semibold">
            Time: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
          <span className={`font-semibold ${violations > 2 ? 'text-red-400' : 'text-yellow-400'}`}>
            ⚠️ Violations: {violations}/3
          </span>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="text-white" dangerouslySetInnerHTML={{ __html: question }} />
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onPaste={handlePaste}
          placeholder="Type your answer here..."
          rows={10}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 outline-none mb-6"
        />

        <button
          onClick={submitAnswer}
          className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition"
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};
