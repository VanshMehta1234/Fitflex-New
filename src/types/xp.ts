// XP Transaction type
export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  source: XpSource;
  created_at: string;
}

// XP Source type
export type XpSource = 
  | 'daily_check_in' 
  | 'streak_bonus' 
  | 'class_attendance' 
  | 'class_booking'
  | 'achievement_unlocked'
  | 'referral_bonus'
  | 'referral_redemption'
  | 'level_up'
  | 'profile_completion'
  | 'social_share'
  | 'store_purchase'; 