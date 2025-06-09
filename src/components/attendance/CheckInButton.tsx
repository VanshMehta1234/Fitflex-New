import React from "react";
import { Button } from "../ui/button";
import { useAttendance } from "../../context/AttendanceContext";
import { CalendarCheck, Loader2 } from "lucide-react";

export const CheckInButton: React.FC = () => {
  const { checkedIn, lastCheckIn, loading, handleCheckIn } = useAttendance();

  if (loading) {
    return (
      <Button 
        disabled 
        className="w-full h-12 text-base font-medium bg-muted/50"
      >
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (checkedIn) {
    return (
      <Button 
        disabled 
        className="w-full h-12 text-base font-medium bg-green-600 hover:bg-green-600"
      >
        <CalendarCheck className="mr-2 h-5 w-5" />
        Checked In {lastCheckIn ? `at ${new Date(lastCheckIn).toLocaleTimeString()}` : ""}
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleCheckIn} 
      className="w-full h-12 text-base font-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
    >
      <CalendarCheck className="mr-2 h-5 w-5" />
      Check In Now
    </Button>
  );
}; 