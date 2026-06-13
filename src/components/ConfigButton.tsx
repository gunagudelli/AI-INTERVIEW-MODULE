import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConfigButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/config')}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        backgroundColor: '#4F46E5',
        color: 'white',
        borderRadius: '50%',
        border: 'none',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      title="Configuration Settings"
    >
      ⚙️
    </button>
  );
};

export default ConfigButton;