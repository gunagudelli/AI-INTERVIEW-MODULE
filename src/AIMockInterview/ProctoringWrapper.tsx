import React, { useEffect, useRef, useState } from 'react';

interface ProctoringWrapperProps {
  userId: string;
  sessionId: string;
  isActive: boolean;
  children: React.ReactNode;
}

export const ProctoringWrapper: React.FC<ProctoringWrapperProps> = ({
  userId,
  sessionId,
  isActive,
  children
}) => {
  const [score, setScore] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const proctorRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive || !userId || !sessionId) return;

    const initProctoring = async () => {
      try {
        // @ts-ignore
        const ProctoringSDK = window.ProctoringSDK;
        if (!ProctoringSDK) {
          console.warn('Proctoring SDK not loaded');
          return;
        }

        const proctor = new ProctoringSDK({
          apiUrl: `http://localhost:3000/api/proctoring`,
          userId,
          sessionId,
          onViolation: (result: any) => {
            setScore(result.score || 0);
            if (result.action === 'critical_warn') {
              setWarningMessage('⚠️ Multiple violations detected!');
              setShowWarning(true);
              setTimeout(() => setShowWarning(false), 5000);
            }
          },
          onTerminate: () => {
            alert('Interview terminated due to violations.');
            window.location.href = '/interview';
          }
        });

        const initResult = await proctor.initialize();
        if (initResult.success) {
          proctor.start();
          proctorRef.current = proctor;
        }
      } catch (error) {
        console.error('Proctoring init failed:', error);
      }
    };

    initProctoring();

    return () => {
      if (proctorRef.current) {
        proctorRef.current.stop();
      }
    };
  }, [userId, sessionId, isActive]);

  return (
    <>
      {children}
      
      {/* Proctoring Indicator */}
      {isActive && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-300">Proctoring Active</span>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-amber-400">{score}/10</span>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed top-4 right-4 z-50 animate-bounce">
          <div className="bg-amber-900 border border-amber-600 rounded-lg px-4 py-3 shadow-lg">
            <p className="text-sm text-amber-100 font-medium">{warningMessage}</p>
          </div>
        </div>
      )}
    </>
  );
};
