import React from 'react';

export const SkillBadge: React.FC<{ skill: string }> = ({ skill }) => (
  <span className="px-2 py-0.5 bg-[#e8f4fd] text-[#0066c0] border border-[#c8e6f9] rounded text-xs font-medium">
    {skill}
  </span>
);

export const ScoreCard: React.FC<{ title: string; score: string; questionsAnswered?: number }> = ({ title, score, questionsAnswered }) => {
  const n = parseFloat(score || '0');
  const cls = n >= 60 ? 'border-[#c3e6cb] bg-[#d4edda] text-[#155724]'
    : n >= 40 ? 'border-[#ffeeba] bg-[#fff3cd] text-[#856404]'
    : 'border-[#f5c6cb] bg-[#f8d7da] text-[#721c24]';
  return (
    <div className={`p-4 rounded-lg border-2 ${cls}`}>
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold">{score || 'N/A'}</p>
      {questionsAnswered !== undefined && <p className="text-xs mt-1 opacity-70">{questionsAnswered} questions</p>}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '2.5px solid #e5e7eb',
      borderTop: '2.5px solid #4f46e5',
      animation: 'adm-shimmer-spin 0.7s linear infinite',
    }} />
    <style>{`@keyframes adm-shimmer-spin{to{transform:rotate(360deg)}}`}</style>
    <p className="mt-3 text-sm text-gray-400">{message}</p>
  </div>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg border border-gray-200 text-gray-400">
    <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-lg border border-[#f5c6cb] text-[#721c24]">
    <svg className="w-12 h-12 mb-3 text-[#f5c6cb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="text-sm mb-4">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88b00] text-white text-sm font-semibold rounded transition">
        Try Again
      </button>
    )}
  </div>
);
