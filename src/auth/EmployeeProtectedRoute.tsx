import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getEmployeeAccessToken } from '../utils/cookieUtils';
import { setEmployeePreviousPath } from '../utils/employeeTokenManager';

interface EmployeeProtectedRoute {
  children: React.ReactNode;
}

// Helper function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

const EmployeeProtectedRoutes: React.FC<EmployeeProtectedRoute> = ({ children }) => {
  const location = useLocation();
  const accessToken = getEmployeeAccessToken() || localStorage.getItem('employee_ref_token');
  const [sessionData, setSessionData] = useState({
    primaryType: sessionStorage.getItem('primaryType') || 'COMPANY',
    userId: sessionStorage.getItem('userId') || localStorage.getItem('employee_ref_user_id'),
    userName:
      sessionStorage.getItem('Name') ||
      (() => {
        try {
          return JSON.parse(localStorage.getItem('employee_ref_user') || '{}')?.name || null;
        } catch {
          return null;
        }
      })()
  });
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    // Update session data state when storage changes
    const currentData = {
      primaryType: sessionStorage.getItem('primaryType') || 'COMPANY',
      userId: sessionStorage.getItem('userId') || localStorage.getItem('employee_ref_user_id'),
      userName:
        sessionStorage.getItem('Name') ||
        (() => {
          try {
            return JSON.parse(localStorage.getItem('employee_ref_user') || '{}')?.name || 'Employee';
          } catch {
            return 'Employee';
          }
        })()
    };
    setSessionData(currentData);

    // Only restore if we have token but missing critical session data
    if (accessToken && (!currentData.primaryType || !currentData.userId || !currentData.userName)) {
      restoreSessionData();
    }
    
    if (accessToken) {
      setEmployeePreviousPath(location.pathname + location.search);
    }
  }, [location, accessToken]);

  const restoreSessionData = async () => {
    // Only set loading if we actually need to restore data
    const needsRestore = !sessionData.primaryType || !sessionData.userId || !sessionData.userName;
    if (needsRestore) {
      setIsRestoring(true);
    }
    
    try {
      if (accessToken) {
        const tokenData = decodeJWT(accessToken);
        const storedUser = (() => {
          try {
            return JSON.parse(localStorage.getItem('employee_ref_user') || '{}');
          } catch {
            return {};
          }
        })();
        
          if (tokenData) {
            // Restore all session data at once to avoid null states
            const restoredData = {
              primaryType: tokenData.primaryType || storedUser.primaryType || 'COMPANY',
            userId:
              tokenData.userId ||
              tokenData.id ||
              tokenData.sub ||
              storedUser.id ||
              '',
            userName:
              tokenData.name ||
              tokenData.username ||
              tokenData.firstName ||
              storedUser.name ||
              'Employee'
          };

          // Set all data at once
          if (!sessionData.primaryType) {
            sessionStorage.setItem('primaryType', restoredData.primaryType);
          }
          if (!sessionData.userId && restoredData.userId) {
            sessionStorage.setItem('userId', restoredData.userId);
          }
          if (!sessionData.userName) {
            sessionStorage.setItem('Name', restoredData.userName);
          }

          // Update state immediately
          setSessionData({
            primaryType: sessionStorage.getItem('primaryType') || 'COMPANY',
            userId: sessionStorage.getItem('userId') || localStorage.getItem('employee_ref_user_id'),
            userName: sessionStorage.getItem('Name') || 'Employee'
          });
        }
      }
    } catch (error) {
      console.error('Failed to restore session data:', error);
      // Set fallback values only if missing
      if (!sessionData.primaryType) {
        sessionStorage.setItem('primaryType', 'COMPANY');
      }
      if (!sessionData.userName) {
        sessionStorage.setItem('Name', 'Employee');
      }
      // Update state
      setSessionData({
        primaryType: sessionStorage.getItem('primaryType') || 'COMPANY',
        userId: sessionStorage.getItem('userId') || localStorage.getItem('employee_ref_user_id'),
        userName: sessionStorage.getItem('Name') || 'Employee'
      });
    } finally {
      if (needsRestore) {
        setIsRestoring(false);
      }
    }
  };

  // If no token, redirect to login
  if (!accessToken) {
    return <Navigate to="/referral/login" replace />;
  }

  // Check if token is expired (basic check)
  if (accessToken) {
    try {
      const tokenData = decodeJWT(accessToken);
      if (tokenData && tokenData.exp && tokenData.exp * 1000 < Date.now()) {
        // Token is expired
        return <Navigate to="/referral/login" replace />;
      }
    } catch (error) {
      // If token is malformed, redirect to login
      return <Navigate to="/referral/login" replace />;
    }
  }

  // Show loading only when actually restoring data
  if (isRestoring) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Don't render children until we have valid session data
  if (!sessionData.userId) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If token exists and is valid, allow access
  return <>{children}</>;
};

export default EmployeeProtectedRoutes;
