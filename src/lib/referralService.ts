import { supabase } from '../supabase';
import { nanoid } from 'nanoid';
import { addXpToUser } from './xpService';
import { XpSource } from '../types/xp';
import { awardReferralSentXp, awardReferralSignupXp } from './xpRewardsService';

// Define Referral and ReferralRedemption types
export interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  created_at: string;
  uses_count: number;
  max_uses: number;
  reward_xp: number;
  reward_points: number;
  is_active: boolean;
}

export interface ReferralRedemption {
  id: string;
  referral_id: string;
  redeemer_id: string;
  redeemed_at: string;
  reward_given: boolean;
  redeemer?: {
    name: string;
  };
}

// Cache for referral lookups to improve performance
const referralCache = new Map<string, {
  referral: Referral | null;
  timestamp: number;
}>();

// Cache timeout (5 minutes)
const REFERRAL_CACHE_TIMEOUT = 5 * 60 * 1000;

// Clear expired cache entries
const cleanupReferralCache = () => {
  const now = Date.now();
  // Using Array.from to convert Map entries to an array to avoid the MapIterator issue
  Array.from(referralCache.entries()).forEach(([code, entry]) => {
    if (now - entry.timestamp > REFERRAL_CACHE_TIMEOUT) {
      referralCache.delete(code);
    }
  });
};

// Clear cache every 10 minutes
setInterval(cleanupReferralCache, 10 * 60 * 1000);

// Add referral to cache
const cacheReferral = (code: string, referral: Referral | null) => {
  referralCache.set(code, {
    referral,
    timestamp: Date.now()
  });
  console.log(`Cached referral for code: ${code}`);
};

// Try to get referral from cache
const getReferralFromCache = (code: string): Referral | null | undefined => {
  const entry = referralCache.get(code);
  if (!entry) return undefined; // Not in cache
  
  // Check if cache entry is expired
  if (Date.now() - entry.timestamp > REFERRAL_CACHE_TIMEOUT) {
    referralCache.delete(code);
    return undefined; // Expired
  }
  
  console.log(`Using cached referral for code: ${code}`);
  return entry.referral;
};

/**
 * Generate a unique referral code
 */
export const generateReferralCode = async (userId: string): Promise<string> => {
  console.log('generateReferralCode called for userId:', userId);
  try {
    // Generate a base code from the user ID and a random string
    const userIdPart = userId && userId.length >= 5 ? userId.substring(0, 5) : 'USER';
    const baseCode = `${userIdPart}-${nanoid(6)}`.toUpperCase();
    console.log('Generated base code:', baseCode);
    
    // Check if code already exists and regenerate if needed
    const { data, error } = await supabase
      .from('referrals')
      .select('referral_code')
      .eq('referral_code', baseCode);
    
    if (error) {
      console.error('Error checking referral code uniqueness:', error);
      // Instead of failing, just generate a more unique code
      const fallbackCode = `${userIdPart}-${nanoid(10)}`.toUpperCase();
      console.log('Error occurred, using fallback code:', fallbackCode);
      return fallbackCode;
    }
      
    if (data && data.length > 0) {
      console.log('Code already exists, regenerating...');
      // If code exists, try again with a different random part
      return generateReferralCode(userId);
    }
    
    console.log('Code is unique, returning:', baseCode);
    return baseCode;
  } catch (error) {
    console.error('Unexpected error in generateReferralCode:', error);
    // Generate a fallback code with timestamp to ensure uniqueness
    const timestamp = Date.now().toString(36);
    const fallbackCode = `REF-${timestamp}${nanoid(4)}`.toUpperCase();
    console.log('Using emergency fallback code:', fallbackCode);
    return fallbackCode;
  }
};

