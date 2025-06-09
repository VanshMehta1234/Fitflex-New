import { supabase } from '../supabase';

export type Attendance = {
  id: string;
  user_id: string;
  check_in_time: string;
  notes?: string;
  created_at: string;
};

export const attendanceService = {
  // Check in a user
  async checkIn(userId: string, notes?: string): Promise<Attendance | null> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          user_id: userId,
          check_in_time: new Date().toISOString(),
          notes
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error checking in:', error);
      return null;
    }

    return data;
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

  // Get user's attendance streak
  async getAttendanceStreak(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('attendance')
      .select('check_in_time')
      .eq('user_id', userId)
      .order('check_in_time', { ascending: false });

    if (error) {
      console.error('Error fetching attendance for streak:', error);
      return 0;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    // Calculate streak
    let streak = 1;
    let currentDate = new Date(data[0].check_in_time);
    
    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i].check_in_time);
      
      // Check if consecutive days
      const diffTime = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
        currentDate = prevDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return streak;
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