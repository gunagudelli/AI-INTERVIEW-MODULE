import React, { useState, useEffect } from 'react';
import { candidateApi } from './api';

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/admin/analytics')
      .then(r => r.json())
      .then(setAnalytics)
      .catch(() => {});
    candidateApi.getAttemptLimit()
      .then(d => setMaxAttempts(d.maxAttempts))
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const updateLimit = async () => {
    if (maxAttempts < 1) { showToast('Limit must be at least 1'); return; }
    setSaving(true);
    try {
      await candidateApi.updateAttemptLimit(maxAttempts);
      showToast('Limit updated successfully');
    } catch { showToast('Failed to update limit'); }
    finally { setSaving(false); }
  };

  const uploadCSV = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('csv', file);
    try {
      const res = await fetch('/api/bulk/import-candidates', { method: 'POST', body: fd });
      const data = await res.json();
      showToast(`Imported: ${data.imported}, Errors: ${data.errors}`);
      setFile(null);
    } catch { showToast('Upload failed'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = () => {
    const csv = `userId,name,email,skills,domains\nuser1,John Doe,john@example.com,"javascript,react,node","web development,backend"`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'candidates_template.csv';
    a.click();
  };

  const statCards = [
    { label: 'Total Candidates', value: analytics?.multiLevel?.total_users ?? analytics?.basic?.total_candidates ?? '—' },
    { label: 'Completed Interviews', value: analytics?.multiLevel?.completed ?? analytics?.basic?.completed_interviews ?? '—' },
    { label: 'Avg Score', value: analytics?.multiLevel?.avg_score ? `${analytics.multiLevel.avg_score}%` : analytics?.basic?.avg_score ?? '—' },
    { label: 'Pass Rate', value: analytics?.multiLevel?.pass_rate ? `${analytics.multiLevel.pass_rate}%` : '—' },
  ];

  return (
    <div className="p-6">
      <style>{`
        @keyframes an-in{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .an-card{animation:an-in .2s ease both;transition:box-shadow .15s,border-color .15s}
        .an-card:hover{box-shadow:0 4px 16px rgba(79,70,229,.07)!important;border-color:#c7d2fe!important}
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
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">System-wide interview performance overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={s.label} className="an-card bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-4" style={{animationDelay:`${i*0.07}s`}}>
            <p className="text-xs text-gray-500 font-medium mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        {/* Basic Interviews */}
        <div className="an-card bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-[#f7f8f8]">
            <h3 className="text-sm font-semibold text-gray-900">Basic Interviews</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Total Candidates', value: analytics?.basic?.total_candidates ?? '—' },
              { label: 'Average Score', value: analytics?.basic?.avg_score ?? '—' },
              { label: 'Completed', value: analytics?.basic?.completed_interviews ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Level Interviews */}
        <div className="an-card bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200 bg-[#f7f8f8]">
            <h3 className="text-sm font-semibold text-gray-900">Multi-Level Interviews</h3>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Total Users', value: analytics?.multiLevel?.total_users ?? '—' },
              { label: 'Completed', value: analytics?.multiLevel?.completed ?? '—' },
              { label: 'Average Score', value: analytics?.multiLevel?.avg_score ? `${analytics.multiLevel.avg_score}%` : '—' },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className="text-sm font-semibold text-gray-900">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-200 bg-[#f7f8f8]">
          <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
        </div>
        <div className="p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Attempts Per Candidate</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={maxAttempts}
              onChange={e => setMaxAttempts(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] text-gray-900"
            />
            <button
              onClick={updateLimit}
              disabled={saving}
              className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88b00] disabled:bg-gray-300 text-white text-sm font-semibold rounded transition"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Import */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-[#f7f8f8]">
          <h3 className="text-sm font-semibold text-gray-900">Bulk Import Candidates</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Download the CSV template, fill in candidate data, then upload.</p>
            <button
              onClick={downloadTemplate}
              className="text-sm text-[#0066c0] hover:underline font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download CSV Template
            </button>
          </div>
          <div className="flex gap-3">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded cursor-pointer hover:border-[#ff9900] transition bg-[#fafafa]">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-gray-500">{file ? file.name : 'Choose CSV file…'}</span>
              <input type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
            <button
              onClick={uploadCSV}
              disabled={!file || uploading}
              className="px-4 py-2 bg-[#232f3e] hover:bg-[#374151] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded transition"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
