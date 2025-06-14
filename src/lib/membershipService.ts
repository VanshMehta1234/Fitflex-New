import { MembershipPlan, MembershipTier, UserMembership, PaymentHistory, MembershipFeature } from '../types/membership';
import { supabase } from '../supabase';

// Define available membership plans
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tier: 'basic',
    monthlyPrice: 29.00,
    yearlyPrice: 290.00,
    features: [
      'Basic workout access',
      'Fitness tracking',
      'Community forum access',
      'Progress tracking',
    ],
    description: 'Perfect for beginners starting their fitness journey',
  },
  {
    id: 'premium',
    name: 'Premium',
    tier: 'premium',
    monthlyPrice: 49.00,
    yearlyPrice: 490.00,
    features: [
      'All Basic features',
      'Premium workouts',
      'Personalized plans',
      'Progress analytics',
      'Nutrition guidance',
    ],
    description: 'Ideal for fitness enthusiasts looking to level up',
    isPopular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    tier: 'elite',
    monthlyPrice: 79.00,
    yearlyPrice: 790.00,
    features: [
      'All Premium features',
      '1-on-1 coaching',
      'Priority support',
      'Exclusive content',
      'Custom workout plans',
      'Advanced analytics',
    ],
    description: 'The ultimate fitness experience for serious athletes',
  },
];

