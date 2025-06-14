import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo, useCallback } from "react";
import { supabase } from '../supabase';
import { useAuth } from "./AuthContext";
import toast from "react-hot-toast";
import { profileCache, UserProfile } from "../lib/profileService";
import { awardFeedbackSubmissionXp } from "../lib/xpRewardsService";

// Define feedback form type
export interface FeedbackForm {
  id: string;
  user_id: string;
  form_type: 'weekly' | 'class' | 'general';
  category: string;
  ratings: {
    [key: string]: number;
  };
  comments?: string;
  is_anonymous: boolean;
  submitted_at: string;
  week_number: number;
  year: number;
  created_at: string;
  user?: {
    name: string;
    email: string;
    profile_image: string;
  } | null;
}

// Define the weekly feedback data type
export type WeeklyFeedbackData = {
  category: string;
  ratings: {
    [key: string]: number;
  };
  comments?: string;
  is_anonymous?: boolean;
};

// Define the context type
type FeedbackContextType = {
  feedbackForms: FeedbackForm[];
  isLoading: boolean;
  submitWeeklyFeedback: (feedbackData: WeeklyFeedbackData) => Promise<FeedbackForm | null>;
  getCurrentWeekFeedback: () => FeedbackForm | null;
  hasSubmittedThisWeek: boolean;
  adminFeedbackForms: FeedbackForm[];
  loadAdminFeedback: (forceRefresh?: boolean) => Promise<void>;
  isAdminLoading: boolean;
};

