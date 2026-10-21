import { loadStripe } from '@stripe/stripe-js';
import { MembershipTier } from '../types/membership';
import { toast } from 'sonner';

// Initialize Stripe with your publishable key
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
if (!stripeKey) {
  console.warn("REACT_APP_STRIPE_PUBLISHABLE_KEY is not defined, using test mode");
}
// Use the environment variable if available, otherwise fallback to hardcoded key
const stripePromise = loadStripe(stripeKey || 'pk_test_51OsGqtHmITrQfBwqxfDnUUJP7Yf7FIVHxRQNFODRUjpYtNlLGXJQ8RQZGQvYjdJBxkSgLkOJJlCZVwIGBHZqiJYBl');

const TEST_PRICE_IDS = {
  basic: {
    monthly: process.env.REACT_APP_STRIPE_BASIC_MONTHLY_PRICE_ID || 'price_1RX4IsFMcAZ1AKf4DdSOo672',
    yearly: process.env.REACT_APP_STRIPE_BASIC_YEARLY_PRICE_ID || 'price_1RZSOFFMcAZ1AKf4b6kEcREa',
  },
  premium: {
    monthly: process.env.REACT_APP_STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_1RX4JtFMcAZ1AKf41uZCmViy',
    yearly: process.env.REACT_APP_STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_1RZSOZFMcAZ1AKf4mi8U9NrC',
  },
  elite: {
    monthly: process.env.REACT_APP_STRIPE_ELITE_MONTHLY_PRICE_ID || 'price_1RX4K7FMcAZ1AKf4GrkaKsul',
    yearly: process.env.REACT_APP_STRIPE_ELITE_YEARLY_PRICE_ID || 'price_1RZSOnFMcAZ1AKf4qlu9K3XQ',
  },
};

export const stripeService = {
  /**
   * Get the Stripe instance
   */
  getStripe: async () => {
    return await stripePromise;
  },

  /**
   * Get price IDs for a membership tier
   */
  async getPriceIds(tier: MembershipTier): Promise<{monthly: string, yearly: string}> {
    try {
      // const { data, error } = await supabase
      //   .from('membership_plans')
      //   .select('stripe_monthly_price_id, stripe_yearly_price_id')
      //   .eq('tier', tier)
      //   .eq('is_active', true)
      //   .single();
      
      // if (error || !data || !data.stripe_monthly_price_id || !data.stripe_yearly_price_id) {
      //   console.warn(`Could not find price IDs for tier: ${tier}, using test price IDs`);
      //   // Use test price IDs
        return {
          monthly: TEST_PRICE_IDS[tier].monthly,
          yearly: TEST_PRICE_IDS[tier].yearly
        };
    } catch (error) {
      console.error('Error getting price IDs:', error);
      // Fallback to test price IDs
      return {
        monthly: TEST_PRICE_IDS[tier].monthly,
        yearly: TEST_PRICE_IDS[tier].yearly
      };
    }
  },

  /**
   * Create a checkout session for a new subscription using Stripe Checkout
   */
  async createCheckoutSession(
    userId: string, 
    tier: MembershipTier, 
    billingCycle: 'monthly' | 'yearly'
  ): Promise<void> {
    try {
      // Get price IDs
      const priceIds = await this.getPriceIds(tier);
      console.log(priceIds)
      const priceId = billingCycle === 'monthly' ? priceIds.monthly : priceIds.yearly;
      console.log(priceId)
      
      console.log(`Creating checkout session for ${tier} (${billingCycle}) with priceId: ${priceId}`);
      
      // Get Stripe instance
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create Checkout Session directly
      const { error } = await stripe.redirectToCheckout({
        mode: 'subscription',
        lineItems: [{ price: priceId, quantity: 1 }],
        successUrl: `${window.location.origin}/membership/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
        cancelUrl: `${window.location.origin}/membership`,
        clientReferenceId: userId,
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process. Please try again.');
      throw error;
    }
  },

  /**
   * Update an existing subscription
   */
  async updateSubscription(
    subscriptionId: string,
    newTier: MembershipTier,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<any> {
    try {
      // Get price IDs
      const priceIds = await this.getPriceIds(newTier);
      const priceId = billingCycle === 'monthly' ? priceIds.monthly : priceIds.yearly;
      
      console.log(`Updating subscription ${subscriptionId} to ${newTier} (${billingCycle}) with priceId: ${priceId}`);
      
      // Create a Stripe Customer Portal session for subscription management
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // For subscription updates, we'll use Stripe Customer Portal
      // This requires a small backend endpoint
      const { error } = await stripe.redirectToCheckout({
        mode: 'subscription',
        lineItems: [{ price: priceId, quantity: 1 }],
        successUrl: `${window.location.origin}/membership/success?session_id={CHECKOUT_SESSION_ID}&tier=${newTier}`,
        cancelUrl: `${window.location.origin}/membership`,
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription. Please try again.');
      throw error;
    }
  },

  /**
   * Create a customer portal session for managing subscriptions
   */
  async createCustomerPortalSession(customerId: string): Promise<void> {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll just show a message
      toast.info('Customer portal access is not available in demo mode');
      
      // Simulate success for demo purposes
      return Promise.resolve();
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      toast.error('Failed to access customer portal');
      throw error;
    }
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    try {
      // In a real implementation, this would call a backend endpoint
      console.log(`Canceling subscription ${subscriptionId}`);
      toast.success('Subscription canceled successfully');
      
      // Simulate success for demo purposes
      return { success: true, message: 'Subscription canceled' };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
      throw error;
    }
  },

  /**
   * Pause a subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<any> {
    try {
      // In a real implementation, this would call a backend endpoint
      console.log(`Pausing subscription ${subscriptionId}`);
      toast.success('Subscription paused successfully');
      
      // Simulate success for demo purposes
      return { success: true, message: 'Subscription paused' };
    } catch (error) {
      console.error('Error pausing subscription:', error);
      toast.error('Failed to pause subscription');
      throw error;
    }
  },

  /**
   * Resume a paused subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<any> {
    try {
      // In a real implementation, this would call a backend endpoint
      console.log(`Resuming subscription ${subscriptionId}`);
      toast.success('Subscription resumed successfully');
      
      // Simulate success for demo purposes
      return { success: true, message: 'Subscription resumed' };
    } catch (error) {
      console.error('Error resuming subscription:', error);
      toast.error('Failed to resume subscription');
      throw error;
    }
  },

  /**
   * Get customer payment methods
   */
  async getPaymentMethods(customerId: string): Promise<any> {
    // In a real implementation, this would call a backend endpoint
    // For now, return mock data
    return {
      data: [
        {
          id: 'pm_mock_card',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            exp_month: 12,
            exp_year: 2025
          }
        }
      ]
    };
  },

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<any> {
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, return mock data
      return {
        id: invoiceId,
        amount_paid: 4900,
        currency: 'usd',
        status: 'paid',
        created: Date.now() / 1000,
        period_start: Date.now() / 1000,
        period_end: Date.now() / 1000 + 30 * 24 * 60 * 60,
        lines: {
          data: [
            {
              description: 'Premium Membership - Monthly',
              amount: 4900,
              period: {
                start: Date.now() / 1000,
                end: Date.now() / 1000 + 30 * 24 * 60 * 60
              }
            }
          ]
        }
      };
    } catch (error) {
      console.error('Error getting invoice:', error);
      throw error;
    }
  },
};
