import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import { Button } from '../ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { getInitials } from '../../lib/profileService';
import { Sidebar } from './Sidebar';
import { Menu, ChevronLeft, Moon, Sun, Home, User, LogOut } from 'lucide-react';
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
    <div className="flex h-screen bg-background text-foreground transition-colors duration-200">
      {/* Sidebar - only visible on larger screens by default */}
      <div className={cn("hidden md:block h-screen sticky top-0")}>
        <Sidebar />
      </div>
      
      {/* Mobile sidebar */}
      <div className={cn("md:hidden")}>
        <Sidebar isMobile={true} />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-full h-screen">
        {/* Desktop Header with Theme Toggle - Only visible on desktop */}
        <header className="hidden md:flex h-16 items-center justify-end px-6 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <ThemeToggle variant="ghost" />
            <Avatar
              className="border border-border cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <AvatarImage 
                src={user?.profileImage} 
                alt={user?.name || user?.email?.split('@')[0] || 'User'} 
              />
              <AvatarFallback>
                {getInitials(user?.name || user?.email?.split('@')[0] || 'User')}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>
        
        {/* Mobile Header - conditionally show/hide */}
        <header 
          className={cn(
            "sticky top-0 z-10 border-b border-border bg-card shadow-sm md:hidden transition-transform duration-300",
            !showMobileHeader && "-translate-y-full"
          )}
        >
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              {/* App Logo/Title - add margin-left to move away from hamburger menu */}
              <div className="font-bold text-xl text-primary ml-14">
                FitFlex
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle variant="ghost" />
              
              {/* User Avatar */}
              <Avatar
                className="border border-border"
                onClick={() => navigate('/profile')}
              >
                <AvatarImage 
                  src={user?.profileImage} 
                  alt={user?.name || user?.email?.split('@')[0] || 'User'} 
                />
                <AvatarFallback>
                  {getInitials(user?.name || user?.email?.split('@')[0] || 'User')}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>
        
        {/* Main content area with scrolling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-16 md:pb-0">
          {children}
        </main>
        
        {/* Mobile bottom navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card z-10">
          <div className="flex justify-evenly h-16 items-center px-2">
            <button 
              className="flex flex-col items-center justify-center py-1 flex-1"
              onClick={() => navigate('/home')}
            >
              <span className="p-1 rounded-full bg-primary/10">
                <Home className="h-5 w-5 text-primary" />
              </span>
              <span className="text-xs mt-1 text-muted-foreground">Home</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center py-1 flex-1"
              onClick={() => navigate('/profile')}
            >
              <span className="p-1 rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </span>
              <span className="text-xs mt-1 text-muted-foreground">Profile</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center py-1 flex-1"
              onClick={handleLogout}
            >
              <span className="p-1 rounded-full bg-destructive/10">
                <LogOut className="h-5 w-5 text-destructive" />
              </span>
              <span className="text-xs mt-1 text-muted-foreground">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 