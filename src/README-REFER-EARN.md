# Refer & Earn Module

The Refer & Earn module allows users to generate and share referral codes with friends. When a new user signs up and enters a referral code, both the referrer and the new user receive rewards (XP points).

## Features

- Create and share unique referral codes
- Track referral redemptions and rewards
- Display statistics about referral usage
- Redeem referral codes from other users

## Implementation Details

### Database Tables

The module uses two main tables:

1. `referrals` - Stores the referral codes for each user
   - `id` - UUID primary key
   - `referrer_id` - User ID of the code owner
   - `referral_code` - Unique code for sharing
   - `created_at` - When the code was created
   - `uses_count` - How many times the code has been used
   - `max_uses` - Maximum number of allowed uses
   - `reward_xp` - XP awarded for each redemption
   - `is_active` - Whether the code is still active

2. `referral_redemptions` - Tracks when a code is redeemed
   - `id` - UUID primary key
   - `referral_id` - The referral being redeemed
   - `redeemer_id` - User ID of the person redeeming the code
   - `redeemed_at` - When the code was redeemed
   - `reward_given` - Whether the reward has been processed

### Frontend Components

- `ReferralContext` - Context provider for referral state and functions
- `Refer.tsx` - Main page component for the referral UI
- `referralService.ts` - Service for interacting with the referral API

### Using the Refer & Earn Feature

1. Navigate to the "Refer & Earn" page in the sidebar
2. Generate a referral code if you don't have one
3. Share the code with friends via the share button
4. Track your referrals and rewards on the dashboard
5. Redeem a code by clicking "Redeem a Code" and entering the code

### Installation

The database tables need to be created before the feature can be used. Run the SQL script in `src/db/migrations/create_referral_tables.sql` on your Supabase database.

### Rewards

- When a user redeems a code, both the referrer and the redeemer receive 500 XP
- XP is tracked in the `xp_transactions` table
- XP can be used to unlock achievements and perks in the app

## Technical Notes

- Referral codes are cached for performance
- Local storage is used as a fallback for fetching referral data
- The system has protections against self-referrals and duplicate redemptions
- Row-level security policies ensure that users can only manage their own referrals 