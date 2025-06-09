import React, { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RedirectIfAuthenticated: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if this is a password reset flow
    const isResetPasswordPage = location.pathname === '/reset-password';
    const hash = window.location.hash;
    const query = new URLSearchParams(location.search);
    const hasResetToken = hash.includes('type=recovery') || query.get('source') === 'email';
    
    // If on reset password page with token, don't redirect even if authenticated
    if (isResetPasswordPage && hasResetToken) {
      return;
    }
    
    // If the user is already authenticated, redirect to the dashboard
    if (user && !loading) {
      navigate('/home');
    }
  }, [user, loading, navigate, location]);
  
  // If loading or user is not authenticated, render the children routes
  if (loading || !user) {
    return <Outlet />;
  }
  
  // Special case for reset password with token
  const isResetPasswordPage = location.pathname === '/reset-password';
  const hash = window.location.hash;
  const query = new URLSearchParams(location.search);
  const hasResetToken = hash.includes('type=recovery') || query.get('source') === 'email';
  
  if (isResetPasswordPage && hasResetToken) {
    return <Outlet />;
  }
  
  // This should not be rendered as the useEffect will redirect
  return null;
};

export default RedirectIfAuthenticated; 