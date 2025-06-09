import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getGlobalLeaderboard, getUserLeaderboardPosition, getTimePeriodLeaderboard, LeaderboardUser } from '../lib/leaderboardService';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

type LeaderboardPeriod = 'all-time' | 'weekly' | 'monthly';

interface LeaderboardContextType {
  leaderboard: LeaderboardUser[];
  userRank: number;
  totalUsers: number;
  isLoading: boolean;
  selectedPeriod: LeaderboardPeriod;
  setSelectedPeriod: (period: LeaderboardPeriod) => void;
  refreshLeaderboard: () => Promise<void>;
}

const LeaderboardContext = createContext<LeaderboardContextType | undefined>(undefined);

export function LeaderboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userRank, setUserRank] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('all-time');

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let data: LeaderboardUser[] = [];
      
      // Fetch leaderboard based on selected period
      if (selectedPeriod === 'all-time') {
        data = await getGlobalLeaderboard(30);
      } else {
        data = await getTimePeriodLeaderboard(selectedPeriod, 20);
      }
      
      setLeaderboard(data);
      const { rank, totalUsers: total } = await getUserLeaderboardPosition(user.id);
      setUserRank(rank);
      setTotalUsers(total);
      
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPeriod]);

  // Fetch leaderboard when component mounts or user/period changes
  useEffect(() => {
    if (user) {
      fetchLeaderboard();
    }
  }, [user, selectedPeriod, fetchLeaderboard]);

  // Initialize the database function if needed (only once when provider mounts)
  useEffect(() => {
    import('../lib/leaderboardService').then(({ createLeaderboardFunction }) => {
      // Try to create the function, but don't worry if it fails (might already exist)
      createLeaderboardFunction().catch(err => 
        console.log('Note: Leaderboard function creation attempted but may already exist', err)
      );
    });
  }, []);

  // Function to manually refresh the leaderboard
  const refreshLeaderboard = async (): Promise<void> => {
    await fetchLeaderboard();
  };

  const value = {
    leaderboard,
    userRank,
    totalUsers,
    isLoading,
    selectedPeriod,
    setSelectedPeriod,
    refreshLeaderboard
  };

  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export const useLeaderboard = () => {
  const context = useContext(LeaderboardContext);
  if (context === undefined) {
    throw new Error('useLeaderboard must be used within a LeaderboardProvider');
  }
  return context;
}; 