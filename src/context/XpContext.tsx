import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Constants for XP requirements per level
export const LEVEL_XP_REQUIREMENTS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 450,
  5: 700,
  6: 1000,
  7: 1350,
  8: 1750,
  9: 2200,
  10: 2700,
  11: 3250,
  12: 3850,
  13: 4500,
  14: 5200,
  15: 6000,
  16: 6850,
  17: 7750,
  18: 8700,
  19: 9700,
  20: 10750
};

interface XpContextType {
  userXp: number;
  userLevel: number;
  earnXp: (amount: number, reason?: string) => Promise<void>;
  calculateProgress: () => {
    currentLevel: number;
    currentXp: number;
    nextLevelXp: number;
    xpToNextLevel: number;
    percent: number;
  };
  syncUserLevel: () => Promise<void>;
}

interface XpProviderProps {
  children: React.ReactNode;
}

const XpContext = createContext<XpContextType | undefined>(undefined);

export function XpProvider({ children }: XpProviderProps) {
  const { user } = useAuth();
  const [userXp, setUserXp] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  
  // Load user XP and level from local storage on mount
  useEffect(() => {
    if (user?.id) {
      const storedXp = localStorage.getItem(`user_xp_${user.id}`);
      const storedLevel = localStorage.getItem(`user_level_${user.id}`);
      
      if (storedXp) {
        setUserXp(parseInt(storedXp, 10));
      }
      
      if (storedLevel) {
        setUserLevel(parseInt(storedLevel, 10));
      }
    }
  }, [user?.id]);
  
  // Save XP and level to local storage when they change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`user_xp_${user.id}`, userXp.toString());
      localStorage.setItem(`user_level_${user.id}`, userLevel.toString());
    }
  }, [user?.id, userXp, userLevel]);
  
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
  
  // Function to synchronize user level with XP
  const syncUserLevel = async (): Promise<void> => {
    const calculatedLevel = calculateLevel(userXp);
    if (calculatedLevel !== userLevel) {
      setUserLevel(calculatedLevel);
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
  const earnXp = async (amount: number, reason?: string): Promise<void> => {
    if (!user?.id || amount <= 0) {
      return;
    }
    
    const newXp = userXp + amount;
    setUserXp(newXp);
    
    // Check if user leveled up
    const newLevel = calculateLevel(newXp);
    if (newLevel > userLevel) {
      setUserLevel(newLevel);
      // In a real app, we might notify the user about the level up
    }
    
    // In a real app, we would save this to a database
    console.log(`User earned ${amount} XP${reason ? ` for ${reason}` : ''}`);
  };
  
  const value = {
    userXp,
    userLevel,
    earnXp,
    calculateProgress,
    syncUserLevel
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