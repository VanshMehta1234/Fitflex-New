import React, { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RedirectIfAuthenticated: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If the user is already authenticated, redirect to the dashboard
    if (user && !loading) {
      navigate('/home');
    }
  }, [user, loading, navigate]);
  
  // If loading or user is not authenticated, render the children routes
  if (loading || !user) {
    return <Outlet />;
  }
  
  // This should not be rendered as the useEffect will redirect
  return null;
};

export default RedirectIfAuthenticated; 