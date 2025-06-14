# Membership System Setup

This document provides instructions for setting up and testing the membership system with Stripe integration.

## Frontend Environment Variables

Create a `.env` file in the root of the `auth-app` directory with the following variables:

```
# Stripe API Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

## Database Setup

1. The SQL tables for memberships have already been created:
   - `memberships` - Stores user membership information
   - `membership_history` - Tracks changes to memberships

2. You need to create additional tables for the membership plans and features:

```sql
-- Create membership plans table
CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tier text NOT NULL,
  description text NOT NULL,
  monthly_price numeric(10, 2) NOT NULL,
  yearly_price numeric(10, 2) NOT NULL,
  stripe_product_id text,
  stripe_monthly_price_id text,
  stripe_yearly_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT membership_plans_tier_check CHECK (
    tier = ANY (array['basic'::text, 'premium'::text, 'elite'::text])
  )
);

-- Create membership features table
CREATE TABLE IF NOT EXISTS public.membership_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create payment history table
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL,
  payment_date timestamp with time zone NOT NULL DEFAULT now(),
  billing_period_start date,
  billing_period_end date,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT payment_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT payment_history_membership_id_fkey FOREIGN KEY (membership_id) REFERENCES public.memberships(id) ON DELETE CASCADE,
  CONSTRAINT payment_history_status_check CHECK (status = ANY (array['succeeded'::text, 'pending'::text, 'failed'::text]))
);

-- Create table for storing Stripe webhooks to prevent duplicate processing
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id text NOT NULL,
  event_type text NOT NULL,
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stripe_webhook_events_pkey PRIMARY KEY (id)
);
```

3. Insert sample membership plans:

```sql
-- Insert basic membership plan
INSERT INTO public.membership_plans (name, tier, description, monthly_price, yearly_price)
VALUES ('Basic', 'basic', 'Perfect for beginners starting their fitness journey', 29.00, 290.00);

-- Insert premium membership plan
INSERT INTO public.membership_plans (name, tier, description, monthly_price, yearly_price, is_active)
VALUES ('Premium', 'premium', 'Ideal for fitness enthusiasts looking to level up', 49.00, 490.00, true);

-- Insert elite membership plan
INSERT INTO public.membership_plans (name, tier, description, monthly_price, yearly_price)
VALUES ('Elite', 'elite', 'The ultimate fitness experience for serious athletes', 79.00, 790.00);

-- Insert features for basic plan
INSERT INTO public.membership_features (plan_id, feature_name)
SELECT id, unnest(ARRAY['Basic workout access', 'Fitness tracking', 'Community forum access', 'Progress tracking'])
FROM public.membership_plans WHERE tier = 'basic';

-- Insert features for premium plan
INSERT INTO public.membership_features (plan_id, feature_name)
SELECT id, unnest(ARRAY['All Basic features', 'Premium workouts', 'Personalized plans', 'Progress analytics', 'Nutrition guidance'])
FROM public.membership_plans WHERE tier = 'premium';

-- Insert features for elite plan
INSERT INTO public.membership_features (plan_id, feature_name)
SELECT id, unnest(ARRAY['All Premium features', '1-on-1 coaching', 'Priority support', 'Exclusive content', 'Custom workout plans', 'Advanced analytics'])
FROM public.membership_plans WHERE tier = 'elite';
```

## Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Create products and prices in Stripe:
   - Create three products: Basic, Premium, and Elite
   - For each product, create monthly and yearly prices
   - Copy the price IDs to your database or use the test price IDs provided in the code

## Implementation Approach

The current implementation uses Stripe.js to create checkout sessions directly from the frontend:

- **Pros**: No backend server required, simpler setup
- **Cons**: Limited functionality for subscription management

### How It Works

1. The frontend uses the Stripe.js library to create checkout sessions
2. When a user selects a membership plan, they are redirected to Stripe Checkout
3. After payment, the user is redirected back to the success page
4. The success page creates a membership record in the database

### Frontend-only Flow

1. User selects a membership plan
2. Frontend creates a Stripe Checkout session with the plan's price ID
3. User is redirected to Stripe Checkout
4. After payment, user is redirected back to the success page
5. Success page creates membership record in the database

## Testing the Membership Feature

1. Start the application with `npm start`
2. Navigate to `/membership` to view the membership plans
3. The UI should display three plans: Basic, Premium, and Elite
4. You can toggle between monthly and yearly billing
5. Click on a plan to start the subscription process
6. You'll be redirected to Stripe Checkout
7. Use Stripe test card numbers for testing:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002
8. After successful payment, you'll be redirected back to the app
9. Your membership status will be updated in the database

## Troubleshooting

1. **Error: "REACT_APP_STRIPE_PUBLISHABLE_KEY is not defined"**
   - The code includes a fallback to a test publishable key
   - For production, make sure to set the actual key in your .env file

2. **Plans not displaying**
   - Check the browser console for errors
   - Verify that the database tables have been created and populated
   - The application will fall back to mock data if it can't fetch plans from the database

3. **Stripe integration not working**
   - Check that the Stripe.js library is loaded correctly
   - Verify that the price IDs in the code match the ones in your Stripe account
   - Check the browser console for any errors during the checkout process 