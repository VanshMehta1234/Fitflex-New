import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { useXp } from '../../context/XpContext';

export function ProgressDashboard() {
  const { userXp, userLevel } = useXp();
  const [isLoading] = useState(false);
  
  // Dummy progress metrics
  const metricsData = {
    workoutsCompleted: Math.floor(userXp / 20),
    caloriesBurned: Math.floor(userXp * 10),
    minutesActive: Math.floor(userXp * 5),
    streakDays: Math.min(Math.floor(userXp / 50), 30),
  };
  
  // Weekly goals - based on level
  const weeklyGoals = {
    workouts: 3 + Math.floor(userLevel / 3),
    calories: 1500 + (userLevel * 100),
    minutes: 150 + (userLevel * 10),
    streak: 5,
  };
  
  // Calculate progress percentages
  const calculatePercent = (current: number, goal: number) => {
    return Math.min(Math.floor((current / goal) * 100), 100);
  };
  
  const progressItems = [
    {
      title: 'Workouts Completed',
      current: metricsData.workoutsCompleted,
      goal: weeklyGoals.workouts,
      percent: calculatePercent(metricsData.workoutsCompleted, weeklyGoals.workouts),
      color: 'bg-blue-600 dark:bg-blue-500',
    },
    {
      title: 'Calories Burned',
      current: metricsData.caloriesBurned,
      goal: weeklyGoals.calories,
      percent: calculatePercent(metricsData.caloriesBurned, weeklyGoals.calories),
      color: 'bg-red-600 dark:bg-red-500',
      unit: 'kcal',
    },
    {
      title: 'Active Minutes',
      current: metricsData.minutesActive,
      goal: weeklyGoals.minutes,
      percent: calculatePercent(metricsData.minutesActive, weeklyGoals.minutes),
      color: 'bg-green-600 dark:bg-green-500',
      unit: 'min',
    },
    {
      title: 'Streak Days',
      current: metricsData.streakDays,
      goal: weeklyGoals.streak,
      percent: calculatePercent(metricsData.streakDays, weeklyGoals.streak),
      color: 'bg-amber-600 dark:bg-amber-500',
      unit: 'days',
    },
  ];
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-60">
              <p className="text-gray-500">Loading progress data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {progressItems.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {item.current} / {item.goal} {item.unit}
                    </span>
                  </div>
                  <Progress 
                    value={item.percent} 
                    className="h-2"
                    // Apply custom color
                    style={{
                      '--progress-color': `var(--${item.color.split('-')[1]}-600)`,
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Fitness Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">All-time Workouts</p>
              <p className="text-2xl font-bold mt-2">{metricsData.workoutsCompleted}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Streak</p>
              <p className="text-2xl font-bold mt-2">{metricsData.streakDays} days</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Calories</p>
              <p className="text-2xl font-bold mt-2">{metricsData.caloriesBurned} kcal</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Fitness Level</p>
              <p className="text-2xl font-bold mt-2">
                {userLevel >= 20 ? "Master" :
                 userLevel >= 15 ? "Expert" :
                 userLevel >= 10 ? "Advanced" :
                 userLevel >= 5 ? "Intermediate" : "Beginner"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 