// Helper function to store a referral code in localStorage when created
export const storeReferralCodeLocally = (userId: string, referralCode: string, referralId: string) => {
  try {
    // Get existing stored referrals or initialize empty object
    const storedReferrals = localStorage.getItem('fitflex_referrals');
    const referrals = storedReferrals ? JSON.parse(storedReferrals) : {};
    
    // Store this user's referral code
    referrals[userId] = {
      code: referralCode,
      id: referralId,
      createdAt: new Date().toISOString()
    };
    
    // Save back to localStorage
    localStorage.setItem('fitflex_referrals', JSON.stringify(referrals));
    console.log('Stored referral code in localStorage:', referralCode);
  } catch (error) {
    console.error('Failed to store referral code in localStorage:', error);
  }
};

// Helper function to get referral code from localStorage
export const getStoredReferralCode = (userId: string): {code: string, id: string} | null => {
  try {
    const storedReferrals = localStorage.getItem('fitflex_referrals');
    if (!storedReferrals) return null;
    
    const referrals = JSON.parse(storedReferrals);
    return referrals[userId] || null;
  } catch (error) {
    console.error('Failed to retrieve referral code from localStorage:', error);
    return null;
  }
};

/**
 * Creates a new referral for a user
 */
export const createReferral = async (userId: string): Promise<Referral | null> => {
  console.log('createReferral called with userId:', userId);
  try {
    // Check if user already has an active referral
    console.log('Checking for existing active referrals');
    const { data: existingReferrals, error: checkError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .eq('is_active', true);
    
    if (checkError) {
      console.error('Error checking existing referrals:', checkError);
      throw checkError;
    }
    
    console.log('Existing referrals found:', existingReferrals?.length);
    if (existingReferrals && existingReferrals.length > 0) {
      console.log('Returning existing active referral');
      // Update local storage with this existing referral
      storeReferralCodeLocally(
        userId, 
        existingReferrals[0].referral_code, 
        existingReferrals[0].id
      );
      return existingReferrals[0] as Referral;
    }
    
    // Generate a referral code
    const referralCode = await generateReferralCode(userId);
    console.log('Generated referral code:', referralCode);
    
    // Create a new referral
    console.log('Creating new referral in database');
    const newReferral = {
      referrer_id: userId,
      referral_code: referralCode,
      uses_count: 0,
      max_uses: 10,
      reward_xp: 500,
      reward_points: 0,
      is_active: true
    };
    
    console.log('Inserting referral:', newReferral);
    const { data, error } = await supabase
      .from('referrals')
      .insert([newReferral])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating referral:', error);
      throw error;
    }
    
    // Store the referral code in localStorage as a fallback
    storeReferralCodeLocally(userId, referralCode, data.id);
    
    // Award XP for creating a referral
    await awardReferralSentXp(userId);
    
    console.log('New referral created successfully:', data);
    return data as Referral;
  } catch (error) {
    console.error('Error creating referral:', error);
    return null;
  }
};

/**
 * Get user's referrals
 */
