import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { isBefore, parseISO, startOfDay, addYears } from 'date-fns';
import { awardClassBookingXp, awardClassAttendanceXp, awardMultipleClassesXp } from './xpRewardsService';

// Class type for TypeScript
export type Class = {
  id: string;
  name: string;
  description?: string;
  instructor: string;
  date: string;
  time: string;
  duration: number; // in minutes
  capacity: number;
  location: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all levels';
  type: 'yoga' | 'cardio' | 'strength' | 'hiit' | 'dance' | 'pilates' | 'cycling' | 'other';
  image_url?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  available_spots?: number; // Calculated field, not in database
};

// Booking type for TypeScript
export type ClassBooking = {
  id: string;
  class_id: string;
  user_id: string;
  booking_date: string;
  attendance_status: 'booked' | 'attended' | 'no_show' | 'cancelled';
  class?: Class; // For joined queries
};

/**
 * Validate class date
 */
const validateClassDate = (date: string): boolean => {
  const classDate = parseISO(date);
  const today = startOfDay(new Date());
  const maxDate = addYears(today, 1);

  if (isBefore(classDate, today)) {
    throw new Error('Class date cannot be in the past');
  }

  if (isBefore(maxDate, classDate)) {
    throw new Error('Classes can only be scheduled up to 1 year in advance');
  }

  return true;
};

/**
 * Get all classes
 */
export const getAllClasses = async (): Promise<Class[]> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

/**
 * Get classes with available spots calculation
 */
export const getClassesWithAvailability = async (): Promise<Class[]> => {
  try {
    // First, get all classes
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]) // Only get future classes
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (classError) throw classError;
    if (!classes) return [];

    // For each class, get the count of bookings that are not cancelled
    const classesWithAvailability = await Promise.all(
      classes.map(async (classItem) => {
        const { data: bookings, error: bookingsError } = await supabase
          .from('class_bookings')
          .select('id')
          .eq('class_id', classItem.id)
          .neq('attendance_status', 'cancelled');

        if (bookingsError) {
          console.error('Error fetching bookings count:', bookingsError);
          return {
            ...classItem,
            available_spots: classItem.capacity,
          };
        }

        const bookedSpots = bookings?.length || 0;
        const availableSpots = classItem.capacity - bookedSpots;

        return {
          ...classItem,
          available_spots: availableSpots,
        };
      })
    );

    return classesWithAvailability;
  } catch (error) {
    console.error('Error fetching classes with availability:', error);
    throw error;
  }
};

/**
 * Get a single class by ID
 */
export const getClassById = async (id: string): Promise<Class | null> => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new class
 */
export const createClass = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<Class> => {
  try {
    // Validate class date
    validateClassDate(classData.date);

    const { data, error } = await supabase
      .from('classes')
      .insert([classData])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create class');
    
    toast.success('Class created successfully');
    return data;
  } catch (error) {
    console.error('Error creating class:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to create class');
    throw error;
  }
};

/**
 * Update a class
 */
export const updateClass = async (id: string, classData: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at'>>): Promise<Class> => {
  try {
    // If updating date, validate it
    if (classData.date) {
      validateClassDate(classData.date);
    }

    const { data, error } = await supabase
      .from('classes')
      .update(classData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to update class');
    
    toast.success('Class updated successfully');
    return data;
  } catch (error) {
    console.error('Error updating class:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to update class');
    throw error;
  }
};

/**
 * Delete a class
 */
export const deleteClass = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success('Class deleted successfully');
  } catch (error) {
    console.error('Error deleting class:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to delete class');
    throw error;
  }
};

/**
 * Book a class
 */
