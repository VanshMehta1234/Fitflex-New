import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface FeedbackContextType {
  hasSubmittedThisWeek: boolean;
  submitFeedback: (feedback: FeedbackData) => Promise<void>;
}

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export interface FeedbackData {
  rating: number;
  comment: string;
  improvements: string[];
  features: string[];
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const { user } = useAuth();
  const [hasSubmittedThisWeek, setHasSubmittedThisWeek] = useState<boolean>(false);
  
  // Check if user has submitted feedback this week
  useEffect(() => {
    if (user?.id) {
      // Get the current week number
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.ceil(
        ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );
      
      const lastSubmission = localStorage.getItem(`feedback_week_${user.id}`);
      
      if (lastSubmission) {
        const [lastYear, lastWeek] = lastSubmission.split('-').map(Number);
        setHasSubmittedThisWeek(
          lastYear === now.getFullYear() && lastWeek === weekNumber
        );
      } else {
        setHasSubmittedThisWeek(false);
      }
    }
  }, [user?.id]);
  
  // Submit feedback
  const submitFeedback = async (feedback: FeedbackData): Promise<void> => {
    if (!user?.id) {
      throw new Error('User must be logged in to submit feedback');
    }
    
    // In a real app, this would be sent to a database or API
    console.log('Submitting feedback:', feedback);
    
    // Get the current week number
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(
      ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
    );
    
    // Store that user has submitted feedback this week
    localStorage.setItem(
      `feedback_week_${user.id}`,
      `${now.getFullYear()}-${weekNumber}`
    );
    
    // Update state
    setHasSubmittedThisWeek(true);
  };
  
  const value = {
    hasSubmittedThisWeek,
    submitFeedback
  };
  
  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>;
}

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
}; 