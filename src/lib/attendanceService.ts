import { supabase } from '../supabase';
import { awardCheckInXp } from './xpRewardsService';

export type Attendance = {
  id: string;
  user_id: string;
  check_in_time: string;
  notes?: string;
  created_at: string;
  streak_count?: number;
  is_streak_day?: boolean;
  streak_broken?: boolean;
};

const attendanceService = {
  // Check in a user
  async checkIn(userId: string, notes?: string): Promise<Attendance | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      // Check if there was a check-in yesterday
      const { data: yesterdayData, error: yesterdayError } = await supabase
        .from('attendance')
        .select('check_in_time, streak_count')
        .eq('user_id', userId)
        .gte('check_in_time', yesterday.toISOString())
        .lt('check_in_time', today.toISOString())
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();
        
      if (yesterdayError && yesterdayError.code !== 'PGRST116') {
        console.error('Error checking yesterday\'s attendance:', yesterdayError);
      }
      
      // Get the most recent check-in regardless of date to determine streak
      const { data: lastCheckIn, error: lastCheckInError } = await supabase
        .from('attendance')
        .select('check_in_time, streak_count')
        .eq('user_id', userId)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();
        
      if (lastCheckInError && lastCheckInError.code !== 'PGRST116') {
        console.error('Error fetching last check-in:', lastCheckInError);
      }
      
      // Calculate streak and streak status
      let newStreak = 1; // Default to 1 for first check-in or broken streak
      let isStreakDay = true;
      let streakBroken = false;
      
      if (yesterdayData) {
        // If checked in yesterday, increment streak
        newStreak = (yesterdayData.streak_count || 0) + 1;
      } else if (lastCheckIn) {
        // No check-in yesterday, but have previous check-ins
        const lastCheckInDate = new Date(lastCheckIn.check_in_time);
        const diffTime = today.getTime() - lastCheckInDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Checked in day before yesterday (still counts as streak)
          newStreak = (lastCheckIn.streak_count || 0) + 1;
        } else {
          // Streak broken (more than 1 day gap)
          newStreak = 1;
          streakBroken = true;
        }
      }
      
      // Check if already checked in today
      const { data: todayCheck, error: todayCheckError } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', userId)
        .gte('check_in_time', today.toISOString())
        .limit(1);
        
      if (todayCheckError) {
        console.error('Error checking today\'s attendance:', todayCheckError);
      }
      
      // If already checked in today, this doesn't count as a streak day
      if (todayCheck && todayCheck.length > 0) {
        isStreakDay = false;
      }
      
      // Insert the attendance record with streak information
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            user_id: userId,
            check_in_time: new Date().toISOString(),
            notes,
            streak_count: newStreak,
            is_streak_day: isStreakDay,
            streak_broken: streakBroken
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error checking in:', error);
        return null;
      }
      
      // Award XP for the check-in if it's a streak day
      if (isStreakDay) {
        await awardCheckInXp(userId, newStreak);
      }

      return data;
    } catch (error) {
      console.error('Error in check-in process:', error);
      return null;
    }
  },

  // Get user's attendance history
  async getAttendanceHistory(userId: string, limit = 30): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }

    return data || [];
  },

  // Get today's check-in status for a user
  async getTodayCheckIn(userId: string): Promise<Attendance | null> {
    // Get start of today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', today.toISOString())
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking today\'s attendance:', error);
      return null;
    }

    return data || null;
  },

  // Get user's current attendance streak
  async getCurrentStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('attendance')
      .select('streak_count')
      .eq('user_id', userId)
      .eq('is_streak_day', true)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current streak:', error);
      return 0;
    }

    return data?.streak_count || 0;
  },

  // Get user's longest streak
  async getLongestStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('attendance')
      .select('streak_count')
      .eq('user_id', userId)
      .eq('is_streak_day', true)
      .order('streak_count', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching longest streak:', error);
      return 0;
    }

    return data?.streak_count || 0;
  },

  // Get all user attendance for a specific month (for admin)
  async getAllUserAttendance(year: number, month: number): Promise<Attendance[]> {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed in JS Date
    const endDate = new Date(year, month, 0); // last day of month
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching all user attendance:', error);
      return [];
    }

    return data || [];
  },
  
  // Get user attendance data for the given month
  async getUserAttendanceByMonth(userId: string, year: number, month: number): Promise<Attendance[]> {
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1); // month is 0-indexed in JS Date
    const endDate = new Date(year, month, 0); // last day of month
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching user attendance by month:', error);
      return [];
    }

    return data || [];
  }
};

export { attendanceService }; 