export const membershipService = {
  /**
   * Get all available membership plans with features
   */
  async getPlans(): Promise<MembershipPlan[]> {
    try {
      console.log('Fetching membership plans from database...');
      // Get plans
      const { data: plansData, error: plansError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('is_active', true)
        .order('monthly_price');

      if (plansError) {
        console.error('Error fetching plans:', plansError);
        console.log('Using mock plans as fallback');
        return MEMBERSHIP_PLANS;
      }

      if (!plansData || plansData.length === 0) {
        console.log('No plans found in database, using mock plans');
        return MEMBERSHIP_PLANS;
      }

      console.log('Found', plansData.length, 'plans in database');
      
      // Convert from snake_case to camelCase
      const plans: MembershipPlan[] = plansData.map(plan => ({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description || '',
        stripeProductId: plan.stripe_product_id,
        stripeMonthlyPriceId: plan.stripe_monthly_price_id,
        stripeYearlyPriceId: plan.stripe_yearly_price_id,
        monthlyPrice: plan.monthly_price,
        yearlyPrice: plan.yearly_price,
        isActive: plan.is_active,
        isPopular: plan.tier === 'premium', // Mark premium as popular
        features: []
      }));

      // Get features for all plans
      const { data: featuresData, error: featuresError } = await supabase
        .from('membership_features')
        .select('*')
        .in('plan_id', plans.map(plan => plan.id));

      if (featuresError) {
        console.error('Error fetching features:', featuresError);
        // Return plans without features
        return plans;
      }

      if (featuresData && featuresData.length > 0) {
        console.log('Found', featuresData.length, 'features for plans');
        
        // Convert from snake_case to camelCase
        const features: MembershipFeature[] = featuresData.map(feature => ({
          id: feature.id,
          planId: feature.plan_id,
          featureName: feature.feature_name,
          featureDescription: feature.feature_description
        }));

        // Add features to corresponding plans
        plans.forEach(plan => {
          plan.features = features.filter(feature => feature.planId === plan.id);
        });
      } else {
        console.log('No features found for plans');
      }

      return plans;
    } catch (error) {
      console.error('Error in getPlans:', error);
      console.log('Using mock plans due to error');
      return MEMBERSHIP_PLANS;
    }
  },

  /**
   * Get a specific plan by tier
   */
  async getPlan(tier: MembershipTier): Promise<MembershipPlan | null> {
    try {
      // Get plan
      const { data: plan, error: planError } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .single();

      if (planError || !plan) {
        console.error('Error fetching plan:', planError);
        // Return mock plan as fallback
        const mockPlan = MEMBERSHIP_PLANS.find(p => p.tier === tier);
        return mockPlan || null;
      }

      // Convert from snake_case to camelCase
      const membershipPlan: MembershipPlan = {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description || '',
        stripeProductId: plan.stripe_product_id,
        stripeMonthlyPriceId: plan.stripe_monthly_price_id,
        stripeYearlyPriceId: plan.stripe_yearly_price_id,
        monthlyPrice: plan.monthly_price,
        yearlyPrice: plan.yearly_price,
        isActive: plan.is_active,
        isPopular: plan.tier === 'premium',
        features: []
      };

      // Get features for this plan
      const { data: featuresData, error: featuresError } = await supabase
        .from('membership_features')
        .select('*')
        .eq('plan_id', plan.id);

      if (featuresError) {
        console.error('Error fetching features:', featuresError);
        return membershipPlan;
      }

      if (featuresData && featuresData.length > 0) {
        // Convert from snake_case to camelCase
        membershipPlan.features = featuresData.map(feature => ({
          id: feature.id,
          planId: feature.plan_id,
          featureName: feature.feature_name,
          featureDescription: feature.feature_description
        }));
      }

      return membershipPlan;
    } catch (error) {
      console.error('Error in getPlan:', error);
      // Return mock plan as fallback
      const mockPlan = MEMBERSHIP_PLANS.find(p => p.tier === tier);
      return mockPlan || null;
    }
  },

  /**
   * Get current user's membership
   */
  async getCurrentMembership(userId: string): Promise<UserMembership | null> {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // If no membership found, return null without error
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching membership:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      // Convert from snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        status: data.status,
        startDate: data.start_date,
        endDate: data.end_date,
        autoRenew: data.auto_renew,
        stripeSubscriptionId: data.stripe_subscription_id,
        stripeCustomerId: data.stripe_customer_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Error in getCurrentMembership:', error);
      return null;
    }
  },

  /**
   * Get membership history
   */
  async getMembershipHistory(membershipId: string) {
    try {
      const { data, error } = await supabase
        .from('membership_history')
        .select('*')
        .eq('membership_id', membershipId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching membership history:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error in getMembershipHistory:', error);
      return [];
    }
  },

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching payment history:', error);
        return [];
      }

      // Convert from snake_case to camelCase
      return data.map(item => ({
        id: item.id,
        userId: item.user_id,
        membershipId: item.membership_id,
        stripePaymentIntentId: item.stripe_payment_intent_id,
        stripeInvoiceId: item.stripe_invoice_id,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        paymentDate: item.payment_date,
        billingPeriodStart: item.billing_period_start,
        billingPeriodEnd: item.billing_period_end,
      }));
    } catch (error) {
      console.error('Error in getPaymentHistory:', error);
      return [];
    }
  },

  /**
   * Create a new membership record after successful payment
   */
  async createMembership(
    userId: string,
    tier: MembershipTier,
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    startDate: string,
    endDate: string,
    autoRenew: boolean
  ) {
    try {
      const { data, error } = await supabase
        .from('memberships')
        .insert([
          {
            user_id: userId,
            type: tier,
            status: 'active',
            start_date: startDate,
            end_date: endDate,
            auto_renew: autoRenew,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
          },
        ])
        .select();

      if (error) {
        console.error('Error creating membership:', error);
        throw error;
      }

      // Add entry to membership history
      await supabase.from('membership_history').insert([
        {
          membership_id: data[0].id,
          action: 'created',
          timestamp: new Date().toISOString(),
          details: `Created ${tier} membership`,
        },
      ]);

      return data[0];
    } catch (error) {
      console.error('Error in createMembership:', error);
      throw error;
    }
  },

  /**
   * Update an existing membership
   */
  async updateMembership(
    membershipId: string,
    updates: Partial<UserMembership>,
    action: 'upgraded' | 'downgraded' | 'renewed' | 'paused' | 'cancelled' | 'resumed' | 'updated',
    details: string
  ) {
    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.type) dbUpdates.type = updates.type;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.startDate) dbUpdates.start_date = updates.startDate;
      if (updates.endDate) dbUpdates.end_date = updates.endDate;
      if (updates.autoRenew !== undefined) dbUpdates.auto_renew = updates.autoRenew;
      if (updates.stripeSubscriptionId) dbUpdates.stripe_subscription_id = updates.stripeSubscriptionId;
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('memberships')
        .update(dbUpdates)
        .eq('id', membershipId)
        .select();

      if (error) {
        console.error('Error updating membership:', error);
        throw error;
      }

      // Add entry to membership history
      await supabase.from('membership_history').insert([
        {
          membership_id: membershipId,
          action,
          timestamp: new Date().toISOString(),
          details,
        },
      ]);

      return data[0];
    } catch (error) {
      console.error('Error in updateMembership:', error);
      throw error;
    }
  },

  /**
   * Add a payment record
   */
  async addPaymentRecord(
    userId: string,
    membershipId: string,
    stripePaymentIntentId: string,
    stripeInvoiceId: string,
    amount: number,
    currency: string,
    status: 'succeeded' | 'pending' | 'failed',
    billingPeriodStart: string,
    billingPeriodEnd: string
  ) {
    try {
      const { data, error } = await supabase
        .from('payment_history')
        .insert([
          {
            user_id: userId,
            membership_id: membershipId,
            stripe_payment_intent_id: stripePaymentIntentId,
            stripe_invoice_id: stripeInvoiceId,
            amount,
            currency,
            status,
            payment_date: new Date().toISOString(),
            billing_period_start: billingPeriodStart,
            billing_period_end: billingPeriodEnd,
          },
        ])
        .select();

      if (error) {
        console.error('Error adding payment record:', error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error('Error in addPaymentRecord:', error);
      throw error;
    }
  },
}; 