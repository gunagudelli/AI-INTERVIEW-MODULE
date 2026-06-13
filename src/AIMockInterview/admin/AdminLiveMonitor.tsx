import React, { useEffect, useState } from 'react';

export const AdminLiveMonitor: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/admin/live-sessions');
      const data = await res.json();
      setSessions(data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-900/30 text-green-400';
      case 'paused': return 'bg-yellow-900/30 text-yellow-400';
      default: return 'bg-gray-900/30 text-gray-400';
    }
  };

  const getTimeSince = (date: string) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  if (loading) return <div className="p-6 text-white">Loading...</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <style>{`
        @keyframes lm-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes lm-dot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:.7}}
        .lm-card{animation:lm-in .2s ease both;transition:box-shadow .15s,border-color .15s}
        .lm-card:hover{box-shadow:0 4px 20px rgba(16,185,129,.15)!important;border-color:#34d399!important}
        .lm-live-dot{animation:lm-dot 1.2s ease-in-out infinite}
        .lm-stat{transition:background .12s}
        .lm-stat:hover{background:#111827!important}
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Interview Monitor</h1>
            <p className="text-gray-400 text-sm mt-1">{sessions.length} active sessions</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full lm-live-dot"></div>
            Auto-refresh every 5s
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <div className="text-gray-400 text-lg">No active interviews</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session, si) => (
              <div key={session.session_id} className="lm-card bg-gray-800 rounded-lg border border-gray-700 p-6" style={{animationDelay:`${si*0.07}s`}}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                      {session.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{session.name || 'Unknown'}</h3>
                      <p className="text-gray-400 text-sm">{session.user_id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="lm-stat bg-gray-900 rounded p-3">
                    <div className="text-gray-400 text-xs mb-1">Current Round</div>
                    <div className="text-white font-bold text-lg">{session.round || 1}</div>
                  </div>
                  <div className="lm-stat bg-gray-900 rounded p-3">
                    <div className="text-gray-400 text-xs mb-1">Progress</div>
                    <div className="text-white font-bold text-lg">
                      {session.question_no || 0}/{session.total_questions || 0}
                    </div>
                  </div>
                  <div className="lm-stat bg-gray-900 rounded p-3">
                    <div className="text-gray-400 text-xs mb-1">Started</div>
                    <div className="text-white font-bold text-sm">{getTimeSince(session.started_at)}</div>
                  </div>
                  <div className="lm-stat bg-gray-900 rounded p-3">
                    <div className="text-gray-400 text-xs mb-1">Skills</div>
                    <div className="text-white text-xs truncate">
                      {session.skills ? JSON.parse(session.skills).slice(0, 2).join(', ') : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/admin/candidate/${session.user_id}`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
