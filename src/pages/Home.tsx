import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useXp } from '../context/XpContext';
import { useFeedback } from '../context/FeedbackContext';
import { MainLayout } from '../components/Layout/MainLayout';
import { PageContainer } from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { DailyQuoteCard } from '../components/ui/DailyQuoteCard';
import { FitnessTipCard } from '../components/ui/FitnessTipCard';
import { DailyChallenges, XpEarningGuide } from '../components/DailyChallenges';
import { LEVEL_XP_REQUIREMENTS } from '../lib/xpService';
import { useNavigate } from 'react-router-dom';

// Icons
import { 
  Flame, 
  User, 
  Settings, 
  CreditCard, 
  ArrowUp,
  Trophy,
  MessageSquare,
  BarChart,
  Calendar,
  ChevronRight
} from 'lucide-react';

// Enhanced Home page with engagement features
export default function Home() {
  const { user, userRole } = useAuth();
  const { calculateProgress, syncUserLevel } = useXp();
  const { hasSubmittedThisWeek } = useFeedback();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  
  // Simplified loading logic
  useEffect(() => {
    const loadData = async () => {
      try {
        // Ensure user level is synchronized with XP
        await syncUserLevel();
        
        // Simulate minimal data loading
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [syncUserLevel]);

  // Get XP progress information
  const xpProgress = calculateProgress();
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading your dashboard...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <PageContainer fullWidth>
        {/* Welcome section with account stats */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Fitness Enthusiast'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Track progress, earn XP, and achieve your fitness goals.
          </p>
        </div>
        
        {/* Weekly Feedback Prompt - Show only if user hasn't submitted feedback this week */}
        {!hasSubmittedThisWeek && (
          <Card className="mb-6 border-primary-200 bg-primary-50/50 dark:border-primary-900/30 dark:bg-primary-900/10">
            <div className="flex items-start gap-4 p-4 md:p-5">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-medium mb-1">Weekly Feedback</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 md:mb-4">
                  Share your thoughts about this week's experience!
                </p>
                <Button 
                  onClick={() => navigate('/weekly-feedback')}
                  className="w-full md:w-auto"
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {/* Main Dashboard */}
        <div className="space-y-6">
          {/* XP Status Card */}
          <Card className="overflow-hidden border-2 border-primary-100 dark:border-primary-900/20">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 p-4 md:px-6 md:py-5">
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 md:mr-4 shadow-sm">
                  <Flame className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-semibold">Experience Points</h2>
                  <div className="flex items-center mt-1">
                    <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                    <span className="text-sm font-medium">
                      Level {xpProgress.currentLevel}
                      {xpProgress.currentLevel >= 5 && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                          {xpProgress.currentLevel >= 20 ? "Master" :
                           xpProgress.currentLevel >= 15 ? "Expert" :
                           xpProgress.currentLevel >= 10 ? "Advanced" : "Intermediate"}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="ml-auto">
                  <p className="text-xl md:text-2xl font-bold">{xpProgress.currentXp} XP</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress to Level {xpProgress.currentLevel + 1}</span>
                  <span className="font-medium">{xpProgress.percent}%</span>
                </div>
                <Progress value={xpProgress.percent} className="h-2.5" />
                
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  <span>Level {xpProgress.currentLevel}</span>
                  <span>{xpProgress.nextLevelXp - xpProgress.currentXp} XP needed</span>
                  <span>Level {xpProgress.currentLevel + 1}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Daily Challenges */}
          <DailyChallenges />
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 md:hidden">
            <Card 
              className="p-3 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/profile')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-500" />
                </div>
                <div className="font-medium text-sm">Profile</div>
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/classes')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-500" />
                </div>
                <div className="font-medium text-sm">Classes</div>
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/membership')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </div>
                <div className="font-medium text-sm">Membership</div>
              </div>
            </Card>
            
            <Card 
              className="p-3 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-gray-500" />
                </div>
                <div className="font-medium text-sm">Settings</div>
              </div>
            </Card>
          </div>
          
          {/* XP Earning Guide */}
          <XpEarningGuide />
          
          {/* Fitness Quote */}
          <DailyQuoteCard />
          
          {/* Fitness Tip */}
          <FitnessTipCard />
          
          {/* Account Stats - Hidden on mobile */}
          <Card className="hidden md:block">
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Membership</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{userRole === 'admin' ? 'Premium' : 'Basic'}</span>
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Member Since</div>
                  <div className="text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">XP Level</div>
                  <div className="text-sm font-medium">Level {xpProgress.currentLevel}</div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Fitness Progress</div>
                  <div className="text-sm font-medium">
                    {xpProgress.percent >= 75 ? "Excellent" : 
                     xpProgress.percent >= 50 ? "Good" :
                     xpProgress.percent >= 25 ? "Fair" : "Just Started"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  );
} 