import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, Calendar, Flame } from "lucide-react";
import { useAttendance } from "../../context/AttendanceContext";
import { format } from "date-fns";

export const AttendanceSummary: React.FC = () => {
  const { checkedIn, loading, streak, refreshAttendance } = useAttendance();

  useEffect(() => {
    refreshAttendance();
  }, []);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-4 w-24 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Today's Attendance</span>
          <Badge variant={checkedIn ? "default" : "outline"}>
            {checkedIn ? (
              <>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Checked In
              </>
            ) : (
              <>
                <Calendar className="mr-1 h-3 w-3" /> Not Checked In
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(), "EEEE, MMM d")}</span>
          </div>
          
          <div className="flex items-center font-medium">
            <Flame className={`mr-1 h-4 w-4 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className={streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}>
              {streak} day{streak !== 1 ? 's' : ''} streak
            </span>
          </div>
        </div>
        
        {streak >= 5 && (
          <div className="mt-3 text-xs bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 p-2 rounded-md flex items-start">
            <Flame className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
            <p>Great job maintaining your {streak}-day streak! Keep it up!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 