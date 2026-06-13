import React from 'react';
import Badge from './Badge';

interface CandidateCardProps {
  name: string;
  email: string;
  phone?: string;
  score?: number;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  date: string;
  jobTitle?: string;
  onClick?: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  name,
  email,
  phone,
  score,
  status,
  date,
  jobTitle,
  onClick,
}) => {
  const getStatusVariant = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'scheduled':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600">{email}</p>
            {phone && <p className="text-xs text-gray-500">{phone}</p>}
          </div>
        </div>
        <Badge variant={getStatusVariant()}>{status}</Badge>
      </div>
      
      {jobTitle && (
        <div className="mb-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Position:</span> {jobTitle}
          </p>
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{new Date(date).toLocaleDateString()}</span>
        {score !== undefined && (
          <span className={`font-semibold ${score >= 60 ? 'text-green-600' : 'text-red-600'}`}>
            Score: {score}%
          </span>
        )}
      </div>
    </div>
  );
};

export default CandidateCard;
