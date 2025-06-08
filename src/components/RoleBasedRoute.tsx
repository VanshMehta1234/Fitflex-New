import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../context/AuthContext';

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  allowedRoles, 
  redirectPath = '/unauthorized' 
}) => {
  const { user, loading, userRole } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // If the user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user has the required role
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={redirectPath} replace />;
  }
  
  return <Outlet />;
};

export default RoleBasedRoute; 