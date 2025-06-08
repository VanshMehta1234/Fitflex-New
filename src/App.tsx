import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { XpProvider } from './context/XpContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <XpProvider>
          <FeedbackProvider>
            <Router>
              <Routes>
                <Route element={<RedirectIfAuthenticated />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
                
                <Route path="/" element={<ProtectedRoute />}>
                  <Route index element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  
                  <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/*" element={<div>Admin Area</div>} />
                  </Route>
                </Route>
              </Routes>
            </Router>
            
            {/* Toast notifications */}
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  style: {
                    background: '#22c55e',
                    color: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  style: {
                    background: '#ef4444',
                    color: '#fff',
                  },
                }
              }}
            />
          </FeedbackProvider>
        </XpProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
