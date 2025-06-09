import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { XpTransaction, XpSource } from '../types/xp';
import { addXpToUser, getUserTotalXp, getUserXpTransactions, LEVEL_XP_REQUIREMENTS } from '../lib/xpService';
import toast from 'react-hot-toast';
import { awardLevelMilestoneXp } from '../lib/xpRewardsService';

// Constants for XP requirements per level
// Now imported from xpService

interface XpContextType {
  userXp: number;
  userLevel: number;
  xpTransactions: XpTransaction[];
  isLoading: boolean;
  earnXp: (amount: number, reason: string, source: XpSource) => Promise<boolean>;
  calculateProgress: () => {
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
    xpToNextLevel: number;
    percent: number;
  };
  syncUserLevel: () => Promise<void>;
  refreshXpData: () => Promise<void>;
}

interface XpProviderProps {
  children: React.ReactNode;
}

const XpContext = createContext<XpContextType | undefined>(undefined);

export function XpProvider({ children }: XpProviderProps) {
  const { user, refreshUserProfile } = useAuth();
  const [userXp, setUserXp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [xpTransactions, setXpTransactions] = useState<XpTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fetch user's XP data from database on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      fetchXpData();
    }
  }, [user?.id]);
  
  // Calculate current level based on XP
  const calculateLevel = (xp: number): number => {
    let level = 1;
    
    for (let i = 20; i > 0; i--) {
      if (xp >= LEVEL_XP_REQUIREMENTS[i]) {
        level = i;
        break;
      }
    }
    
    return level;
  };
  
  // Fetch XP data from database
  const fetchXpData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Get user's total XP from profile
      const totalXp = await getUserTotalXp(user.id);
      setUserXp(totalXp);
      
      // Calculate and set user level
      const level = calculateLevel(totalXp);
      setUserLevel(level);
      
      // Get XP transactions
      const transactions = await getUserXpTransactions(user.id);
      setXpTransactions(transactions);
      
      // Also refresh the user profile to ensure it's in sync
      await refreshUserProfile();
    } catch (error) {
      console.error('Error fetching XP data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to synchronize user level with XP
  const syncUserLevel = async (): Promise<void> => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Get latest XP from database
      const totalXp = await getUserTotalXp(user.id);
      setUserXp(totalXp);
      
      // Calculate and set user level
      const calculatedLevel = calculateLevel(totalXp);
      if (calculatedLevel !== userLevel) {
        // Check if this is a milestone level that deserves bonus XP
        if (calculatedLevel > userLevel && [5, 10, 15, 20].includes(calculatedLevel)) {
          // Award milestone XP
          await awardLevelMilestoneXp(user.id, calculatedLevel);
          
          // Refresh XP data to include the milestone bonus
          const updatedXp = await getUserTotalXp(user.id);
          setUserXp(updatedXp);
        }
        
        // Update the level
        setUserLevel(calculatedLevel);
      }
    } catch (error) {
      console.error('Error syncing user level:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate progress information
  const calculateProgress = () => {
    const currentLevel = userLevel;
    const currentXp = userXp;
    const nextLevelXp = LEVEL_XP_REQUIREMENTS[currentLevel + 1] || userXp;
    const prevLevelXp = LEVEL_XP_REQUIREMENTS[currentLevel];
    const xpToNextLevel = nextLevelXp - currentXp;
    const levelDiff = nextLevelXp - prevLevelXp;
    const xpInCurrentLevel = currentXp - prevLevelXp;
    const percent = Math.floor((xpInCurrentLevel / levelDiff) * 100);
    
    return {
      currentLevel,
      currentXp,
      nextLevelXp,
      xpToNextLevel,
      percent: currentLevel >= 20 ? 100 : percent
    };
  };
  
  // Function to earn XP
  const earnXp = async (amount: number, reason: string, source: XpSource): Promise<boolean> => {
    if (!user?.id || amount <= 0) {
      return false;
    }
    
    setIsLoading(true);
    try {
      // Add XP to user in database
      const success = await addXpToUser(user.id, amount, reason, source);
      
      if (success) {
        // Refresh XP data from database
        await fetchXpData();
        toast.success(`Earned ${amount} XP!`);
        return true;
      } else {
        toast.error('Failed to add XP');
        return false;
      }
    } catch (error) {
      console.error('Error earning XP:', error);
      toast.error('Failed to add XP');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh XP data
  const refreshXpData = async (): Promise<void> => {
    await fetchXpData();
  };
  
  const value = {
    userXp,
    userLevel,
    xpTransactions,
    isLoading,
    earnXp,
    calculateProgress,
    syncUserLevel,
    refreshXpData
  };
  
  return <XpContext.Provider value={value}>{children}</XpContext.Provider>;
}

export const useXp = () => {
  const context = useContext(XpContext);
  if (context === undefined) {
    throw new Error('useXp must be used within an XpProvider');
  }
  return context;
}; 