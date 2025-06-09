import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { attendanceService } from "../lib/attendanceService";
import toast from "react-hot-toast";

interface AttendanceContextType {
  checkedIn: boolean;
  lastCheckIn: string | null;
  loading: boolean;
  streak: number;
  handleCheckIn: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const { user } = useAuth();

  const checkStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const todayCheckIn = await attendanceService.getTodayCheckIn(user.id);
      setCheckedIn(!!todayCheckIn);
      if (todayCheckIn) {
        setLastCheckIn(todayCheckIn.check_in_time);
      }
      
      // Get streak
      const currentStreak = await attendanceService.getAttendanceStreak(user.id);
      setStreak(currentStreak);
    } catch (error) {
      console.error("Error checking attendance status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [user]);

  const refreshAttendance = async () => {
    setLoading(true);
    await checkStatus();
  };

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
        
        const newStreak = await attendanceService.getAttendanceStreak(user.id);
        setStreak(newStreak);
        
        toast.success(`Checked in successfully! Current streak: ${newStreak} days`);
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
      handleCheckIn,
      refreshAttendance
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