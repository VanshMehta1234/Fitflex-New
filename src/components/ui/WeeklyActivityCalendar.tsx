import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '../../lib/utils';
import { useXp } from '../../context/XpContext';

interface WeeklyActivityCalendarProps extends React.HTMLAttributes<HTMLDivElement> {}

// Generate last 28 days for the activity calendar
const generateCalendarDays = () => {
  const days = [];
  const today = new Date();
  
  for (let i = 27; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push({
      date,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      dateString: date.toISOString().split('T')[0],
    });
  }
  
  return days;
};

export function WeeklyActivityCalendar({ className, ...props }: WeeklyActivityCalendarProps) {
  const { userXp } = useXp();
  const [activityDays, setActivityDays] = useState<Record<string, number>>({});
  const calendarDays = useMemo(generateCalendarDays, []);
  
  // Generate random activity data based on user XP
  // In a real app, this would come from a database
  useEffect(() => {
    const mockData: Record<string, number> = {};
    const intensity = Math.max(1, Math.floor(userXp / 100)); // Activity intensity based on XP
    
    calendarDays.forEach(day => {
      // Randomly determine if there was activity on this day (more likely for recent days)
      const daysAgo = Math.floor((new Date().getTime() - day.date.getTime()) / (1000 * 60 * 60 * 24));
      const activityChance = 0.8 - (daysAgo * 0.02); // Higher chance for recent days
      
      if (Math.random() < activityChance) {
        // Random activity level (1-4)
        mockData[day.dateString] = Math.ceil(Math.random() * Math.min(4, intensity));
      }
    });
    
    setActivityDays(mockData);
  }, [userXp, calendarDays]);
  
  // Get activity level for rendering the heatmap
  const getActivityLevel = (dateString: string) => {
    return activityDays[dateString] || 0;
  };
  
  // Get class name based on activity level
  const getActivityClass = (level: number) => {
    if (level === 0) return "bg-gray-100 dark:bg-gray-800";
    if (level === 1) return "bg-green-200 dark:bg-green-900/30";
    if (level === 2) return "bg-green-300 dark:bg-green-800/40";
    if (level === 3) return "bg-green-400 dark:bg-green-700/60";
    return "bg-green-500 dark:bg-green-600/70"; 
  };
  
  // Group days by week for display
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  
  return (
    <Card className={cn("", className)} {...props}>
      <CardHeader className="pb-2">
        <CardTitle>Activity History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-2 flex flex-col space-y-1.5">
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>
          
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day) => {
                const activityLevel = getActivityLevel(day.dateString);
                const isToday = day.dateString === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={day.dateString}
                    className="relative aspect-square"
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-sm",
                        getActivityClass(activityLevel),
                        isToday && "ring-2 ring-primary-500 ring-offset-1"
                      )}
                      title={`${day.date.toLocaleDateString()}: ${activityLevel ? `Activity level ${activityLevel}` : 'No activity'}`}
                    >
                      <span className="sr-only">
                        {day.date.toLocaleDateString()}: 
                        {activityLevel ? `Activity level ${activityLevel}` : 'No activity'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Less
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900/30" />
            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800/40" />
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700/60" />
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600/70" />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            More
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
