import { supabase } from '../supabase';
import { XpTransaction, XpSource } from '../types/xp';

// Constants for XP requirements per level
export const LEVEL_XP_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1350,
  8: 1750,
  9: 2200,
  10: 2700,
  11: 3250,
  12: 3850,
  13: 4500,
  14: 5200,
  15: 6000,
  16: 6850,
  17: 7750,
  18: 8700,
  19: 9700,
  20: 10750
};

/**
 * Calculate the user's level based on XP
 */
export const calculateLevelFromXp = (xp: number): number => {
  let level = 1;
  
  for (let i = 20; i > 0; i--) {
    if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
      level = i;
      break;
    }
  }
  
  return level;
};

/**
 * Add XP to a user's profile and record the transaction
 */
export const addXpToUser = async (
  userId: string,
  amount: number,
  description: string,
  source: XpSource
): Promise<boolean> => {
  try {
    console.log(`Adding ${amount} XP to user ${userId} for ${source}: ${description}`);
    
    // Get current user XP
    const { data, error: userError } = await supabase
      .from('profiles')
      .select('xp_points, level')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user XP:', userError);
      return false;
    }
    
    // Default to 0 XP and level 1 if no data returned
    const userData = data || { xp_points: 0, level: 1 };
    const currentXp = userData.xp_points || 0;
    const newXp = currentXp + amount;
    
    console.log(`Updating user XP: ${currentXp} → ${newXp}`);
    
    // Calculate current and new level
    const currentLevel = userData.level || calculateLevelFromXp(currentXp);
    const newLevel = calculateLevelFromXp(newXp);
    
    // Record XP transaction
    const { error: transactionError } = await supabase
      .from('xp_transactions')
      .insert([{
        user_id: userId,
        amount,
        description,
        source
      }]);
    
    if (transactionError) {
      console.error('Error recording XP transaction:', transactionError);
      return false;
    }
    
    // Update user profile with new XP and level
    const updateData = { 
      xp_points: newXp,
      level: newLevel
    };
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user XP in profile:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error adding XP to user:', error);
    return false;
  }
};

/**
 * Get user's XP transactions
 */
export const getUserXpTransactions = async (userId: string): Promise<XpTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('xp_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching XP transactions:', error);
      return [];
    }
    
    return data as XpTransaction[] || [];
  } catch (error) {
    console.error('Error in getUserXpTransactions:', error);
    return [];
  }
};

/**
 * Get user's total XP
 */
export const getUserTotalXp = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('xp_points')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user total XP:', error);
      return 0;
    }
    
    return data?.xp_points || 0;
  } catch (error) {
    console.error('Error in getUserTotalXp:', error);
    return 0;
  }
}; 