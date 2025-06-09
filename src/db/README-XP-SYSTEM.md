# XP System Database Setup

The XP system requires several database tables and structures to work properly. This document explains what migrations you need to run and how to apply them.

## Required Tables

1. **xp_transactions** - Stores all XP transactions (rewards, referrals, etc.)
2. **profiles** - Must have `xp_points` and `level` columns

## Migration Files

The following SQL migration files need to be applied to your Supabase database:

1. `create_referral_tables.sql` - Creates the referrals and referral_redemptions tables
2. `sync_profiles_xp.sql` - Ensures the profiles table has XP fields and creates triggers

## How to Apply Migrations

1. Go to the [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Navigate to the SQL Editor
4. Copy and paste the contents of each migration file
5. Run the SQL commands

## XP System Overview

- XP is earned through referrals, class attendance, etc.
- Each XP transaction is recorded in the `xp_transactions` table
- User's total XP is stored in the `profiles.xp_points` column
- User's level is calculated based on XP thresholds
- A database trigger automatically updates the level when XP changes

## Debugging XP Issues

If users aren't seeing XP updates:

1. Check the database for recent transactions:
```sql
SELECT * FROM xp_transactions 
WHERE user_id = 'USER_ID_HERE' 
ORDER BY created_at DESC
LIMIT 10;
```

2. Verify the user's profile has the correct XP and level:
```sql
SELECT id, xp_points, level FROM profiles
WHERE id = 'USER_ID_HERE';
```

3. Manually update a user's XP (for testing):
```sql
UPDATE profiles
SET xp_points = 1000
WHERE id = 'USER_ID_HERE';
```

The system is designed to automatically handle XP calculations and level updates. The UI will reflect these changes after refreshing or when the `refreshXpData()` function is called. 