// Create the context
const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Create the provider component
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [adminFeedbackForms, setAdminFeedbackForms] = useState<FeedbackForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const { user, userRole } = useAuth();
  const lastAdminFetchRef = useRef<number>(0);
  const isFetchingAdminData = useRef<boolean>(false);
  const autoRefreshTimerRef = useRef<number | null>(null);
  const initialLoadCompletedRef = useRef<boolean>(false);
  const adminDataCacheKey = 'fitflex_admin_feedback_cache';
  const loadedUserRef = useRef<string | null>(null);

  // Function to get the current week number and year
  const getWeekInfo = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 604800000; // milliseconds in a week
    const weekNumber = Math.floor(diff / oneWeek) + 1;
    return { week_number: weekNumber, year: now.getFullYear() };
  }, []);

  // Function to get feedback from the current week
  const getCurrentWeekFeedback = useCallback((): FeedbackForm | null => {
    if (!feedbackForms.length || !user) return null;
    
    const { week_number, year } = getWeekInfo();
    
    return feedbackForms.find(
      (form) => 
        form.form_type === "weekly" && 
        form.week_number === week_number && 
        form.year === year
    ) || null;
  }, [feedbackForms, user, getWeekInfo]);

  // Calculate if the user has submitted feedback for the current week
  const hasSubmittedThisWeek = useMemo(() => !!getCurrentWeekFeedback(), [getCurrentWeekFeedback]);

  // Try to load cached admin feedback data from session storage
  useEffect(() => {
    // Only attempt to load from cache if we're admin and don't have data yet
    if (user && 
        userRole === 'admin' && 
        adminFeedbackForms.length === 0 && 
        !isAdminLoading &&
        !isFetchingAdminData.current) {
      try {
        const cachedData = sessionStorage.getItem(adminDataCacheKey);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const age = Date.now() - timestamp;
          // Only use cached data if it's less than 5 minutes old
          if (age < 5 * 60 * 1000 && Array.isArray(data) && data.length > 0) {
            console.log(`FeedbackContext - Using cached admin data (${Math.round(age / 1000)}s old)`);
            setAdminFeedbackForms(data);
            lastAdminFetchRef.current = timestamp;
          } else {
            console.log("FeedbackContext - Cached admin data expired or invalid");
            sessionStorage.removeItem(adminDataCacheKey);
          }
        }
      } catch (error) {
        console.error("FeedbackContext - Error loading cached admin data:", error);
        sessionStorage.removeItem(adminDataCacheKey);
      }
    }
  }, [user?.id, userRole]); // Only re-run when user ID or role changes, not on every render

  // Load user's feedback forms
  useEffect(() => {
    async function loadFeedbackForms() {
      if (!user) {
        setFeedbackForms([]);
        setIsLoading(false);
        return;
      }

      // Skip if we've already loaded for this user
      if (loadedUserRef.current === user.id) {
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("feedback_forms")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading feedback forms:", error);
          toast.error("Failed to load feedback history");
          return;
        }

        setFeedbackForms(data || []);
        // Mark this user as loaded to prevent redundant fetches
        loadedUserRef.current = user.id;
      } catch (error) {
        console.error("Error in loadFeedbackForms:", error);
        toast.error("Failed to load feedback history");
      } finally {
        setIsLoading(false);
      }
    }

    loadFeedbackForms();
  }, [user?.id]); // Only depend on user ID, not the entire user object

  // Auto-refresh admin data periodically if the user is an admin
  useEffect(() => {
    // Clear any existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
    
    // Only set up auto-refresh if user is logged in and is admin
    if (user && userRole === 'admin') {
      console.log("FeedbackContext - Setting up auto-refresh timer");
      
      // Perform initial load if needed with debounce to prevent load spike on mount
      if (!initialLoadCompletedRef.current && adminFeedbackForms.length === 0 && !isFetchingAdminData.current) {
        console.log("FeedbackContext - Scheduling initial load with debounce");
        const debounceTimer = setTimeout(() => {
          if (adminFeedbackForms.length === 0 && !isFetchingAdminData.current) {
            console.log("FeedbackContext - Executing debounced initial load");
            loadAdminFeedback(true).catch(err => {
              console.error("Initial admin data load failed:", err);
            });
          }
          initialLoadCompletedRef.current = true;
        }, 1000); // 1 second debounce delay
        
        // Cleanup the debounce timer
        return () => clearTimeout(debounceTimer);
      }
      
      // Refresh every 10 minutes (600000ms)
      autoRefreshTimerRef.current = window.setInterval(() => {
        console.log("FeedbackContext - Auto-refresh triggered");
        loadAdminFeedback(false).catch(err => {
          console.error("Auto-refresh failed:", err);
        });
      }, 600000); // 10 minutes
    }
    
    // Clean up on unmount or when dependencies change
    return () => {
      if (autoRefreshTimerRef.current) {
        console.log("FeedbackContext - Clearing auto-refresh timer");
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [user?.id, userRole]); // Only depend on user ID and role

  // Helper function to batch array into chunks
  function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Load admin feedback with proper dependency isolation to prevent circular dependencies
  const loadAdminFeedback = useCallback(async (forceRefresh = false): Promise<void> => {
    // Store the current state values in local variables to avoid closure issues
    const currentUser = user;
    const currentUserRole = userRole;
    
    console.log("FeedbackContext - loadAdminFeedback called", { 
      forceRefresh, 
      hasUser: !!currentUser, 
      userRole: currentUserRole,
      currentDataCount: adminFeedbackForms.length 
    });
    
    // If no user is logged in, there's nothing to do
    if (!currentUser) {
      console.log("FeedbackContext - No user logged in, skipping admin feedback load");
      return Promise.resolve();
    }
    
    // Check admin status
    const hasAdminAccess = currentUserRole === 'admin';
    
    // Check access permissions
    if (!hasAdminAccess) {
      console.log("FeedbackContext - Access denied for:", currentUser.email);
      return Promise.reject(new Error("Admin access denied"));
    }
    
    // Critical throttling - prevent duplicate fetches
    if (isFetchingAdminData.current) {
      console.log("FeedbackContext - Already fetching data, skipping");
      return Promise.resolve();
    }
    
    // Apply stricter throttling - but always allow forced refreshes
    const now = Date.now();
    const THROTTLE_DELAY = 30000; // Reduced to 30 seconds (from 120000) for better UX
    const currentAdminForms = adminFeedbackForms.length;
    
    if (!forceRefresh && currentAdminForms > 0 && (now - lastAdminFetchRef.current < THROTTLE_DELAY)) {
      const timeSinceLastFetch = Math.round((now - lastAdminFetchRef.current) / 1000);
      console.log(`FeedbackContext - Throttling refresh, last fetch was ${timeSinceLastFetch}s ago (minimum interval: ${THROTTLE_DELAY / 1000}s)`);
      return Promise.resolve();
    }
    
    // Set loading state and flags
    isFetchingAdminData.current = true;
    setIsAdminLoading(true);
    
    try {
      console.log("FeedbackContext - Fetching admin feedback data");
      
      // First, fetch all feedback forms without the user JOIN
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback_forms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      console.log("FeedbackContext - Feedback data received:", feedbackData ? feedbackData.length : 0, "records");
      
      if (feedbackError) {
        console.error("Error loading feedback forms:", feedbackError);
        toast.error("Failed to load feedback data");
        setIsAdminLoading(false);
        isFetchingAdminData.current = false;
        return Promise.reject(feedbackError);
      }
      
      // Only if we have feedback data, get the unique user IDs
      if (feedbackData && feedbackData.length > 0) {
        // Extract unique user IDs from feedback forms
        const uniqueUserIds = Array.from(new Set(
          feedbackData
            .filter(form => !form.is_anonymous)
            .map(form => form.user_id)
        ));
        
        // If we have unique user IDs, fetch their profiles from cache or in batches
        let userProfiles: Record<string, UserProfile> = {};
        
        if (uniqueUserIds.length > 0) {
          console.log(`FeedbackContext - Loading profiles for ${uniqueUserIds.length} users`);
          
          // First try to get profiles from cache
          const cachedProfiles: Record<string, UserProfile> = {};
          const uncachedUserIds: string[] = [];
          
          // Process in parallel for better performance
          await Promise.all(uniqueUserIds.map(async (userId) => {
            try {
              const profile = await profileCache.getProfile(userId);
              if (profile) {
                cachedProfiles[userId] = profile;
              } else {
                uncachedUserIds.push(userId);
              }
            } catch (error) {
              // If there's an error getting from cache, we'll fetch it
              uncachedUserIds.push(userId);
            }
          }));
          
          console.log(`FeedbackContext - Found ${Object.keys(cachedProfiles).length} cached profiles, need to fetch ${uncachedUserIds.length}`);
          
          // If we have profiles to fetch, do it in batches of 20
          if (uncachedUserIds.length > 0) {
            // Split into chunks of 20 for efficient batching
            const userIdChunks = chunkArray(uncachedUserIds, 20);
            
            // Process batches in parallel
            await Promise.all(userIdChunks.map(async (chunk) => {
              try {
                const { data: profilesData, error: profilesError } = await supabase
                  .from("profiles")
                  .select("id, name, email, profile_image, membership_type")
                  .in("id", chunk);
                
                if (profilesError) {
                  console.error("Error loading user profiles chunk:", profilesError);
                  return; // Continue with what we have
                }
                
                if (profilesData) {
                  // Add to our profiles collection and update cache
                  for (const profile of profilesData) {
                    const userProfile: UserProfile = {
                      ...profile,
                      profileImage: profile.profile_image,
                      membershipType: profile.membership_type,
                    };
                    
                    // Store in our local result
                    userProfiles[profile.id] = userProfile;
                    
                    // Also update the cache
                    profileCache.set(profile.id, userProfile);
                  }
                }
              } catch (error) {
                console.error("Error fetching profile batch:", error);
              }
            }));
          }
          
          // Merge cached profiles with fetched ones
          userProfiles = { ...cachedProfiles, ...userProfiles };
        }
        
        // Merge the feedback data with user profiles
        const enrichedFeedbackData = feedbackData.map(form => {
          if (form.is_anonymous) {
            return { ...form, user: null };
          }
          
          const profile = userProfiles[form.user_id];
          
          return {
            ...form,
            user: profile ? {
              name: profile.name || 'Unknown User',
              email: profile.email || '',
              profile_image: profile.profile_image || profile.profileImage || ''
            } : null
          };
        });
        
        // Update timestamp and data
        const fetchTimestamp = Date.now();
        lastAdminFetchRef.current = fetchTimestamp;
        setAdminFeedbackForms(enrichedFeedbackData);
        console.log("FeedbackContext - Fetch complete, received", enrichedFeedbackData.length, "items");
        
        // Cache the data in session storage
        try {
          sessionStorage.setItem(adminDataCacheKey, JSON.stringify({
            timestamp: fetchTimestamp,
            data: enrichedFeedbackData
          }));
          console.log("FeedbackContext - Admin data cached in session storage");
        } catch (cacheError) {
          console.warn("FeedbackContext - Failed to cache admin data:", cacheError);
        }
      } else {
        // No feedback data, set empty array
        setAdminFeedbackForms([]);
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error in loadAdminFeedback:", error);
      toast.error("Failed to load feedback data");
      return Promise.reject(error);
    } finally {
      // Always reset flags regardless of success/failure
      setIsAdminLoading(false);
      isFetchingAdminData.current = false;
    }
  }, [user, userRole]);

  // Submit weekly feedback
  const submitWeeklyFeedback = useCallback(async (feedbackData: WeeklyFeedbackData): Promise<FeedbackForm | null> => {
    if (!user) {
      toast.error("You must be logged in to submit feedback");
      return null;
    }

    setIsLoading(true);
    try {
      const { week_number, year } = getWeekInfo();
      
      const formData = {
        user_id: user.id,
        form_type: "weekly" as const,
        category: feedbackData.category,
        ratings: feedbackData.ratings,
        comments: feedbackData.comments || null,
        is_anonymous: feedbackData.is_anonymous || false,
        submitted_at: new Date().toISOString(),
        week_number,
        year
      };

      const { data, error } = await supabase
        .from("feedback_forms")
        .insert([formData])
        .select()
        .single();

      if (error) {
        console.error("Error submitting feedback:", error);
        toast.error("Failed to submit feedback");
        return null;
      }

      // Award XP for submitting feedback
      await awardFeedbackSubmissionXp(user.id);
      
      toast.success("Feedback submitted successfully! +25 XP");
      
      // Update local state
      setFeedbackForms((prev) => [data, ...prev]);
      
      return data;
    } catch (error) {
      console.error("Error in submitWeeklyFeedback:", error);
      toast.error("Failed to submit feedback");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, getWeekInfo]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    feedbackForms,
    isLoading,
    submitWeeklyFeedback,
    getCurrentWeekFeedback,
    hasSubmittedThisWeek,
    adminFeedbackForms,
    loadAdminFeedback,
    isAdminLoading
  }), [
    feedbackForms,
    isLoading,
    submitWeeklyFeedback,
    getCurrentWeekFeedback,
    hasSubmittedThisWeek,
    adminFeedbackForms,
    loadAdminFeedback,
    isAdminLoading
  ]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}
    </FeedbackContext.Provider>
  );
}

// Create the hook
export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  
  // Log when the hook is used and the current state
  console.log("useFeedback hook called", { 
    feedbackCount: context.feedbackForms.length,
    adminFeedbackCount: context.adminFeedbackForms.length,
    isLoading: context.isLoading,
    isAdminLoading: context.isAdminLoading,
    hasSubmittedThisWeek: context.hasSubmittedThisWeek
  });
  
  return context;
} 