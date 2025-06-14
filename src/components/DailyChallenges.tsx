import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Calendar, 
  Trophy, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Star, 
  Dumbbell, 
  Share2, 
  ArrowRight,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useXp } from '../context/XpContext';
import { XP_REWARDS } from '../lib/xpRewardsService';
import { cn } from '../lib/utils';

// Challenge type definition
export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: React.ReactNode;
  route: string;
  isCompleted?: boolean;
  progress?: number;
}

export const DailyChallenges: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userXp, xpTransactions } = useXp();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  
  // Generate daily challenges based on user activity
  useEffect(() => {
    if (!user) return;
    
    // Get today's date for checking daily activities
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check for today's transactions to determine completed challenges
    const todayTransactions = xpTransactions.filter(tx => {
      const txDate = new Date(tx.created_at);
      return txDate >= today;
    });
    
    // Check if specific activities were completed today
    const hasCheckedIn = todayTransactions.some(tx => 
      tx.description.includes('check-in'));
    
    const hasBookedClass = todayTransactions.some(tx => 
      tx.description.includes('Booked'));
    
    const hasAttendedClass = todayTransactions.some(tx => 
      tx.description.includes('Attended'));
    
    const hasSubmittedFeedback = todayTransactions.some(tx => 
      tx.description.includes('feedback'));
    
    const hasSentReferral = todayTransactions.some(tx => 
      tx.description.includes('referral'));
    
    // Create daily challenges
    const dailyChallenges: Challenge[] = [
      {
        id: 'checkin',
        title: 'Daily Check-in',
        description: 'Check in at the gym today',
        xpReward: XP_REWARDS.DAILY_CHECK_IN,
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        route: '/attendance',
        isCompleted: hasCheckedIn,
        progress: hasCheckedIn ? 100 : 0
      },
      {
        id: 'book-class',
        title: 'Book a Class',
        description: 'Book any fitness class',
        xpReward: XP_REWARDS.CLASS_BOOKING,
        icon: <Dumbbell className="h-5 w-5 text-purple-500" />,
        route: '/classes',
        isCompleted: hasBookedClass,
        progress: hasBookedClass ? 100 : 0
      },
      {
        id: 'attend-class',
        title: 'Attend a Class',
        description: 'Attend a booked fitness class',
        xpReward: XP_REWARDS.CLASS_ATTENDANCE,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        route: '/classes',
        isCompleted: hasAttendedClass,
        progress: hasAttendedClass ? 100 : 0
      },
      {
        id: 'feedback',
        title: 'Weekly Feedback',
        description: 'Submit your weekly gym feedback',
        xpReward: XP_REWARDS.WEEKLY_FEEDBACK_SUBMISSION,
        icon: <MessageSquare className="h-5 w-5 text-amber-500" />,
        route: '/weekly-feedback',
        isCompleted: hasSubmittedFeedback,
        progress: hasSubmittedFeedback ? 100 : 0
      },
      {
        id: 'refer',
        title: 'Refer a Friend',
        description: 'Invite a friend to join FitFlex',
        xpReward: XP_REWARDS.REFERRAL_SENT,
        icon: <Users className="h-5 w-5 text-indigo-500" />,
        route: '/refer',
        isCompleted: hasSentReferral,
        progress: hasSentReferral ? 100 : 0
      }
    ];
    
    setChallenges(dailyChallenges);
  }, [user, xpTransactions]);
  
  const navigateToChallenge = (route: string) => {
    navigate(route);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-primary-500" />
              Daily XP Challenges
            </CardTitle>
            <CardDescription>Complete challenges to earn XP</CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center"
            onClick={() => navigate('/leaderboard')}
          >
            View Leaderboard
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          {challenges.map((challenge) => (
            <div 
              key={challenge.id} 
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                challenge.isCompleted 
                  ? "bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800"
                  : "bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              )}
              onClick={() => !challenge.isCompleted && navigateToChallenge(challenge.route)}
            >
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                  {challenge.icon}
                </div>
                <div>
                  <div className="font-medium text-sm flex items-center">
                    {challenge.title}
                    {challenge.isCompleted && (
                      <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {challenge.description}
                  </div>
                </div>
              </div>
              <Badge 
                variant={challenge.isCompleted ? "outline" : "secondary"}
                className={cn(
                  "flex items-center",
                  challenge.isCompleted ? "border-primary-200 text-primary-700" : ""
                )}
              >
                <Star className="h-3 w-3 mr-1" /> 
                {challenge.xpReward} XP
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/leaderboard')}
        >
          <Trophy className="h-3 w-3 mr-2" />
          View Leaderboard
        </Button>
      </CardFooter>
    </Card>
  );
};

export const XpEarningGuide: React.FC = () => {
  const navigate = useNavigate();
  
  const earningOpportunities = [
    {
      title: "Daily Check-ins",
      description: "Check in at the gym daily to earn XP and build streaks",
      xp: `${XP_REWARDS.DAILY_CHECK_IN} XP + ${XP_REWARDS.CONSECUTIVE_CHECK_IN_BONUS} XP per streak day`,
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      route: "/attendance"
    },
    {
      title: "Class Participation",
      description: "Book and attend fitness classes to earn XP",
      xp: `${XP_REWARDS.CLASS_BOOKING} XP (booking) + ${XP_REWARDS.CLASS_ATTENDANCE} XP (attendance)`,
      icon: <Dumbbell className="h-5 w-5 text-purple-500" />,
      route: "/classes"
    },
    {
      title: "Weekly Feedback",
      description: "Share your thoughts about the gym each week",
      xp: `${XP_REWARDS.WEEKLY_FEEDBACK_SUBMISSION} XP`,
      icon: <MessageSquare className="h-5 w-5 text-amber-500" />,
      route: "/weekly-feedback"
    },
    {
      title: "Referral Program",
      description: "Invite friends to join FitFlex",
      xp: `${XP_REWARDS.REFERRAL_SENT} XP (invite) + ${XP_REWARDS.REFERRAL_SIGNUP} XP (signup)`,
      icon: <Users className="h-5 w-5 text-indigo-500" />,
      route: "/refer"
    },
    {
      title: "Complete Profile",
      description: "Add your name and profile photo",
      xp: `${XP_REWARDS.PROFILE_COMPLETION} XP`,
      icon: <User className="h-5 w-5 text-green-500" />,
      route: "/profile"
    }
  ];
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          XP Earning Guide
        </CardTitle>
        <CardDescription>Ways to earn experience points</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-3">
          {earningOpportunities.map((opportunity, index) => (
            <div 
              key={index} 
              className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
              onClick={() => navigate(opportunity.route)}
            >
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                  {opportunity.icon}
                </div>
                <div className="font-medium">{opportunity.title}</div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {opportunity.description}
              </div>
              <Badge variant="secondary" className="text-xs">
                {opportunity.xp}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full text-xs"
          onClick={() => navigate('/leaderboard')}
        >
          <Trophy className="h-3 w-3 mr-2" />
          View Leaderboard
        </Button>
      </CardFooter>
    </Card>
  );
}; 