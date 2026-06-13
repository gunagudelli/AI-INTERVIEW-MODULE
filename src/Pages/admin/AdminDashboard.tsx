import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { setAnalytics, setLiveMonitoring } from '../../store/slices/adminSlice';
import adminAPI from '../../services/adminAPI';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { analytics, liveMonitoring } = useSelector((state: RootState) => state.admin);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadLiveMonitoring, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData, liveData] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getDashboardStats(),
        adminAPI.getLiveMonitoring(),
      ]);
      dispatch(setAnalytics(analyticsData));
      setStats(statsData);
      dispatch(setLiveMonitoring(liveData));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLiveMonitoring = async () => {
    try {
      const data = await adminAPI.getLiveMonitoring();
      dispatch(setLiveMonitoring(data));
    } catch (error) {
      console.error('Failed to load live monitoring:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: '600', marginBottom: '24px' }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>{analytics.totalUsers}</h3>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Total Users</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>{analytics.totalCandidates}</h3>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Total Candidates</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0' }}>{analytics.totalInterviews}</h3>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Total Interviews</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔴</div>
          <h3 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: '#059669' }}>{analytics.activeInterviews}</h3>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Active Now</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin/users')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>User Management</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Manage all platform users</div>
            </button>
            <button
              onClick={() => navigate('/admin/candidates')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Candidates</div>
              <div style={{ fontSize: '12px', color: '#666' }}>View all candidates</div>
            </button>
            <button
              onClick={() => navigate('/admin/attempts')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Attempts</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Interview attempts</div>
            </button>
            <button
              onClick={() => navigate('/admin/config')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚙️</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Configuration</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Interview settings</div>
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Analytics</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Platform insights</div>
            </button>
            <button
              onClick={() => navigate('/admin/monitoring')}
              style={{ padding: '16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔴</div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Live Monitoring</div>
              <div style={{ fontSize: '12px', color: '#666' }}>Real-time tracking</div>
            </button>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Live Interviews</h2>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {liveMonitoring.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                No active interviews
              </div>
            ) : (
              liveMonitoring.map((session: any) => (
                <div key={session.id} style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => navigate(`/admin/monitoring/${session.id}`)}>
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{session.candidateName}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Round {session.currentRound} - Q{session.currentQuestion}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{session.timeElapsed}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>Recent Activity</h2>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((activity: any, index: number) => (
              <div key={index} style={{ padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>{activity.message}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(activity.timestamp).toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>No recent activity</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
