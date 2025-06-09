import { addXpToUser } from './xpService';
import { XpSource } from '../types/xp';

// Constants for XP reward amounts
export const XP_REWARDS = {
  // Daily check-in rewards
  DAILY_CHECK_IN: 20,
  CONSECUTIVE_CHECK_IN_BONUS: 5, // Additional per day of streak
  WEEKLY_STREAK_BONUS: 50, // For completing 7 consecutive days
  
  // Class-related rewards
  CLASS_BOOKING: 10,
  CLASS_ATTENDANCE: 30,
  FIRST_CLASS_ATTENDANCE: 50,
  COMPLETE_MULTIPLE_CLASSES: 25, // For attending multiple classes in a week
  
  // Profile-related rewards
  PROFILE_COMPLETION: 40,
  
  // Referral-related rewards
  REFERRAL_SENT: 15,
  REFERRAL_SIGNUP: 100,
  
  // Feedback-related rewards
  WEEKLY_FEEDBACK_SUBMISSION: 25,
  
  // Social rewards
  SHARE_ON_SOCIAL: 20,
  
  // Achievement-related rewards
  ACHIEVEMENT_UNLOCKED: 50,
  
  // Level milestones
  REACH_LEVEL_5: 100,
  REACH_LEVEL_10: 200,
  REACH_LEVEL_15: 300,
  REACH_LEVEL_20: 500,
};

/**
 * Award XP for daily check-in
 * @param userId The user's ID
 * @param streakCount The user's current streak count
 * @returns Boolean indicating success
 */
export const awardCheckInXp = async (userId: string, streakCount: number = 0): Promise<boolean> => {
  try {
    // Base check-in reward
    let xpAmount = XP_REWARDS.DAILY_CHECK_IN;
    let description = "Daily gym check-in";
    
    // Add streak bonus if applicable
    if (streakCount > 1) {
      const streakBonus = Math.min(streakCount - 1, 6) * XP_REWARDS.CONSECUTIVE_CHECK_IN_BONUS;
      xpAmount += streakBonus;
      description += ` (${streakCount}-day streak)`;
    }
    
    // Weekly streak bonus (7 days)
    if (streakCount % 7 === 0 && streakCount > 0) {
      // Award the weekly streak bonus separately
      await addXpToUser(
        userId,
        XP_REWARDS.WEEKLY_STREAK_BONUS,
        `Completed ${streakCount}-day streak!`,
        'streak_bonus'
      );
    }
    
    // Award the check-in XP
    return await addXpToUser(userId, xpAmount, description, 'class_attendance');
  } catch (error) {
    console.error('Error awarding check-in XP:', error);
    return false;
  }
};

/**
 * Award XP for booking a class
 * @param userId The user's ID
 * @param className The name of the class
 * @returns Boolean indicating success
 */
export const awardClassBookingXp = async (userId: string, className: string): Promise<boolean> => {
  try {
    const description = `Booked ${className} class`;
    return await addXpToUser(userId, XP_REWARDS.CLASS_BOOKING, description, 'class_attendance');
  } catch (error) {
    console.error('Error awarding class booking XP:', error);
    return false;
  }
};

/**
 * Award XP for attending a class
 * @param userId The user's ID
 * @param className The name of the class
 * @param isFirstTime Whether this is the first time the user has attended this class
 * @returns Boolean indicating success
 */
export const awardClassAttendanceXp = async (
  userId: string, 
  className: string, 
  isFirstTime: boolean = false
): Promise<boolean> => {
  try {
    let xpAmount = XP_REWARDS.CLASS_ATTENDANCE;
    let description = `Attended ${className} class`;
    
    // Bonus for first time attending this class type
    if (isFirstTime) {
      xpAmount += XP_REWARDS.FIRST_CLASS_ATTENDANCE;
      description += " (first time)";
    }
    
    return await addXpToUser(userId, xpAmount, description, 'class_attendance');
  } catch (error) {
    console.error('Error awarding class attendance XP:', error);
    return false;
  }
};

/**
 * Award XP for completing profile
 * @param userId The user's ID
 * @returns Boolean indicating success
 */
export const awardProfileCompletionXp = async (userId: string): Promise<boolean> => {
  try {
    const description = "Completed profile information";
    return await addXpToUser(userId, XP_REWARDS.PROFILE_COMPLETION, description, 'achievement_unlocked');
  } catch (error) {
    console.error('Error awarding profile completion XP:', error);
    return false;
  }
};

