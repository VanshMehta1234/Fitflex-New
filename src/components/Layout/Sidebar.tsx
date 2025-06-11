import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { 
  Home, 
  User, 
  Calendar, 
  CreditCard, 
  BarChart, 
  Settings, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  CalendarCheck,
  Dumbbell,
  Share2,
  Gift,
  Trophy,
  Star
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { getInitials } from '../../lib/profileService';

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const { user, userRole, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  
  const menuItems = [
    ...(userRole === 'admin' ? [
      {
        icon: CalendarCheck,
        label: 'Weekly Feedback Analysis',
        path: '/admin/weekly-feedback',
      },
      {
        icon: CalendarCheck,
        label: 'User Attendance',
        path: '/admin/user-attendance',
      },
      {
        icon: Dumbbell,
        label: 'Manage Classes',
        path: '/admin/classes',
      }
    ] : [
      {
      icon: Home,
      label: 'Dashboard',
      path: '/home',
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
    },
    {
      icon: CalendarCheck,
      label: 'Attendance',
      path: '/attendance',
    },
    {
      icon: Dumbbell,
      label: 'Classes',
      path: '/classes',
    },
    {
      icon: Share2,
      label: 'Refer & Earn',
      path: '/refer',
    },
    {
      icon: CreditCard,
      label: 'Weekly Feedback',
      path: '/weekly-feedback',
    },
    {
      icon: Trophy,
      label: 'Leaderboard',
      path: '/leaderboard',
    },
    {
      icon: Star,
      label: 'XP Rewards',
      path: '/xp-rewards',
    },
    {
      icon: CreditCard,
      label: 'Membership',
      path: '/membership',
    }
    ]),
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
    },
  ];
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="fixed left-4 top-4 z-50 rounded-full bg-primary/10 text-primary p-2 shadow-md hover:bg-primary/20"
          onClick={toggleSidebar}
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}
      
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity" 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex flex-col bg-card text-card-foreground border-r border-border h-screen transition-all duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 z-50 w-[280px] shadow-xl" : "w-[280px]",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        {/* Logo and close button (mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div 
            className={cn(
              "font-bold text-xl cursor-pointer text-primary flex items-center",
              isMobile && "ml-10" // Add extra margin on mobile for the menu button
            )}
            onClick={() => navigate('/home')}
          >
            <span className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary mr-3">F</span>
            FitFlex
          </div>
          {isMobile && (
            <button
              className="p-1 rounded-full hover:bg-muted"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* User profile */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Avatar
              className="h-10 w-10 border border-border"
            >
              <AvatarImage src={user?.profileImage} alt={user?.name || user?.email?.split('@')[0] || 'User'} />
              <AvatarFallback>{getInitials(user?.name || user?.email?.split('@')[0] || 'User')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8 rounded-full"
              onClick={() => navigate('/profile')}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        
        {/* Navigation - with its own scrollbar */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={cn(
                  "flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-foreground hover:bg-muted"
                )}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsOpen(false);
                }}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-primary" : "opacity-70"
                )} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* Logout Button Section - Make sure it's visible at the bottom */}
        <div className="p-4 border-t border-border mt-auto">
          {/* Logout button */}
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </aside>
    </>
  );
} 