export const getUserReferrals = async (userId: string): Promise<Referral[]> => {
  console.log('getUserReferrals called with userId:', userId);
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching referrals:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} referrals for user`);
    return data as Referral[] || [];
  } catch (error) {
    console.error('Error in getUserReferrals:', error);
    return [];
  }
};

/**
 * Get a specific referral by code
 */
export const getReferralByCode = async (code: string): Promise<Referral | null> => {
  console.log('getReferralByCode called with code:', code);
  
  // Check cache first
  const cachedReferral = getReferralFromCache(code);
  if (cachedReferral !== undefined) {
    return cachedReferral;
  }
  
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', code)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching referral by code:', error);
      // Cache the negative result to avoid repeated lookups
      cacheReferral(code, null);
      return null;
    }
    
    console.log('Found referral for code:', data);
    // Cache the positive result
    cacheReferral(code, data as Referral);
    return data as Referral;
  } catch (error) {
    console.error('Error in getReferralByCode:', error);
    // Cache the negative result
    cacheReferral(code, null);
    return null;
  }
};

/**
 * Redeem a referral code
 */
export const redeemReferralCode = async (code: string, redeemerId: string): Promise<boolean> => {
  console.log('redeemReferralCode called with code:', code, 'redeemerId:', redeemerId);
  try {
    // Check if the code exists and is valid
    const referral = await getReferralByCode(code);
    
    if (!referral) {
      console.error('Invalid or inactive referral code');
      return false;
    }
    
    // Check if the user is trying to redeem their own code
    if (referral.referrer_id === redeemerId) {
      console.error('Cannot redeem your own referral code');
      return false;
    }
    
    // Check if this user has already redeemed this code
    const { data: existingRedemptions, error: checkError } = await supabase
      .from('referral_redemptions')
      .select('*')
      .eq('referral_id', referral.id)
      .eq('redeemer_id', redeemerId);
    
    if (checkError) {
      console.error('Error checking existing redemptions:', checkError);
      return false;
    }
    
    if (existingRedemptions && existingRedemptions.length > 0) {
      console.error('User has already redeemed this code');
      return false;
    }
    
    // Check if the referral has reached its maximum uses
    if (referral.uses_count >= referral.max_uses) {
      console.error('Referral code has reached maximum uses');
      return false;
    }
    
    // Create a new redemption record
    const { error: redemptionError } = await supabase
      .from('referral_redemptions')
      .insert([{
        referral_id: referral.id,
        redeemer_id: redeemerId,
        reward_given: true
      }]);
    
    if (redemptionError) {
      console.error('Error creating redemption record:', redemptionError);
      return false;
    }
    
    // Increment the uses count
    const { error: updateError } = await supabase
      .from('referrals')
      .update({ uses_count: referral.uses_count + 1 })
      .eq('id', referral.id);
    
    if (updateError) {
      console.error('Error updating referral uses count:', updateError);
      // We'll consider it a success anyway since the redemption was recorded
    }
    
    // Get redeemer's name for the XP award description
    const { data: redeemerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', redeemerId)
      .single();
      
    const redeemerName = profileError ? 'a new user' : (redeemerProfile?.name || 'a new user');
    
    // Award XP to both users
    try {
      // Award XP to the referrer using the new service
      await awardReferralSignupXp(referral.referrer_id, redeemerName);
      
      // Award XP to the redeemer
      const redeemBonus = 500; // Standard bonus for redeeming
      const redeemerSuccess = await addXpToUser(
        redeemerId,
        redeemBonus,
        `Bonus for using a referral code`,
        'referral_redemption'
      );
      
      if (!redeemerSuccess) {
        console.error('Failed to award XP to redeemer');
      } else {
        console.log(`Successfully awarded ${redeemBonus} XP to redeemer ${redeemerId}`);
      }
    } catch (error) {
      console.error('Error awarding XP:', error);
      // We'll consider it a success anyway
    }
    
    console.log('Referral code redeemed successfully');
    return true;
  } catch (error) {
    console.error('Error redeeming referral code:', error);
    return false;
  }
};

/**
 * Get redemptions for a user's referrals
 */
export const getReferralRedemptions = async (userId: string): Promise<ReferralRedemption[]> => {
  console.log('getReferralRedemptions called with userId:', userId);
  try {
    // First get the user's referrals
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('id')
      .eq('referrer_id', userId);
    
    if (referralsError) {
      console.error('Error fetching user referrals:', referralsError);
      return [];
    }
    
    if (!referrals || referrals.length === 0) {
      console.log('No referrals found for user');
      return [];
    }
    
    // Get all redemptions for these referrals
    const referralIds = referrals.map(r => r.id);
    const { data, error } = await supabase
      .from('referral_redemptions')
      .select('*')
      .in('referral_id', referralIds)
    
    if (error) {
      console.error('Error fetching referral redemptions:', error);
      return [];
    }
    
    console.log(`Found ${data?.length || 0} redemptions`);
    return data as ReferralRedemption[] || [];
  } catch (error) {
    console.error('Error in getReferralRedemptions:', error);
    return [];
  }
}; 