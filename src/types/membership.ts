export type MembershipTier = 'basic' | 'premium' | 'elite';

export type MembershipStatus = 'active' | 'expired' | 'paused' | 'cancelled';

export interface MembershipPlan {
  id: string;
  name: string;
  tier: MembershipTier;
  description: string;
  stripeProductId?: string;
  stripeMonthlyPriceId?: string;
  stripeYearlyPriceId?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  isActive?: boolean;
  isPopular?: boolean;
  features?: MembershipFeature[] | string[];
}

export interface MembershipFeature {
  id: string;
  planId: string;
  featureName: string;
  featureDescription?: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  type: MembershipTier;
  status: MembershipStatus;
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipHistory {
  id: string;
  membershipId: string;
  action: 'created' | 'renewed' | 'upgraded' | 'downgraded' | 'paused' | 'resumed' | 'cancelled' | 'updated';
  timestamp: string;
  details?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  membershipId: string;
  stripePaymentIntentId?: string;
  stripeInvoiceId?: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  paymentDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
} 