export const bookClass = async (classId: string, userId: string): Promise<ClassBooking> => {
  try {
    // First, check if the class has available spots
    const classData = await getClassById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    // Calculate available spots
    const { data: existingBookings, error: bookingCountError } = await supabase
      .from('class_bookings')
      .select('id')
      .eq('class_id', classId)
      .neq('attendance_status', 'cancelled');

    if (bookingCountError) throw bookingCountError;

    const bookedSpots = existingBookings?.length || 0;
    const availableSpots = classData.capacity - bookedSpots;

    if (availableSpots <= 0) {
      throw new Error('This class is fully booked');
    }

    // Check if the user is already booked for this class
    const { data: existingBooking, error: existingBookingError } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .neq('attendance_status', 'cancelled');

    if (existingBookingError) throw existingBookingError;
    
    if (existingBooking && existingBooking.length > 0) {
      throw new Error('You are already booked for this class');
    }

    // Check if there's a cancelled booking we can reactivate
    const { data: cancelledBooking, error: cancelledBookingError } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('class_id', classId)
      .eq('user_id', userId)
      .eq('attendance_status', 'cancelled')
      .maybeSingle();
      
    if (cancelledBookingError) throw cancelledBookingError;
    
    let bookingResult;
    
    if (cancelledBooking) {
      // Reactivate the cancelled booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('class_bookings')
        .update({ attendance_status: 'booked' })
        .eq('id', cancelledBooking.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      if (!updatedBooking) throw new Error('Failed to book class');
      
      bookingResult = updatedBooking;
    } else {
      // Create a new booking
      const { data: newBooking, error: createError } = await supabase
        .from('class_bookings')
        .insert([{
          class_id: classId,
          user_id: userId,
          booking_date: new Date().toISOString(),
          attendance_status: 'booked'
        }])
        .select()
        .single();
        
      if (createError) throw createError;
      if (!newBooking) throw new Error('Failed to book class');
      
      bookingResult = newBooking;
    }
    
    // Award XP for booking the class
    await awardClassBookingXp(userId, classData.name);
    
    toast.success('Class booked successfully');
    return bookingResult;
  } catch (error) {
    console.error('Error booking class:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('class_bookings')
      .update({ attendance_status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;
    
    toast.success('Booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    throw error;
  }
};

/**
 * Get user's bookings
 */
export const getUserBookings = async (userId: string): Promise<ClassBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('class_bookings')
      .select('*, class:classes(*)')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Get bookings for a class
 */
export const getClassBookings = async (classId: string): Promise<ClassBooking[]> => {
  try {
    const { data, error } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('class_id', classId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching class bookings:', error);
    throw error;
  }
};

/**
 * Mark a user as attended for a class
 * @param bookingId The booking ID
 * @param userId The user ID
 * @param classId The class ID
 * @returns The updated booking
 */
export const markAttendance = async (bookingId: string, userId: string, classId: string): Promise<ClassBooking> => {
  try {
    // Get class details
    const classData = await getClassById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }
    
    // Update the booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('class_bookings')
      .update({ attendance_status: 'attended' })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (updateError) throw updateError;
    if (!updatedBooking) throw new Error('Failed to update attendance');
    
    // Check if this is the first time attending this type of class
    const { data: previousAttendance, error: historyError } = await supabase
      .from('class_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('attendance_status', 'attended')
      .neq('id', bookingId) // Exclude the current booking
      .in('class_id', [classId]); // Same class
      
    if (historyError) {
      console.error('Error checking attendance history:', historyError);
    }
    
    const isFirstTime = !previousAttendance || previousAttendance.length === 0;
    
    // Award XP for attending the class
    await awardClassAttendanceXp(userId, classData.name, isFirstTime);
    
    // Check if user has attended multiple classes this week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const { data: weeklyAttendance, error: weeklyError } = await supabase
      .from('class_bookings')
      .select('id')
      .eq('user_id', userId)
      .eq('attendance_status', 'attended')
      .gte('booking_date', startOfWeek.toISOString());
      
    if (weeklyError) {
      console.error('Error checking weekly attendance:', weeklyError);
    } else if (weeklyAttendance) {
      // Award bonus XP for attending multiple classes in a week (3, 5, 7 classes)
      const weeklyCount = weeklyAttendance.length;
      
      if (weeklyCount === 3 || weeklyCount === 5 || weeklyCount === 7) {
        await awardMultipleClassesXp(userId, weeklyCount);
      }
    }
    
    toast.success('Attendance marked successfully');
    return updatedBooking;
  } catch (error) {
    console.error('Error marking attendance:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to mark attendance');
    throw error;
  }
};

/**
 * Mark a user as no-show for a class
 * @param bookingId The booking ID
 * @returns The updated booking
 */
export const markNoShow = async (bookingId: string): Promise<ClassBooking> => {
  try {
    // Update the booking status
    const { data: updatedBooking, error } = await supabase
      .from('class_bookings')
      .update({ attendance_status: 'no_show' })
      .eq('id', bookingId)
      .select()
      .single();
      
    if (error) throw error;
    if (!updatedBooking) throw new Error('Failed to update attendance');
    
    toast.success('User marked as no-show');
    return updatedBooking;
  } catch (error) {
    console.error('Error marking no-show:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to mark no-show');
    throw error;
  }
}; 