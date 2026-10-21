import { useCallback, createContext, ReactNode, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { bookClass, cancelBooking, Class, ClassBooking, createClass, deleteClass, getClassesWithAvailability, getUserBookings, updateClass } from "../lib/classService";
import { useAuth } from "./AuthContext";

type ClassContextType = {
  classes: Class[];
  userBookings: ClassBooking[];
  isLoading: boolean;
  error: Error | null;
  refreshClasses: () => Promise<void>;
  refreshUserBookings: () => Promise<void>;
  createClass: (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => Promise<Class>;
  updateClass: (id: string, classData: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at'>>) => Promise<Class>;
  deleteClass: (id: string) => Promise<void>;
  bookClass: (classId: string) => Promise<ClassBooking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  isClassBooked: (classId: string) => boolean;
  getBookingForClass: (classId: string) => ClassBooking | undefined;
};

const ClassContext = createContext<ClassContextType | undefined>(undefined);

export function ClassProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [userBookings, setUserBookings] = useState<ClassBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const userId = user?.id;

  // Load classes on mount
  useEffect(() => {
    refreshClasses();
  }, []);

  // Refresh classes
  const refreshClasses = async () => {
    console.log('=== REFRESH CLASSES CALLED ===');
    console.log('Stack trace:', new Error().stack);
    
    setIsLoading(true);
    try {
      console.time('refreshClasses');
      const classesData = await getClassesWithAvailability();
      console.timeEnd('refreshClasses');
      
      console.log(`Retrieved ${classesData.length} classes`);
      setClasses(classesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh user bookings
  const refreshUserBookings = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const bookings = await getUserBookings(userId);
      setUserBookings(bookings);
      setError(null);
    } catch (err) {
      console.error("Error fetching user bookings:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to load your bookings");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load user bookings when user changes
  useEffect(() => {
    if (userId) {
      refreshUserBookings();
    } else {
      setUserBookings([]);
    }
  }, [userId, refreshUserBookings]);

  // Create a new class
  const createNewClass = async (classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    try {
      const newClass = await createClass(classData);
      await refreshClasses();
      return newClass;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a class
  const updateExistingClass = async (id: string, classData: Partial<Omit<Class, 'id' | 'created_at' | 'updated_at'>>) => {
    setIsLoading(true);
    try {
      const updatedClass = await updateClass(id, classData);
      await refreshClasses();
      return updatedClass;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a class
  const deleteExistingClass = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteClass(id);
      await refreshClasses();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Book a class
  const bookUserClass = async (classId: string) => {
    if (!user) {
      throw new Error("You must be logged in to book a class");
    }
    
    setIsLoading(true);
    try {
      const booking = await bookClass(classId, user.id);
      await refreshUserBookings();
      await refreshClasses(); // Refresh classes to update available spots
      return booking;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a booking
  const cancelUserBooking = async (bookingId: string) => {
    setIsLoading(true);
    try {
      await cancelBooking(bookingId);
      await refreshUserBookings();
      await refreshClasses(); // Refresh classes to update available spots
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a class is booked by the user
  const isClassBooked = (classId: string) => {
    return userBookings.some(
      booking => booking.class_id === classId && booking.attendance_status !== 'cancelled'
    );
  };

  // Get user's booking for a class
  const getBookingForClass = (classId: string) => {
    return userBookings.find(
      booking => booking.class_id === classId && booking.attendance_status !== 'cancelled'
    );
  };

  return (
    <ClassContext.Provider
      value={{
        classes,
        userBookings,
        isLoading,
        error,
        refreshClasses,
        refreshUserBookings,
        createClass: createNewClass,
        updateClass: updateExistingClass,
        deleteClass: deleteExistingClass,
        bookClass: bookUserClass,
        cancelBooking: cancelUserBooking,
        isClassBooked,
        getBookingForClass,
      }}
    >
      {children}
    </ClassContext.Provider>
  );
}

export function useClasses() {
  const context = useContext(ClassContext);
  if (context === undefined) {
    throw new Error("useClasses must be used within a ClassProvider");
  }
  return context;
}
