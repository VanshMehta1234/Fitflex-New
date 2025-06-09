import React, { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "../ui/card";
import { useAuth } from "../../context/AuthContext";
import { attendanceService, Attendance } from "../../lib/attendanceService";
import { format } from "date-fns";
import { Calendar, Clock, Flame, AlertCircle } from "lucide-react";
import { Badge } from "../ui/badge";

export const AttendanceHistory: React.FC = () => {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const attendanceHistory = await attendanceService.getAttendanceHistory(user.id, 30);
        setHistory(attendanceHistory);
      } catch (error) {
        console.error("Error loading attendance history:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [user]);

  const renderAttendanceItem = (item: Attendance) => {
    const date = new Date(item.check_in_time);
    const formattedDate = format(date, "MMMM d, yyyy");
    const formattedTime = format(date, "h:mm a");
    
    return (
      <div key={item.id} className="border-b border-gray-100 dark:border-gray-800 py-3 last:border-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="h-3 w-3 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 ml-6">
          {item.streak_count && item.is_streak_day && (
            <Badge 
              variant="outline" 
              className={`flex items-center ${item.streak_count >= 7 ? 'text-orange-500 border-orange-200 dark:border-orange-800' : ''}`}
            >
              <Flame className="h-3 w-3 mr-1" />
              Day {item.streak_count} of streak
            </Badge>
          )}
          
          {item.streak_broken && (
            <Badge variant="outline" className="flex items-center text-red-500 border-red-200 dark:border-red-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              Streak reset
            </Badge>
          )}
          
          {!item.is_streak_day && !item.streak_broken && (
            <span className="text-xs text-gray-400">Additional check-in</span>
          )}
        </div>
        
        {item.notes && (
          <p className="text-sm text-gray-500 mt-1 ml-6">{item.notes}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <CardTitle className="mb-4">Attendance History</CardTitle>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex justify-between border-b pb-3">
                <div className="h-4 w-1/3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <CardTitle className="mb-4">Attendance History</CardTitle>
        <div className="space-y-0">
          {history.length > 0 ? (
            history.map(renderAttendanceItem)
          ) : (
            <div className="text-center py-8">
              <p>No attendance history found</p>
              <p className="text-sm text-muted-foreground">Check in to start tracking your attendance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 