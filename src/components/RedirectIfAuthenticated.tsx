import React, { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RedirectIfAuthenticated: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if this is a password reset flow with a token
    const isResetPasswordPage = location.pathname === '/reset-password';
    
    // Look for reset token in hash fragment or query parameters
    const hash = window.location.hash;
    const isRecoveryFlow = hash.includes('type=recovery') || hash.includes('access_token=');
    
    const query = new URLSearchParams(location.search);
    const source = query.get('source');
    const hasResetSource = source === 'email';
    
    // If on reset password page with token indicators, don't redirect even if authenticated
    if (isResetPasswordPage && (isRecoveryFlow || hasResetSource)) {
      console.log('On reset password page with recovery token - allowing access');
      return;
    }
    
    // If the user is already authenticated, redirect to the dashboard
    if (user && !loading) {
      console.log('User authenticated - redirecting to home');
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
  const isRecoveryFlow = hash.includes('type=recovery') || hash.includes('access_token=');
  
  const query = new URLSearchParams(location.search);
  const source = query.get('source');
  const hasResetSource = source === 'email';
  
  if (isResetPasswordPage && (isRecoveryFlow || hasResetSource)) {
    console.log('Rendering reset password page even though user is authenticated');
    return <Outlet />;
  }
  
  // This should not be rendered as the useEffect will redirect
  return null;
};

export default RedirectIfAuthenticated; 