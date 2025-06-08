import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();
  
  // State for request password reset
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState('');
  
  // State for updating password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [tokenVerifying, setTokenVerifying] = useState(true);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  
  // Check if we have a token in the URL
  useEffect(() => {
    const checkForToken = async () => {
      setTokenVerifying(true);
      
      // Check for hash fragment (where Supabase puts the token)
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      // Check query parameters too
      const query = new URLSearchParams(location.search);
      const tokenInQuery = query.get('token');
      const source = query.get('source');

      // If we have a token or source is email, user is trying to reset password
      if (accessToken || tokenInQuery || source === 'email') {
        try {
          // Check if we have a valid session
          const { data } = await supabase.auth.getSession();
          
          if (data.session) {
            console.log('Valid session found for password reset');
            setHasToken(true);
          } else {
            console.log('No valid session, showing request form');
            setError('Your reset link has expired. Please request a new one.');
          }
        } catch (err) {
          console.error('Error checking token:', err);
          setError('Error verifying your reset link. Please request a new one.');
        }
      }
      
      setTokenVerifying(false);
    };
    
    checkForToken();
  }, [location]);
  
  // Handle request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while sending the reset link');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) {
        if (error.message.includes('same password') || 
            error.message.includes('previously used')) {
          setError('Cannot use your previous password. Please choose a new one.');
        } else if (error.message.includes('expired') || 
                  error.message.includes('invalid')) {
          setError('Your reset link has expired. Please request a new one.');
          setHasToken(false);
        } else {
          setError(error.message);
        }
        return;
      }
      
      // Password updated successfully
      setPasswordUpdated(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };
  
  // Show loading state while verifying token
  if (tokenVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300">
        <div className="auth-card">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifying...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we verify your reset link
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 rounded-full border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300">
      <div className="auth-card">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {hasToken ? 'Set New Password' : 'Reset Password'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {hasToken 
              ? 'Create a new password for your account' 
              : 'We\'ll send you a link to reset your password'}
          </p>
        </div>
        
        {error && (
          <div className="alert-error mb-4" role="alert">
            {error}
          </div>
        )}
        
        {/* Password reset request form */}
        {!hasToken && !resetSent && !passwordUpdated && (
          <form onSubmit={handleRequestReset} className="space-y-6">
            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Reset Link'}
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="link">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        )}
        
        {/* Password update form (when token is valid) */}
        {hasToken && !passwordUpdated && (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="auth-button"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : 'Update Password'}
            </button>
            
            <div className="mt-4 text-center">
              <Link to="/login" className="link">
                Back to login
              </Link>
            </div>
          </form>
        )}
        
        {/* Success messages */}
        {resetSent && (
          <div className="alert-success" role="alert">
            <p className="font-medium mb-2">Check your email for a reset link</p>
            <p className="text-sm">If you don't see it within a few minutes, check your spam folder.</p>
            <div className="mt-4 text-center">
              <Link to="/login" className="link">
                Return to login
              </Link>
            </div>
          </div>
        )}
        
        {passwordUpdated && (
          <div className="alert-success" role="alert">
            <p className="font-medium mb-2">Your password has been updated successfully!</p>
            <p className="text-sm">You'll be redirected to the login page in a few seconds.</p>
            <div className="mt-4 text-center">
              <Link to="/login" className="link">
                Go to login now
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPassword; 