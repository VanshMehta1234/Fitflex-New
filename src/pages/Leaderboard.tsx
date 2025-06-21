import React, { useMemo, useState, useEffect } from 'react';
import { MainLayout } from '../components/Layout/MainLayout';
import { useLeaderboard } from '../context/LeaderboardContext';
import { useAuth } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Trophy,
  Medal,
  Award,
  Calendar,
  User,
  Clock,
  RotateCw,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getInitials } from '../lib/profileService';

// Helper function to get rank display icon
const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return <span className="font-semibold text-gray-700 dark:text-gray-300"></span>;
  }
};

// Helper function to format tab value to display name
const formatTabName = (tab: string): string => {
  switch (tab) {
    case 'all-time':
      return 'All Time';
    case 'weekly':
      return 'This Week';
    case 'monthly':
      return 'This Month';
    default:
      return tab;
  }
};

// Number of items per page
const ITEMS_PER_PAGE = 10;

export default function Leaderboard() {
  const {
    leaderboard,
    userRank,
    totalUsers,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    refreshLeaderboard
  } = useLeaderboard();
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when tab changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedPeriod]);

  // Find current user in leaderboard
  const userPosition = useMemo(() => {
    if (!user) return null;
    return leaderboard.find(item => item.id === user.id);
  }, [leaderboard, user]);

  // Determine current user's actual rank
  const currentUserRank = userPosition?.rank || userRank;

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(leaderboard.length / ITEMS_PER_PAGE));

  // Debug logging
  useEffect(() => {
    console.log(`Leaderboard data: ${leaderboard.length} items`);
    console.log(`Total pages: ${totalPages}`);
    console.log(`Should show pagination: ${leaderboard.length > ITEMS_PER_PAGE}`);
  }, [leaderboard.length, totalPages]);

  // Get current page data
  const currentLeaderboardData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const items = leaderboard.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    console.log(`Current page ${currentPage}: showing ${items.length} items`);
    return items;
  }, [leaderboard, currentPage]);

  console.log('Current leaderboard data:', currentLeaderboardData);

  // Page navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <MainLayout>
      <div className="container px-4 py-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-sm text-muted-foreground">
                See how you rank among other members
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshLeaderboard()}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RotateCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </div>

        {/* User's rank card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Your Position</CardTitle>
            <CardDescription>
              {selectedPeriod === 'all-time'
                ? 'Based on total XP earned'
                : selectedPeriod === 'weekly'
                  ? 'Based on XP earned this week'
                  : 'Based on XP earned this month'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src={user?.profileImage} alt={user?.name || "User"} />
                    <AvatarFallback>{getInitials(user?.name || "")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user?.name}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="h-4 w-4 mr-1 text-primary" />
                      <span>{userPosition?.xp_points || 0} XP</span>
                      <span className="mx-1">•</span>
                      <span>Level {userPosition?.level || 1}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold flex items-center gap-2">
                    {getRankIcon(currentUserRank)}
                    <span>{currentUserRank}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    out of {totalUsers} members
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard tabs and content */}
        <Tabs value={selectedPeriod} onValueChange={(value: string) => setSelectedPeriod(value as 'all-time' | 'weekly' | 'monthly')}>
          <TabsList className="mb-6 grid grid-cols-3 w-full md:w-auto">
            <TabsTrigger value="all-time" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              All Time
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Weekly
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Monthly
            </TabsTrigger>
          </TabsList>

          {/* Render same content for all tabs, but data is filtered in context */}
          {['all-time', 'weekly', 'monthly'].map((period) => (
            <TabsContent key={period} value={period} className="mt-0">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>{formatTabName(period)} Leaderboard</CardTitle>
                  <CardDescription>
                    {period === 'all-time'
                      ? 'Top members based on total XP earned'
                      : period === 'weekly'
                        ? 'Top members based on XP earned this week'
                        : 'Top members based on XP earned this month'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                          <Skeleton className="h-4 w-[50px]" />
                        </div>
                      ))}
                    </div>
                  ) : leaderboard.length > 0 ? (
                    <>
                      <div className="divide-y divide-border">
                        {currentLeaderboardData.map((item) => (
                          <div
                            key={item.id}
                            className={`flex items-center justify-between p-4 ${item.id === user?.id ? 'bg-primary-50 dark:bg-primary-950/20' : ''
                              }`}
                          >
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-8 h-8">
                                {getRankIcon(item.rank)}
                              </div>
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={item.profile_image} alt={item.name} />
                                <AvatarFallback>{getInitials(item.name || "")}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <span>Level {item.level}</span>
                                </div>
                              </div>
                            </div>
                            <div className="font-medium flex items-center">
                              <Star className="h-4 w-4 mr-1 text-yellow-500" />
                              {item.xp_points} XP
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination controls - always show */}
                      <div className="flex items-center justify-between border-t p-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, leaderboard.length)} of {leaderboard.length}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous page</span>
                          </Button>
                          <div className="text-sm">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next page</span>
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium">No data available</h3>
                      <p className="text-sm text-muted-foreground">
                        {period === 'all-time'
                          ? 'No members have earned XP yet'
                          : period === 'weekly'
                            ? 'No XP earned this week yet'
                            : 'No XP earned this month yet'
                        }
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
} 