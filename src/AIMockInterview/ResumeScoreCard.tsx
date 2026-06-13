import React from 'react';
import { useParams } from 'react-router-dom';

export const ResumeScoreCard: React.FC = () => {
  const { userId, sessionId } = useParams<{ userId: string; sessionId: string }>();

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Resume Score Card</h1>
      <p>User ID: {userId}</p>
      <p>Session ID: {sessionId}</p>
      <p>Resume analysis and scoring will be displayed here.</p>
    </div>
  );
};
