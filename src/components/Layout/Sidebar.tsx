import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/avatar';
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
  Gift
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };
  
  const menuItems = [
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
      icon: CreditCard,
      label: 'Membership',
      path: '/membership',
    },
    ...(userRole === 'admin' ? [
      {
        icon: BarChart,
        label: 'Admin',
        path: '/admin',
      },
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
    ] : []),
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
          className="fixed left-4 top-4 z-50 rounded-md bg-primary-600 p-2 text-white shadow-md"
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
          "flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto transition-all duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 z-50 w-[280px] shadow-xl" : "w-[280px] sticky top-0",
          isMobile && !isOpen && "-translate-x-full"
        )}
      >
        {/* Logo and close button (mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div 
            className="font-bold text-xl cursor-pointer text-primary-600 dark:text-primary-400 flex items-center"
            onClick={() => navigate('/home')}
          >
            <span className="h-8 w-8 rounded-md bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-2">F</span>
            FitFlex
          </div>
          {isMobile && (
            <button
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          )}
        </div>
        
        {/* User profile */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <Avatar
              src={user?.profileImage}
              alt={user?.name || user?.email?.split('@')[0] || 'User'}
              className="h-10 w-10 border border-gray-200 dark:border-gray-700"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-8 w-8"
              onClick={() => navigate('/profile')}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={cn(
                  "flex items-center w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setIsOpen(false);
                }}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"
                )} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        {/* Logout button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/20"
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