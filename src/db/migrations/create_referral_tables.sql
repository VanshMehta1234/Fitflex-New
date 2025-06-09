-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 10,
  reward_xp INTEGER DEFAULT 500,
  reward_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create referral_redemptions table
CREATE TABLE IF NOT EXISTS public.referral_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_id UUID NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  redeemer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reward_given BOOLEAN DEFAULT FALSE,
  UNIQUE (referral_id, redeemer_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals (referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_referral_id ON public.referral_redemptions (referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_redemptions_redeemer_id ON public.referral_redemptions (redeemer_id);

-- Add RLS policies
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;

-- Policy for referrals: users can read any referrals, but only create/edit their own
CREATE POLICY "Users can view all referrals" 
  ON public.referrals 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create their own referrals" 
  ON public.referrals 
  FOR INSERT 
  WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals" 
  ON public.referrals 
  FOR UPDATE 
  USING (auth.uid() = referrer_id);

-- Policy for redemptions: users can view their own redemptions (as referrer or redeemer)
CREATE POLICY "Users can view their own redemptions" 
  ON public.referral_redemptions 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT referrer_id FROM public.referrals WHERE id = referral_id
    ) OR auth.uid() = redeemer_id
  );

CREATE POLICY "Users can create redemptions" 
  ON public.referral_redemptions 
  FOR INSERT 
  WITH CHECK (auth.uid() = redeemer_id);

-- Add extension for generating UUIDs if not already added
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the xp_transactions table exists for tracking XP
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id ON public.xp_transactions (user_id);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own XP transactions" 
  ON public.xp_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own XP transactions" 
  ON public.xp_transactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id); 