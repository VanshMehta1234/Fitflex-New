// Import XpSource type from a string literal to avoid circular dependency
export type XpSource = 
  | 'referral_bonus' 
  | 'referral_redemption' 
  | 'class_attendance' 
  | 'achievement_unlocked' 
  | 'streak_bonus' 
  | 'level_up' 
  | 'admin_adjustment';

export interface XpTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  source: XpSource;
  created_at: string;
} 