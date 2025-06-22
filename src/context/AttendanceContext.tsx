import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { attendanceService } from "../lib/attendanceService";
import toast from "react-hot-toast";

interface AttendanceContextType {
  checkedIn: boolean;
  lastCheckIn: string | null;
  loading: boolean;
  streak: number;
  longestStreak: number;
  handleCheckIn: () => Promise<void>;
  checkStatus: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const { user } = useAuth();

  const checkStatus = async () => {
    if (!user) {
      // This case should ideally be handled by the useEffect not calling checkStatus,
      // but as a safeguard or for direct calls to refreshAttendance when logged out:
      setCheckedIn(false);
      setLastCheckIn(null);
      setStreak(0);
      setLongestStreak(0);
      setLoading(false);
      return;
    }
    
    setLoading(true); // Set loading true when we are about to fetch
    try {
      const todayCheckIn = await attendanceService.getTodayCheckIn(user.id);
      setCheckedIn(!!todayCheckIn);
      if (todayCheckIn) {
        setLastCheckIn(todayCheckIn.check_in_time);
        setStreak(todayCheckIn.streak_count || 0);
        setLongestStreak(todayCheckIn.streak_count || 0);
      }

    } catch (error) {
      console.error("Error checking attendance status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkStatus();
    } else {
      // User is not logged in or user object is cleared
      setCheckedIn(false);
      setLastCheckIn(null);
      setStreak(0);
      setLongestStreak(0);
      setLoading(false); // Ensure loading is false if no user
    }
  }, [user?.id]); // Depend on user.id for stability

  const handleCheckIn = async () => {
    if (!user) {
      toast.error("You must be logged in to check in");
      return;
    }

    if (checkedIn) {
      toast.success("You've already checked in today!");
      return;
    }

    setLoading(true);
    try {
      const result = await attendanceService.checkIn(user.id);
      
      if (result) {
        setCheckedIn(true);
        setLastCheckIn(result.check_in_time);
        
        // Get updated streak information
        if (result.is_streak_day) {
          const newStreak = result.streak_count || 0;
          setStreak(newStreak);
          
          if (newStreak > longestStreak) {
            setLongestStreak(newStreak);
          }
          
          // Show different messages based on streak
          if (newStreak >= 10) {
            toast.success(`Amazing! ${newStreak}-day streak! 🔥🔥🔥`);
          } else if (newStreak >= 5) {
            toast.success(`Great job! ${newStreak}-day streak! 🔥🔥`);
          } else if (newStreak > 1) {
            toast.success(`Checked in successfully! ${newStreak}-day streak! 🔥`);
          } else {
            toast.success("Checked in successfully! First day of your streak!");
          }
        } else {
          toast.success("Checked in again today!");
        }
      } else {
        toast.error("Check-in failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      toast.error("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AttendanceContext.Provider value={{ 
      checkedIn, 
      lastCheckIn, 
      loading, 
      streak,
      longestStreak,
      handleCheckIn,
      checkStatus
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (context === undefined) {
    throw new Error("useAttendance must be used within an AttendanceProvider");
  }
  return context;
} 