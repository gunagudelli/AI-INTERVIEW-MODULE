import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const navigate = useNavigate();
  const { userId, isAuthenticated, profileData } = useSelector((state: RootState) => state.auth);

  const getUserId = (): string | null => {
    return localStorage.getItem('userId') || userId || null;
  };

  const getUser = () => profileData;

  const getUserRole = (): string | null => {
    return (profileData as any)?.role || localStorage.getItem('userRole') || null;
  };

  const isCandidate = (): boolean => getUserRole() === 'candidate';
  const isRecruiter = (): boolean => getUserRole() === 'recruiter';
  const isAdmin = (): boolean => getUserRole() === 'admin';

  const requireAuth = (redirectTo: string = '/whatsapplogin') => {
    if (!isAuthenticated && !getUserId()) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  const requireRole = (role: string, redirectTo: string = '/') => {
    if (getUserRole() !== role) {
      navigate(redirectTo);
      return false;
    }
    return true;
  };

  return {
    user: profileData,
    userId,
    isAuthenticated,
    loading: false,
    getUserId,
    getUser,
    getUserRole,
    isCandidate,
    isRecruiter,
    isAdmin,
    requireAuth,
    requireRole,
  };
};

export default useAuth;
