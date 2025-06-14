import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the Supabase User type with our custom properties
export interface ExtendedUser extends SupabaseUser {
  streak?: number;
  membershipType: string;
  name?: string;
  profileImage?: string;
}

// Use this to properly type the user in our app
export type AppUser = ExtendedUser | null; 