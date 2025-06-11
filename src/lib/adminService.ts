import { supabase } from '../supabase';

// Define a profile type suitable for admin views
export type AdminProfile = {
  id: string;
  user_id: string; // Often the same as id if id is the auth.users.id
  role: string;
  created_at: string;
  email?: string; // Assuming email might be joined or added
  name?: string;  // Assuming name might be available
  // Add other fields as necessary based on what 'profiles' table contains
};

let cachedProfiles: {
  data: AdminProfile[] | null;
  timestamp: number | null;
} = {
  data: null,
  timestamp: null,
};

const PROFILES_TTL = 5 * 60 * 1000; // 5 minutes

export const getAllProfilesWithCache = async (): Promise<AdminProfile[]> => {
  const now = Date.now();
  if (cachedProfiles.data && cachedProfiles.timestamp && (now - cachedProfiles.timestamp < PROFILES_TTL)) {
    console.log('Serving all profiles from admin cache');
    return cachedProfiles.data;
  }

  console.log('Fetching all profiles for admin cache');
  const { data, error } = await supabase
    .from('profiles')
    .select('*'); // Adjust select if specific columns are known and sufficient

  if (error) {
    console.error('Error fetching all profiles:', error);
    throw error;
  }

  const profiles = data || [];
  cachedProfiles = {
    data: profiles,
    timestamp: now,
  };
  return profiles;
};

export const invalidateAllProfilesCache = (): void => {
  console.log('Invalidating all profiles admin cache');
  cachedProfiles.data = null;
  cachedProfiles.timestamp = null;
};
