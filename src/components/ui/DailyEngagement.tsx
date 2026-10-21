import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

export function DailyEngagement() {
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Daily tasks with XP rewards
  const dailyTasks = [
    { 
      id: 'check-in', 
      title: 'Daily Check-in', 
      description: 'Check in to the app today', 
      xp: 10,
      icon: '📝'
    },
    { 
      id: 'workout', 
      title: 'Complete a Workout', 
      description: 'Log a workout session of at least 20 minutes', 
      xp: 50,
      icon: '💪'
    },
    { 
      id: 'water', 
      title: 'Track Water Intake', 
      description: 'Log your water consumption for the day', 
      xp: 15,
      icon: '💧'
    },
    { 
      id: 'steps', 
      title: 'Reach Step Goal', 
      description: 'Complete 8,000 steps today', 
      xp: 30,
      icon: '👣'
    },
    { 
      id: 'nutrition', 
      title: 'Log Nutrition', 
      description: 'Track your meals for the day', 
      xp: 25,
      icon: '🥗'
    },
    { 
      id: 'read', 
      title: 'Read Fitness Content', 
      description: 'Read an article about health or fitness', 
      xp: 15,
      icon: '📚'
    }
  ];
  
  const isTaskCompleted = (taskId: string) => {
    return completedTasks.includes(taskId);
  };
  
  const handleCompleteTask = async (taskId: string) => {
    if (isTaskCompleted(taskId)) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Award XP
      //await earnXp(xpAmount, `Completing task: ${taskId}`);
      
      // Mark task as completed
      setCompletedTasks(prev => [...prev, taskId]);
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dailyTasks.map(task => (
              <div 
                key={task.id} 
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{task.icon}</div>
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                    +{task.xp} XP
                  </span>
                  
                  <Button
                    size="sm"
                    variant={isTaskCompleted(task.id) ? "outline" : "default"}
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={isTaskCompleted(task.id) || isLoading}
                    className={isTaskCompleted(task.id) ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400" : ""}
                  >
                    {isTaskCompleted(task.id) ? (
                      <span className="flex items-center gap-1">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      "Complete"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Complete daily tasks to unlock weekly challenges!
            </p>
            <Button className="mt-4" disabled>
              Coming Soon
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
