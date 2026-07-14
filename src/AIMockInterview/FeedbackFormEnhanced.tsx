import React, { useState } from 'react';

interface FeedbackFormProps {
  userId: string;
  sessionId: string;
  onSubmit?: () => void;
}

export const FeedbackFormEnhanced: React.FC<FeedbackFormProps> = ({ userId, sessionId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionId, rating, comments })
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed with status ${response.status}`);
      }

      setSubmitted(true);
      onSubmit?.();
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl dark:border-emerald-900/50 dark:bg-slate-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-4xl text-emerald-600 dark:bg-emerald-950/50">✓</div>
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Thank You!</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Your feedback helps us improve the interview experience.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">How was your experience?</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rate the interview flow and share optional feedback.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="mb-3 block text-sm font-bold text-slate-700 dark:text-slate-300">Rate your experience</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`rounded-2xl px-2 text-4xl transition-all hover:scale-105 ${star <= rating ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-700'}`}
                aria-label={`Rate ${star}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Additional comments (optional)</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            rows={4}
          />
        </div>

        <button
          type="submit"
          disabled={loading || rating === 0}
          className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-extrabold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};
