import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { fetchInterviewHistory, setFilters, setCurrentPage, downloadScorecard } from '../../store/slices/candidateSlice';
import useAuth from '../../hooks/useAuth';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import useNotification from '../../hooks/useNotification';
import { ToastContainer } from '../../components/common/Toast';

const InterviewHistory: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getUserId } = useAuth();
  const { interviews, loading, filters, currentPage, totalPages } = useSelector((state: RootState) => state.candidate);
  const userId = getUserId();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { success, error, toasts, removeNotification } = useNotification();

  const pagination = usePagination(interviews, 10);

  useEffect(() => {
    if (userId) {
      dispatch(fetchInterviewHistory({ userId, page: currentPage, filters }) as any);
    }
  }, [userId, currentPage, filters, dispatch]);

  useEffect(() => {
    if (debouncedSearch !== filters.searchQuery) {
      dispatch(setFilters({ searchQuery: debouncedSearch }));
      dispatch(setCurrentPage(1));
    }
  }, [debouncedSearch, filters.searchQuery, dispatch]);

  const handleStatusFilter = (status: string) => {
    dispatch(setFilters({ status }));
    dispatch(setCurrentPage(1));
  };

  const handleDownloadScorecard = async (sessionId: string) => {
    if (!userId) return;
    try {
      await dispatch(downloadScorecard({ userId, sessionId }) as any).unwrap();
      success('Scorecard downloaded successfully');
    } catch (err) {
      error('Failed to download scorecard');
    }
  };

  const columns = [
    {
      key: 'jobTitle',
      label: 'Position',
      sortable: true,
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => {
        const variantMap: any = {
          completed: 'success',
          'in-progress': 'info',
          scheduled: 'warning',
          cancelled: 'error',
        };
        return <Badge variant={variantMap[value] || 'default'}>{value}</Badge>;
      },
    },
    {
      key: 'totalScore',
      label: 'Score',
      sortable: true,
      render: (value: number) => (
        <span className={`font-semibold ${value >= 60 ? 'text-green-600' : 'text-red-600'}`}>
          {value}%
        </span>
      ),
    },
    {
      key: 'result',
      label: 'Result',
      render: (value: string) => {
        const variantMap: any = {
          pass: 'success',
          fail: 'error',
          pending: 'warning',
        };
        return <Badge variant={variantMap[value] || 'default'}>{value.toUpperCase()}</Badge>;
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadScorecard(row.sessionId);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Download Scorecard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/candidate/${userId}`);
            }}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="View Details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onClose={removeNotification} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
          <p className="text-gray-600 mt-1">View all your past interviews and performance</p>
        </div>
        <button
          onClick={() => navigate('/interview')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Start New Interview
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by position or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.status === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.status === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleStatusFilter('scheduled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filters.status === 'scheduled'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Scheduled
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {interviews.length === 0 ? (
        <EmptyState
          title="No Interview History"
          description="You haven't completed any interviews yet. Start your first interview to see your history here."
          action={{
            label: 'Start Interview',
            onClick: () => navigate('/interview'),
          }}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={interviews}
            loading={loading}
            onRowClick={(row) => navigate(`/admin/candidate/${userId}`)}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Showing {pagination.startIndex + 1} to {pagination.endIndex} of {interviews.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    pagination.prevPage();
                    dispatch(setCurrentPage(currentPage - 1));
                  }}
                  disabled={!pagination.canGoPrev}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {pagination.pageNumbers.map((page, index) =>
                  page === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-2">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => {
                        pagination.goToPage(page);
                        dispatch(setCurrentPage(page));
                      }}
                      className={`px-3 py-1 rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  onClick={() => {
                    pagination.nextPage();
                    dispatch(setCurrentPage(currentPage + 1));
                  }}
                  disabled={!pagination.canGoNext}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewHistory;
