import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('candidate' | 'recruiter' | 'employee' | 'admin')[];
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const { isAuthenticated, profileData } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/whatsapplogin" state={{ from: location }} replace />;
  }

  const userRole = profileData?.role || 'candidate';

  if (!allowedRoles.includes(userRole as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
