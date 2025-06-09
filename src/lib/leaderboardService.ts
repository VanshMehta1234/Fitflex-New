import { supabase } from '../supabase';

export interface LeaderboardUser {
  id: string;
  name: string;
  profile_image?: string;
  xp_points: number;
  level: number;
  rank: number;
}

/**
 * Get the global leaderboard sorted by XP points
 * @param limit The maximum number of users to return
 * @returns Array of users with their XP points and rank
 */
export const getGlobalLeaderboard = async (limit: number = 30): Promise<LeaderboardUser[]> => {
  try {
    console.log(`Fetching global leaderboard with limit: ${limit}`);
    
    // Get users sorted by XP points
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, profile_image, xp_points, level')
      .order('xp_points', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
    
    // Add rank to each user
    const rankedData = data.map((user, index) => ({
      ...user,
      rank: index + 1
    })) as LeaderboardUser[];
    
    console.log(`Global leaderboard returned ${rankedData.length} users`);
    return rankedData;
  } catch (error) {
    console.error('Error in getGlobalLeaderboard:', error);
    return [];
  }
};

/**
 * Get user's position in the global leaderboard
 * @param userId The user's ID
 * @returns The user's rank and total users count
 */
export const getUserLeaderboardPosition = async (userId: string): Promise<{ rank: number; totalUsers: number }> => {
  try {
    // First get the user's XP
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('xp_points')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user XP:', userError);
      return { rank: 0, totalUsers: 0 };
    }
    
    const userXp = userData?.xp_points || 0;
    
    // Count users with more XP (to determine rank)
    const { count, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gt('xp_points', userXp);
    
    if (countError) {
      console.error('Error counting users with more XP:', countError);
      return { rank: 0, totalUsers: 0 };
    }
    
    // Get total users count
    const { count: totalUsers, error: totalError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Error counting total users:', totalError);
      return { rank: 0, totalUsers: 0 };
    }
    
    // Rank is count + 1 (users with more XP + 1)
    return {
      rank: (count || 0) + 1,
      totalUsers: totalUsers || 0
    };
  } catch (error) {
    console.error('Error in getUserLeaderboardPosition:', error);
    return { rank: 0, totalUsers: 0 };
  }
};

/**
 * Get leaderboard for a specific time period (weekly/monthly)
 * Based on XP transactions within the time period
 * @param period 'weekly' or 'monthly'
 * @param limit The maximum number of users to return
 * @returns Array of users with their XP earned in the period and rank
 */
export const getTimePeriodLeaderboard = async (period: 'weekly' | 'monthly', limit: number = 30): Promise<LeaderboardUser[]> => {
  try {
    console.log(`Fetching ${period} leaderboard with limit: ${limit}`);
    
    const now = new Date();
    let startDate = new Date();
    
    if (period === 'weekly') {
      // Set start date to beginning of current week (Sunday)
      const day = now.getDay(); // 0 is Sunday
      startDate.setDate(now.getDate() - day);
    } else if (period === 'monthly') {
      // Set start date to beginning of current month
      startDate.setDate(1);
    }
    
    // Format date for Supabase query
    const startDateStr = startDate.toISOString();
    
    // Get XP transactions for the time period, aggregated by user
    const { data, error } = await supabase
      .rpc('get_period_leaderboard', { 
        start_date: startDateStr,
        limit_count: limit
      });
    
    if (error) {
      console.error(`Error fetching ${period} leaderboard:`, error);
      return [];
    }
    
    // Add rank to each user
    const rankedData = data.map((user: any, index: number) => ({
      id: user.user_id,
      name: user.name || 'Unknown User',
      profile_image: user.profile_image,
      xp_points: user.total_xp,
      level: user.level || 1,
      rank: index + 1
    })) as LeaderboardUser[];
    
    console.log(`${period} leaderboard returned ${rankedData.length} users`);
    return rankedData;
  } catch (error) {
    console.error(`Error in get${period.charAt(0).toUpperCase() + period.slice(1)}Leaderboard:`, error);
    return [];
  }
};

/**
 * Create SQL function for leaderboard
 * Run this once to set up the database function
 */
export const createLeaderboardFunction = async (): Promise<boolean> => {
  try {
    // This is a one-time setup function to create the stored procedure in the database
    const { error } = await supabase.rpc('create_leaderboard_function');
    
    if (error) {
      console.error('Error creating leaderboard function:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in createLeaderboardFunction:', error);
    return false;
  }
}; 