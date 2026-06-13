import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchUpcomingInterviews } from '../../store/slices/candidateSlice';
import useAuth from '../../hooks/useAuth';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';

const UpcomingInterviews: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getUserId } = useAuth();
  const { upcomingInterviews, loading } = useSelector((state: RootState) => state.candidate);
  const userId = getUserId();

  useEffect(() => {
    if (userId) {
      dispatch(fetchUpcomingInterviews(userId) as any);
    }
  }, [userId, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Interviews</h1>
          <p className="text-gray-600 mt-1">Manage your scheduled interviews</p>
        </div>
        <button
          onClick={() => navigate('/interview')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start New Interview
        </button>
      </div>

      {upcomingInterviews.length === 0 ? (
        <EmptyState
          title="No Upcoming Interviews"
          description="You don't have any scheduled interviews at the moment. Start a new interview to get started."
          action={{
            label: 'Start Interview',
            onClick: () => navigate('/interview'),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingInterviews.map((interview) => (
            <div
              key={interview.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <Badge variant="warning">{interview.status}</Badge>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{interview.jobTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{interview.company}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(interview.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{new Date(interview.date).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/interview')}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Start Interview
                </button>
                <button
                  onClick={() => navigate(`/candidate/history`)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingInterviews;
