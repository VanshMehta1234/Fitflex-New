import React from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { PageHeader, PageContainer } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { useXp } from '../context/XpContext';
import { XP_REWARDS } from '../lib/xpRewardsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Star, 
  Calendar, 
  Dumbbell, 
  Users, 
  MessageSquare, 
  User, 
  Trophy,
  Flame,
  Share2,
  CheckCircle,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function XpRewards() {
  const navigate = useNavigate();
  const { userXp, userLevel, calculateProgress } = useXp();
  const progress = calculateProgress();
  
  // Reward categories
  const categories = {
    daily: [
      {
        title: "Daily Check-in",
        description: "Check in at the gym each day",
        xp: XP_REWARDS.DAILY_CHECK_IN,
        icon: <Calendar className="h-5 w-5 text-blue-500" />,
        route: "/attendance"
      },
      {
        title: "Consecutive Check-ins",
        description: "Additional XP for each consecutive day",
        xp: XP_REWARDS.CONSECUTIVE_CHECK_IN_BONUS,
        perDay: true,
        icon: <Flame className="h-5 w-5 text-orange-500" />,
        route: "/attendance"
      },
      {
        title: "Weekly Streak Bonus",
        description: "Complete 7 consecutive days",
        xp: XP_REWARDS.WEEKLY_STREAK_BONUS,
        icon: <Trophy className="h-5 w-5 text-amber-500" />,
        route: "/attendance"
      }
    ],
    classes: [
      {
        title: "Book a Class",
        description: "Book any fitness class",
        xp: XP_REWARDS.CLASS_BOOKING,
        icon: <Calendar className="h-5 w-5 text-indigo-500" />,
        route: "/classes"
      },
      {
        title: "Attend a Class",
        description: "Attend your booked class",
        xp: XP_REWARDS.CLASS_ATTENDANCE,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        route: "/classes"
      },
      {
        title: "First-time Class",
        description: "Bonus for trying a new class type",
        xp: XP_REWARDS.FIRST_CLASS_ATTENDANCE,
        icon: <Star className="h-5 w-5 text-yellow-500" />,
        route: "/classes"
      },
      {
        title: "Multiple Classes",
        description: "Attend 3, 5, or 7 classes in a week",
        xp: XP_REWARDS.COMPLETE_MULTIPLE_CLASSES,
        icon: <Dumbbell className="h-5 w-5 text-purple-500" />,
        route: "/classes"
      }
    ],
    social: [
      {
        title: "Send a Referral",
        description: "Invite a friend to join FitFlex",
        xp: XP_REWARDS.REFERRAL_SENT,
        icon: <Share2 className="h-5 w-5 text-blue-500" />,
        route: "/refer"
      },
      {
        title: "Successful Referral",
        description: "When someone uses your referral code",
        xp: XP_REWARDS.REFERRAL_SIGNUP,
        icon: <Users className="h-5 w-5 text-green-500" />,
        route: "/refer"
      },
      {
        title: "Weekly Feedback",
        description: "Submit your weekly gym feedback",
        xp: XP_REWARDS.WEEKLY_FEEDBACK_SUBMISSION,
        icon: <MessageSquare className="h-5 w-5 text-amber-500" />,
        route: "/weekly-feedback"
      },
      {
        title: "Share on Social",
        description: "Share your progress on social media",
        xp: XP_REWARDS.SHARE_ON_SOCIAL,
        icon: <Share2 className="h-5 w-5 text-pink-500" />,
        route: "/profile"
      }
    ],
    milestones: [
      {
        title: "Complete Profile",
        description: "Add your name and profile photo",
        xp: XP_REWARDS.PROFILE_COMPLETION,
        icon: <User className="h-5 w-5 text-cyan-500" />,
        route: "/profile"
      },
      {
        title: "Level 5 Milestone",
        description: "Reach level 5",
        xp: XP_REWARDS.REACH_LEVEL_5,
        icon: <Trophy className="h-5 w-5 text-bronze" />,
        route: "/profile"
      },
      {
        title: "Level 10 Milestone",
        description: "Reach level 10",
        xp: XP_REWARDS.REACH_LEVEL_10,
        icon: <Trophy className="h-5 w-5 text-silver" />,
        route: "/profile"
      },
      {
        title: "Level 15 Milestone",
        description: "Reach level 15",
        xp: XP_REWARDS.REACH_LEVEL_15,
        icon: <Trophy className="h-5 w-5 text-gold" />,
        route: "/profile"
      },
      {
        title: "Level 20 Milestone",
        description: "Reach level 20",
        xp: XP_REWARDS.REACH_LEVEL_20,
        icon: <Trophy className="h-5 w-5 text-primary-500" />,
        route: "/profile"
      }
    ]
  };
  
  return (
    <MainLayout>
      <PageContainer fullWidth>
        <PageHeader
          title="XP Rewards"
          description="Discover all the ways to earn experience points and level up"
          icon={Star}
        />
        
        {/* Current XP Status */}
        <Card className="mb-6 overflow-hidden border-2 border-primary-100 dark:border-primary-900/20">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 p-4 md:px-6 md:py-5">
            <div className="flex items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 md:mr-4 shadow-sm">
                <Star className="h-5 w-5 md:h-6 md:w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Your XP Progress</h2>
                <div className="flex items-center mt-1">
                  <Trophy className="h-4 w-4 text-amber-500 mr-1" />
                  <span className="text-sm font-medium">
                    Level {userLevel}
                    {userLevel >= 5 && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                        {userLevel >= 20 ? "Master" :
                         userLevel >= 15 ? "Expert" :
                         userLevel >= 10 ? "Advanced" : "Intermediate"}
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <div className="ml-auto">
                <p className="text-xl md:text-2xl font-bold">{userXp} XP</p>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress to Level {userLevel + 1}</span>
                <span className="font-medium">{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="h-2.5" />
              
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                <span>Level {userLevel}</span>
                <span>{progress.xpToNextLevel} XP needed</span>
                <span>Level {userLevel + 1}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/leaderboard')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                View Leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* XP Reward Categories */}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Daily Rewards
                </CardTitle>
                <CardDescription>
                  Check in every day to earn XP and build streaks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.daily.map((reward, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(reward.route)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                            {reward.icon}
                          </div>
                          <div>
                            <div className="font-medium">{reward.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                        <Badge className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {reward.perDay ? `${reward.xp} XP/day` : `${reward.xp} XP`}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="default" 
                    className="w-full mt-2"
                    onClick={() => navigate('/attendance')}
                  >
                    Check In Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="classes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dumbbell className="h-5 w-5 mr-2 text-purple-500" />
                  Class Rewards
                </CardTitle>
                <CardDescription>
                  Book and attend classes to earn XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.classes.map((reward, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(reward.route)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                            {reward.icon}
                          </div>
                          <div>
                            <div className="font-medium">{reward.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                        <Badge className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {reward.xp} XP
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="default" 
                    className="w-full mt-2"
                    onClick={() => navigate('/classes')}
                  >
                    Browse Classes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-500" />
                  Social Rewards
                </CardTitle>
                <CardDescription>
                  Interact with the community to earn XP
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.social.map((reward, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(reward.route)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                            {reward.icon}
                          </div>
                          <div>
                            <div className="font-medium">{reward.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                        <Badge className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {reward.xp} XP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-amber-500" />
                  Milestone Rewards
                </CardTitle>
                <CardDescription>
                  Earn bonus XP for reaching important milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.milestones.map((reward, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                      onClick={() => navigate(reward.route)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 mr-3">
                            {reward.icon}
                          </div>
                          <div>
                            <div className="font-medium">{reward.title}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {reward.description}
                            </div>
                          </div>
                        </div>
                        <Badge className="flex items-center">
                          <Star className="h-3 w-3 mr-1" />
                          {reward.xp} XP
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </PageContainer>
    </MainLayout>
  );
} 