import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { ExtendedUser, AppUser } from '../types/user';
import { ProfileUpdateData, updateUserProfile, getUserProfile, profileCache, UserProfile } from '../lib/profileService';
import toast from 'react-hot-toast';

export type UserRole = 'user' | 'admin';

type Profile = {
  id: string;
  user_id: string;
  role: UserRole;
  streak?: number;
  membershipType?: string;
  name?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
};

type AuthContextType = {
  session: Session | null;
  user: AppUser;
  loading: boolean;
  userRole: UserRole;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updateProfile: (profileData: ProfileUpdateData) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  deleteAccount: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser>(null);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  // Create a profile for a new user
  const createUserProfile = async (userId: string, role: UserRole = 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert([{ 
          id: userId, 
          role,
          streak: 0,
          membershipType: 'Basic'
        }]);

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error in createUserProfile:', error);
    }
  };

  // Update the user's profile data
  const updateProfile = async (profileData: ProfileUpdateData) => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      throw new Error('User not authenticated');
    }
    
    try {
      // Show loading toast
      const loadingToast = toast.loading('Updating profile...');
      
      // Update profile in database
      await updateUserProfile(user.id, profileData);
      
      // Refetch the user profile to ensure we have the latest data
      await refreshUserProfile();
      
      // Show success toast and dismiss loading toast
      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // Refresh the user's profile data
  const refreshUserProfile = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      // Clear the cache to ensure we get fresh data
      profileCache.invalidate(user.id);
      
      // Get updated profile
      const profile = await getUserProfile(user.id);
      
      if (profile) {
        // Get profile image
        const profileImage = profile.profileImage || profile.profile_image;
        
        // Create an extended user with profile data
        const extendedUser: ExtendedUser = {
          ...user,
          streak: profile.streak,
          membershipType: profile.membershipType,
          name: profile.name,
          profileImage: profileImage, 
        };
        
        setUser(extendedUser);
        setUserRole((profile.role as UserRole) || 'user');
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      toast.error('Failed to refresh profile data');
    }
  };

  const handleAuthChange = async (session: Session | null) => {
    setSession(session);
    
    if (session?.user) {
      try {
        // Clear cache to ensure fresh data
        profileCache.invalidate(session.user.id);
        
        const profile = await getUserProfile(session.user.id);
        
        // Get profile image
        const profileImage = profile?.profileImage || profile?.profile_image;
        
        // Create an extended user with profile data
        const extendedUser: ExtendedUser = {
          ...session.user,
          streak: profile?.streak || 0,
          membershipType: profile?.membershipType || 'Basic',
          name: profile?.name || '',
          profileImage: profileImage || '',
        };
        
        setUser(extendedUser);
        setUserRole((profile?.role as UserRole) || 'user');
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Set basic user without profile data
        setUser(session.user);
        setUserRole('user');
      }
    } else {
      setUser(null);
      setUserRole('user');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Get session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session);
    });

    // Enable auto session refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password
    });
    
    // If sign up is successful, create a profile
    if (data?.user && !error) {
      await createUserProfile(data.user.id);
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      toast.success('Signed in successfully!');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign in');
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign out');
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Define the base URL from the current window location
      const baseUrl = window.location.origin;
      
      // Create the full redirect URL
      const redirectUrl = `${baseUrl}/reset-password?source=email`;
      
      console.log(`Sending password reset email to ${email} with redirect to ${redirectUrl}`);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message || 'Failed to send reset email');
        return { error };
      }
      
      toast.success('Password reset link sent. Please check your email.');
      console.log('Password reset email sent successfully');
      return { error: null };
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      toast.error(error.message || 'An unexpected error occurred');
      return { error };
    }
  };

  const deleteAccount = async () => {
    if (!user) {
      toast.error('You must be logged in to delete your account');
      return { error: new Error('User not authenticated') };
    }
    
    try {
      const loadingToast = toast.loading('Deleting account...');
      
      // Delete the user's profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (profileError) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete profile data');
        return { error: profileError };
      }
      
      // Sign out the user
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        toast.dismiss(loadingToast);
        toast.error('Failed to sign out');
        return { error: signOutError };
      }
      
      toast.dismiss(loadingToast);
      toast.success('Account data deleted and signed out successfully');
      return { error: null };
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while deleting your account');
      console.error('Error deleting account:', error);
      return { error };
    }
  };

  const value = {
    session,
    user,
    loading,
    userRole,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUserProfile,
    deleteAccount
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 