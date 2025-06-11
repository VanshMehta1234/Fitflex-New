import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { ExtendedUser, AppUser } from '../types/user';
import { ProfileUpdateData, updateUserProfile, getUserProfile, profileCache, UserProfile } from '../lib/profileService';
import toast from 'react-hot-toast';

// Moved createUserProfile outside the component for stability
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
      // Optionally, re-throw or handle more gracefully
    }
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    // Optionally, re-throw or handle more gracefully
  }
};

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


  const refreshUserProfile = useCallback(async (): Promise<void> => {
    if (!user?.id) return;

    try {
      // Clear the cache to ensure we get fresh data
      profileCache.invalidate(user.id);
      
      // Get updated profile
      const userProfile = await getUserProfile(user.id); // Renamed to avoid conflict with Profile type
      
      if (userProfile) {
        setUser(currentUser => {
          if (!currentUser) return null; // Should not happen if user.id exists

          const profileImage = userProfile.profileImage || userProfile.profile_image;
          
          const newExtendedUser: ExtendedUser = {
            ...currentUser, // Preserve existing fields from currentUser (like email, auth related fields)
            id: currentUser.id, // Ensure id from currentUser is preserved
            streak: userProfile.streak,
            membershipType: userProfile.membershipType,
            name: userProfile.name,
            profileImage: profileImage,
            // Note: 'role' is handled by setUserRole separately below, 
            // but if it were part of AppUser directly, it would be here.
          };

          // Shallow compare relevant fields
          if (
            currentUser.name === newExtendedUser.name &&
            currentUser.streak === newExtendedUser.streak &&
            currentUser.membershipType === newExtendedUser.membershipType &&
            currentUser.profileImage === newExtendedUser.profileImage
            // Add other simple fields if necessary. Avoid deep comparing objects here.
          ) {
            return currentUser; // Return previous state if no meaningful change
          }
          return newExtendedUser; // Return new state
        });
        setUserRole((userProfile.role as UserRole) || 'user'); // Role can be updated separately
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      toast.error('Failed to refresh profile data');
    }
  }, [user]); // Depends on the 'user' state to spread its existing values

  // Update the user's profile data
  const updateProfile = useCallback(async (profileData: ProfileUpdateData) => {
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
  }, [user, refreshUserProfile]);

  // Refresh the user's profile data
  const handleAuthChange = async (session: Session | null) => {
    setSession(session);
    
    if (session?.user) {
      try {
        // Clear cache to ensure fresh data
        profileCache.invalidate(session.user.id);
        
        const userProfile = await getUserProfile(session.user.id); // Renamed
        
        setUser(currentUser => {
          const baseUser = session.user as SupabaseUser; // User from Supabase session

          const profileImage = userProfile?.profileImage || userProfile?.profile_image;

          const newExtendedUser: ExtendedUser = {
            // Crucially, spread Supabase user from session first for auth properties
            ...baseUser, 
            // Then override/add profile data
            id: baseUser.id, // ensure supabase user id is primary
            email: baseUser.email, // ensure supabase email is primary
            streak: userProfile?.streak || 0,
            membershipType: userProfile?.membershipType || 'Basic',
            name: userProfile?.name || '',
            profileImage: profileImage || '',
            // Ensure all fields from AppUser are considered
            // For example, if AppUser can have fields not in SupabaseUser or profile
          };

          if (currentUser) {
            // Shallow compare relevant fields
            if (
              currentUser.id === newExtendedUser.id &&
              currentUser.email === newExtendedUser.email &&
              currentUser.name === newExtendedUser.name &&
              currentUser.streak === newExtendedUser.streak &&
              currentUser.membershipType === newExtendedUser.membershipType &&
              currentUser.profileImage === newExtendedUser.profileImage
            ) {
              return currentUser; // No change
            }
          }
          return newExtendedUser; // New user or changed user
        });
        setUserRole((userProfile?.role as UserRole) || 'user');
      } catch (error) {
        console.error('Error loading user profile in handleAuthChange:', error);
        // Set basic user from session if profile fetch fails
        setUser(session.user); 
        setUserRole('user');
      }
    } else {
      // No session, clear user
      setUser(prevUser => prevUser ? null : prevUser); // Only update if user was not already null
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

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password
    });
    
    // If sign up is successful, create a profile
    if (data?.user && !error) {
      await createUserProfile(data.user.id);
    }
    
    return { error };
  }, []); // createUserProfile is now a stable static helper

  const signIn = useCallback(async (email: string, password: string) => {
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
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Set user state to null first to improve UX during sign out
      setUser(null);
      setUserRole('user');
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Handle session_not_found error gracefully
        if (error.message.includes('session_not_found') || error.code === 'session_not_found') {
          console.log('Session already expired, continuing sign out process');
          toast.success('Signed out successfully');
          return;
        }
        
        // Show error for other issues
        console.error('Error signing out:', error);
        toast.error(error.message);
        return;
      }
      
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error(error.message || 'An error occurred during sign out');
      
      // Ensure we still clear local state even if server request fails
      setUser(null);
      setUserRole('user');
      setSession(null);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
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
  }, []);

  const deleteAccount = useCallback(async () => {
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
  }, [user?.id]);

  const value = useMemo(() => ({
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
  }), [
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
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 