/**
 * Award XP for sending a referral
 * @param userId The user's ID
 * @returns Boolean indicating success
 */
export const awardReferralSentXp = async (userId: string): Promise<boolean> => {
  try {
    const description = "Sent a referral invitation";
    return await addXpToUser(userId, XP_REWARDS.REFERRAL_SENT, description, 'referral_bonus');
  } catch (error) {
    console.error('Error awarding referral sent XP:', error);
    return false;
  }
};

/**
 * Award XP for successful referral signup
 * @param userId The user's ID
 * @param referredName The name of the referred user
 * @returns Boolean indicating success
 */
export const awardReferralSignupXp = async (userId: string, referredName: string): Promise<boolean> => {
  try {
    const description = `Referral successful: ${referredName} joined`;
    return await addXpToUser(userId, XP_REWARDS.REFERRAL_SIGNUP, description, 'referral_redemption');
  } catch (error) {
    console.error('Error awarding referral signup XP:', error);
    return false;
  }
};

/**
 * Award XP for submitting weekly feedback
 * @param userId The user's ID
 * @returns Boolean indicating success
 */
export const awardFeedbackSubmissionXp = async (userId: string): Promise<boolean> => {
  try {
    const description = "Submitted weekly feedback";
    return await addXpToUser(userId, XP_REWARDS.WEEKLY_FEEDBACK_SUBMISSION, description, 'achievement_unlocked');
  } catch (error) {
    console.error('Error awarding feedback submission XP:', error);
    return false;
  }
};

/**
 * Award XP for reaching a level milestone
 * @param userId The user's ID
 * @param level The level reached
 * @returns Boolean indicating success
 */
export const awardLevelMilestoneXp = async (userId: string, level: number): Promise<boolean> => {
  try {
    let xpAmount = 0;
    
    if (level === 5) {
      xpAmount = XP_REWARDS.REACH_LEVEL_5;
    } else if (level === 10) {
      xpAmount = XP_REWARDS.REACH_LEVEL_10;
    } else if (level === 15) {
      xpAmount = XP_REWARDS.REACH_LEVEL_15;
    } else if (level === 20) {
      xpAmount = XP_REWARDS.REACH_LEVEL_20;
    } else {
      return false; // Not a milestone level
    }
    
    const description = `Reached level ${level}!`;
    return await addXpToUser(userId, xpAmount, description, 'level_up');
  } catch (error) {
    console.error('Error awarding level milestone XP:', error);
    return false;
  }
};

/**
 * Award XP for completing multiple classes in a week
 * @param userId The user's ID
 * @param count The number of classes completed
 * @returns Boolean indicating success
 */
export const awardMultipleClassesXp = async (userId: string, count: number): Promise<boolean> => {
  try {
    const description = `Completed ${count} classes this week`;
    return await addXpToUser(userId, XP_REWARDS.COMPLETE_MULTIPLE_CLASSES, description, 'achievement_unlocked');
  } catch (error) {
    console.error('Error awarding multiple classes XP:', error);
    return false;
  }
};

/**
 * Award XP for sharing on social media
 * @param userId The user's ID
 * @param platform The social media platform
 * @returns Boolean indicating success
 */
export const awardSocialShareXp = async (userId: string, platform: string): Promise<boolean> => {
  try {
    const description = `Shared on ${platform}`;
    return await addXpToUser(userId, XP_REWARDS.SHARE_ON_SOCIAL, description, 'achievement_unlocked');
  } catch (error) {
    console.error('Error awarding social share XP:', error);
    return false;
  }
};

/**
 * Custom achievement XP award
 * @param userId The user's ID
 * @param achievementName The name of the achievement
 * @param xpAmount The amount of XP to award
 * @returns Boolean indicating success
 */
export const awardCustomAchievementXp = async (
  userId: string,
  achievementName: string,
  xpAmount: number
): Promise<boolean> => {
  try {
    const description = `Achievement: ${achievementName}`;
    return await addXpToUser(userId, xpAmount, description, 'achievement_unlocked');
  } catch (error) {
    console.error('Error awarding custom achievement XP:', error);
    return false;
  }
}; 