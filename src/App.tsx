import React, { useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { XpProvider } from './context/XpContext';
import { FeedbackProvider } from './context/FeedbackContext';
import { ClassProvider } from './context/ClassContext';
import { ReferralProvider } from './context/ReferralContext';
import { ModalProvider } from './context/ModalContext';
import { LeaderboardProvider } from './context/LeaderboardContext';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ResetPassword from './pages/ResetPassword';
import Attendance from './pages/Attendance';
import UserAttendance from './pages/UserAttendance';
import Classes from './pages/Classes';
import ClassDetails from './pages/ClassDetails';
import AdminClasses from './pages/AdminClasses';
import Refer from './pages/Refer';
import WeeklyFeedback from './pages/WeeklyFeedback';
import WeeklyFeedbackAnalysis from './pages/admin/WeeklyFeedbackAnalysis';
import Leaderboard from './pages/Leaderboard';
import XpRewards from './pages/XpRewards';
import ExamplePage from './pages/ExamplePage';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import RedirectIfAuthenticated from './components/RedirectIfAuthenticated';
import { XpNotificationManager } from './components/XpNotification';

// Create a component for the app routes to separate UI rendering from data context
const AppRoutes = () => (
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
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:id" element={<ClassDetails />} />
        <Route path="/refer" element={<Refer />} />
        <Route path="/weekly-feedback" element={<WeeklyFeedback />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/xp-rewards" element={<XpRewards />} />
        <Route path="/example" element={<ExamplePage />} />
        <Route path="/settings" element={<Settings />} />
        
        <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/user-attendance" element={<UserAttendance />} />
          <Route path="/admin/classes" element={<AdminClasses />} />
          <Route path="/admin/weekly-feedback" element={<WeeklyFeedbackAnalysis />} />
        </Route>
      </Route>
    </Routes>
  </Router>
);

function App() {
  // Use memoized toast configuration to prevent re-renders
  const toastOptions = useMemo(() => ({
    position: 'top-center' as const,
    duration: 3000,
    toastOptions: {
      success: {
        className: '!bg-background !text-foreground',
        iconTheme: {
          primary: 'hsl(var(--primary))',
          secondary: 'white',
        },
        style: {
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          color: 'var(--foreground)',
        },
      },
      error: {
        className: '!bg-background !text-foreground',
        iconTheme: {
          primary: 'hsl(var(--destructive))',
          secondary: 'white',
        },
        style: {
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          color: 'var(--foreground)',
        },
      },
      loading: {
        className: '!bg-background !text-foreground',
        style: {
          border: '1px solid hsl(var(--border))',
          padding: '16px',
          color: 'var(--foreground)',
        },
      },
    },
  }), []);

  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Data providers that should not re-render unnecessarily */}
        <XpProvider>
          <FeedbackProvider>
            <ClassProvider>
              <ReferralProvider>
                <LeaderboardProvider>
                  <ModalProvider>
                    <XpNotificationManager>
                      {/* Separate UI components from data providers */}
                      <React.Fragment>
                        <AppRoutes />
                        <Toaster {...toastOptions} />
                      </React.Fragment>
                    </XpNotificationManager>
                  </ModalProvider>
                </LeaderboardProvider>
              </ReferralProvider>
            </ClassProvider>
          </FeedbackProvider>
        </XpProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
