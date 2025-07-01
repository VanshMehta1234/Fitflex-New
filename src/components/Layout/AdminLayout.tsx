import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MainLayout } from './MainLayout';
import { BarChart, Users, MessageSquare, Settings, Shield, Package } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Admin access check
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (userRole !== 'admin') {
      navigate('/');
    }
  }, [user, userRole, navigate]);

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row">
        {/* Admin Sidebar */}
        <div className="w-full md:w-64 md:min-h-[calc(100vh-4rem)] bg-muted/40 md:border-r p-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-semibold">Admin Dashboard</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
            >
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span>Dashboard</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/users')}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>User Management</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/weekly-feedback')}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
            >
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>Feedback Analysis</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/store')}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
            >
              <Package className="h-4 w-4 text-muted-foreground" />
              <span>Store Management</span>
            </button>
            
            <button
              onClick={() => navigate('/admin/settings')}
              className="flex items-center gap-2 w-full p-2 rounded-md hover:bg-muted-foreground/10 transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </button>
          </nav>
        </div>
        
        {/* Admin Content */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </MainLayout>
  );
} 