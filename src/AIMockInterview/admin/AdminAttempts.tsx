import React, { useEffect, useState } from 'react';
import { candidateApi } from './api';
import { Candidate } from './types';
import { LoadingSpinner } from './components';

export const AdminAttempts: React.FC = () => {
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [newLimit, setNewLimit] = useState(3);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [limitData, candidatesData] = await Promise.all([
          candidateApi.getAttemptLimit(),
          candidateApi.getCandidates(),
        ]);
        setMaxAttempts(limitData.maxAttempts);
        setNewLimit(limitData.maxAttempts);
        setCandidates(candidatesData.filter(c => c.name !== 'N/A'));
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleUpdateLimit = async () => {
    if (newLimit < 1) { showToast('Limit must be at least 1'); return; }
    setSaving(true);
    try {
      const result = await candidateApi.updateAttemptLimit(newLimit);
      setMaxAttempts(result.maxAttempts);
      showToast('Attempt limit updated successfully');
    } catch { showToast('Failed to update limit'); }
    finally { setSaving(false); }
  };

  const handleViewUser = async (userId: string) => {
    try {
      const data = await candidateApi.getUserAttempts(userId);
      setSelectedUser(data);
    } catch { showToast('Failed to fetch user attempts'); }
  };

  const handleResetAttempts = async (userId: string) => {
    if (!window.confirm('Reset all attempts for this user?')) return;
    try {
      await fetch(`/api/admin/attempts/reset/${userId}`, { method: 'POST' });
      showToast('Attempts reset successfully');
    } catch { showToast('Failed to reset attempts'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <style>{`
        @keyframes at-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .at-card{animation:at-in .2s ease both;transition:box-shadow .15s,border-color .15s}
        .at-card:hover{box-shadow:0 4px 16px rgba(79,70,229,.07)!important;border-color:#c7d2fe!important}
        .at-row{transition:background .1s}
      `}</style>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#232f3e] text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4 text-[#ff9900]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attempt Management</h1>
        <p className="text-sm text-gray-500 mt-1">Control interview attempt limits and manage candidate access</p>
      </div>

      {/* Limit Control */}
      <div className="at-card bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded bg-[#fff3cd] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[#856404]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Maximum Attempt Limit</h2>
            <p className="text-sm text-gray-500">Currently set to <span className="font-semibold text-gray-900">{maxAttempts}</span> attempts per candidate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            value={newLimit}
            onChange={e => setNewLimit(Number(e.target.value))}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] text-gray-900"
          />
          <button
            onClick={handleUpdateLimit}
            disabled={saving}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88b00] disabled:bg-gray-300 text-white text-sm font-semibold rounded transition"
          >
            {saving ? 'Saving…' : 'Update Limit'}
          </button>
          <span className="text-sm text-gray-500">attempts per candidate</span>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-[#f7f8f8]">
          <h2 className="text-base font-semibold text-gray-900">Candidate Attempts</h2>
          <p className="text-xs text-gray-500 mt-0.5">{candidates.length} candidates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                {['Candidate', 'User ID', 'Attempts Used', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide bg-[#f7f8f8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const used = c.summary?.totalAttempts ?? 0;
                const remaining = maxAttempts - used;
                const canAttempt = remaining > 0;
                return (
                  <tr key={c.userId} className={`at-row border-b border-gray-100 hover:bg-[#fffbf2] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#232f3e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-400 font-mono">{c.userId?.slice(0, 12)}…</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${used >= maxAttempts ? 'bg-[#dc3545]' : 'bg-[#28a745]'}`}
                            style={{ width: `${Math.min((used / maxAttempts) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-700 font-medium">{used}/{maxAttempts}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${canAttempt ? 'bg-[#d4edda] text-[#155724] border-[#c3e6cb]' : 'bg-[#f8d7da] text-[#721c24] border-[#f5c6cb]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${canAttempt ? 'bg-[#28a745]' : 'bg-[#dc3545]'}`} />
                        {canAttempt ? 'Can Attempt' : 'Limit Reached'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleViewUser(c.userId)}
                          className="text-xs text-[#0066c0] hover:underline font-medium"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleResetAttempts(c.userId)}
                          className="text-xs text-[#c40000] hover:underline font-medium"
                        >
                          Reset
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-[#f7f8f8] border-t border-gray-200 text-xs text-gray-500">
          {candidates.length} candidates total
        </div>
      </div>

      {/* Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">Attempt Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-3 font-mono">{selectedUser.userId}</p>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                {selectedUser.attempts?.length > 0 ? (
                  selectedUser.attempts.map((a: any, idx: number) => (
                    <div key={idx} className="bg-[#f7f8f8] border border-gray-200 rounded p-3 text-sm">
                      <p className="font-medium text-gray-900">Session {idx + 1}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{new Date(a.startedAt).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-[#f7f8f8] border border-gray-200 rounded p-3 text-sm text-gray-500">
                    No attempts recorded yet
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-700 mb-4 bg-[#f7f8f8] rounded p-3">
                <span>Total used</span>
                <span className="font-semibold">{selectedUser.attempts?.length || 0} / {selectedUser.maxAttempts}</span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2 bg-[#232f3e] hover:bg-[#374151] text-white text-sm font-semibold rounded transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
