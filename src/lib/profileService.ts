import { supabase } from '../supabase';

// Types for profile update
export interface ProfileUpdateData {
  name?: string;
  profileImage?: string;

}

/**
 * Extract initials from name
 * @param name Full name
 * @returns Initials (1-2 characters)
 */
export const getInitials = (name: string): string => {
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
      .select('id')
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
    } else {
      // Update the existing profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbProfileData)
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    }
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
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error in getUserProfile query:', error);
      
      // If no profile found, return null instead of throwing
      if (error.code === 'PGRST116') {
        console.info('No profile found for user, will be created on update');
        return null;
      }
      
      throw error;
    }

    // Return the profile data with consistent naming
    if (data) {
      return {
        ...data,
        // Make sure we transform profile_image to profileImage for consistent frontend usage
        profileImage: data.profile_image,
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch profile data.');
  }
}; 