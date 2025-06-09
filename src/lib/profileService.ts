import { supabase } from '../supabase';
import { awardProfileCompletionXp } from './xpRewardsService';

// Types for profile update
export interface ProfileUpdateData {
  name?: string;
  profileImage?: string;
}

// Define proper profile type
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  streak?: number;
  membershipType?: string;
  profile_image?: string;
  profileImage?: string;
  bio?: string;
  location?: string;
  phone?: string;
  birthdate?: string;
  website?: string;
  [key: string]: any; // Allow for dynamic properties
}

/**
 * ProfileCache - Singleton class for efficient profile caching
 * Uses in-memory LRU cache with proper types and TTL
 */
class ProfileCache {
  private static instance: ProfileCache;
  private cache: Map<string, { data: UserProfile; timestamp: number }>;
  private pendingFetches: Map<string, Promise<UserProfile | null>>;
  private readonly TTL: number = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE: number = 100;

  private constructor() {
    this.cache = new Map();
    this.pendingFetches = new Map();
  }

  public static getInstance(): ProfileCache {
    if (!ProfileCache.instance) {
      ProfileCache.instance = new ProfileCache();
    }
    return ProfileCache.instance;
  }

  /**
   * Get a profile from cache or fetch it
   */
  public async getProfile(userId: string): Promise<UserProfile | null> {
    // Check cache first
    const cacheEntry = this.cache.get(userId);
    const now = Date.now();
    
    // Return if valid cache entry exists
    if (cacheEntry && (now - cacheEntry.timestamp < this.TTL)) {
      return cacheEntry.data;
    }
    
    // If there's already a pending fetch, return that promise
    if (this.pendingFetches.has(userId)) {
      return this.pendingFetches.get(userId) as Promise<UserProfile | null>;
    }
    
    // Start a new fetch
    const fetchPromise = this.fetchProfile(userId);
    this.pendingFetches.set(userId, fetchPromise);
    
    try {
      const result = await fetchPromise;
      return result;
    } finally {
      // Clean up pending fetch regardless of outcome
      this.pendingFetches.delete(userId);
    }
  }
  
  /**
   * Fetch profile from the database
   */
  private async fetchProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No profile found
        }
        throw error;
      }
      
      if (data) {
        const profile: UserProfile = {
          ...data,
          profileImage: data.profile_image, // Ensure consistent naming
        };
        
        this.set(userId, profile);
        return profile;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile data');
    }
  }
  
  /**
   * Store a profile in the cache
   */
  public set(userId: string, profile: UserProfile): void {
    // Manage cache size using LRU eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(userId, {
      data: profile,
      timestamp: Date.now()
    });
  }
  
  /**
   * Invalidate a specific cache entry
   */
  public invalidate(userId: string): void {
    this.cache.delete(userId);
  }
  
  /**
   * Clear the entire cache
   */
  public clear(): void {
    this.cache.clear();
  }
}

// Export the singleton instance
export const profileCache = ProfileCache.getInstance();

/**
 * Extract initials from name
 * @param name Full name
 * @returns Initials (1-2 characters)
 */
export const getInitials = (name: string | undefined): string => {
  if (!name || name.trim() === '') return '?';
  
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Uploads a profile image to storage
 * In a real application, this would upload to a server or cloud storage
 * For this demo, it converts the image to a data URL
 */
export async function uploadProfileImage(file: File, userId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      reject(new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the 5MB limit`));
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Invalid file type. Please use JPEG, PNG, GIF, or WebP.'));
      return;
    }
    
    // In a real app, this would be a server upload
    // For demo purposes, convert to data URL
    const reader = new FileReader();
    
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // In a real app, would return the URL from server
        // Make sure the data URL is valid
        if (reader.result.startsWith('data:image/')) {
          resolve(reader.result);
        } else {
          reject(new Error('Invalid image data'));
        }
      } else {
        reject(new Error('Failed to read image'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read image: ' + reader.error?.message || 'Unknown error'));
    };
    
    // Start reading the file
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error('Failed to process image: ' + (error instanceof Error ? error.message : 'Unknown error')));
    }
  });
}

/**
 * Update user profile in the database
 * @param userId The user's ID
 * @param profileData The profile data to update
 */
export const updateUserProfile = async (userId: string, profileData: ProfileUpdateData): Promise<void> => {
  try {
    // First check if the profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, profile_image')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned"
      throw fetchError;
    }

    // Transform profileImage to profile_image for database consistency
    const dbProfileData = {
      ...profileData,
      profile_image: profileData.profileImage,
    };
    
    // Remove the original profileImage field to avoid duplicating it
    delete (dbProfileData as any).profileImage;

    // Check if this is the first time completing the profile
    let isFirstTimeCompletion = false;
    
    if (!existingProfile) {
      // Create a new profile if it doesn't exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          ...dbProfileData,
          role: 'user',
          streak: 0,
          membershipType: 'Basic',
        }]);

      if (insertError) {
        throw insertError;
      }
      
      // If they provided a name and profile image during creation, consider it complete
      if (profileData.name && profileData.profileImage) {
        isFirstTimeCompletion = true;
      }
    } else {
      // Update the existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbProfileData)
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
      
      // Check if this is the first time completing the profile
      // (previously had no name or profile image, but now has both)
      const hadNameBefore = !!existingProfile.name;
      const hadImageBefore = !!existingProfile.profile_image;
      const hasNameNow = !!profileData.name;
      const hasImageNow = !!profileData.profileImage;
      
      // Consider profile complete if both name and image are added and at least one was missing before
      if (hasNameNow && hasImageNow && (!hadNameBefore || !hadImageBefore)) {
        isFirstTimeCompletion = true;
      }
    }
    
    // Award XP for completing profile if applicable
    if (isFirstTimeCompletion && userId) {
      await awardProfileCompletionXp(userId);
    }
    
    // Invalidate the cache entry for this user
    profileCache.invalidate(userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile. Please try again.');
  }
};

/**
 * Get the user's full profile from the database
 * @param userId The user's ID
 * @returns The complete profile data
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    return await profileCache.getProfile(userId);
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw new Error('Failed to fetch profile data.');
  }
}; 