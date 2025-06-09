import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { getInitials } from '../../lib/profileService';
import { Sidebar } from './Sidebar';
import { Menu, ChevronLeft, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, signOut, userRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHeader, setShowMobileHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Handle scroll for hiding/showing header on mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 64) {
        // Scrolling down
        setShowMobileHeader(false);
      } else {
        // Scrolling up
        setShowMobileHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
      {/* Sidebar - only visible on larger screens by default */}
      <div className={cn("hidden md:block h-screen sticky top-0")}>
        <Sidebar />
      </div>
      
      {/* Mobile sidebar */}
      <div className={cn("md:hidden")}>
        <Sidebar isMobile={true} />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-full h-screen overflow-hidden">
        {/* Desktop Header with Theme Toggle - Only visible on desktop */}
        <header className="hidden md:flex h-16 items-center justify-end px-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <ThemeToggle variant="ghost" />
            <Avatar
              src={user?.profileImage}
              alt={user?.name || user?.email?.split('@')[0] || 'User'}
              size="sm"
              className="border border-gray-200 dark:border-gray-700 cursor-pointer"
              onClick={() => navigate('/profile')}
            />
          </div>
        </header>
        
        {/* Mobile Header - conditionally show/hide */}
        <header 
          className={cn(
            "sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm md:hidden transition-transform duration-300",
            !showMobileHeader && "-translate-y-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              {/* App Logo/Title */}
              <div className="font-bold text-xl text-primary-600 dark:text-primary-400 ml-8">
                FitFlex
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle variant="ghost" />
              
              {/* User Avatar */}
              <Avatar
                src={user?.profileImage}
                alt={user?.name || user?.email?.split('@')[0] || 'User'}
                size="sm"
                className="border border-gray-200 dark:border-gray-700"
                onClick={() => navigate('/profile')}
              />
            </div>
          </div>
        </header>
        
        {/* Main content area with scrolling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {children}
        </main>
        
        {/* Mobile bottom navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 z-10">
          <div className="flex justify-around h-16 items-center px-4">
            <button 
              className="flex flex-col items-center justify-center w-16 py-1"
              onClick={() => navigate('/home')}
            >
              <span className="p-1 rounded-full bg-primary-50 dark:bg-primary-900/20">
                <ChevronLeft className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              </span>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Back</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center w-16 py-1"
              onClick={() => navigate('/home')}
            >
              <span className="p-1 rounded-full bg-primary-50 dark:bg-primary-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary-600 dark:text-primary-400">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Home</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center w-16 py-1"
              onClick={() => navigate('/profile')}
            >
              <span className="p-1 rounded-full bg-primary-50 dark:bg-primary-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary-600 dark:text-primary-400">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">Profile</span>
            </button>
          </div>
        </div>
        
        {/* Floating theme toggle for mobile */}
        <div className="md:hidden fixed bottom-20 right-4 z-20">
          <ThemeToggle 
            variant="default" 
            className="rounded-full shadow-lg w-12 h-12 flex items-center justify-center" 
          />
        </div>
      </div>
    </div>
  );
} 