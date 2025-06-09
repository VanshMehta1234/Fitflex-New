# FitFlex XP Rewards System

This document outlines all the ways users can earn XP in the FitFlex application. The XP system is designed to encourage user engagement and reward consistent usage of the app.

## XP Reward Amounts

| Action | XP Amount | Description |
|--------|-----------|-------------|
| **Daily Check-in** | 20 XP | For checking in at the gym each day |
| **Consecutive Check-in Bonus** | +5 XP per day | Additional XP for maintaining a streak (up to 6 days) |
| **Weekly Streak Bonus** | 50 XP | Bonus for completing 7 consecutive days |
| **Class Booking** | 10 XP | For booking a fitness class |
| **Class Attendance** | 30 XP | For attending a booked class |
| **First-time Class Attendance** | +50 XP | Bonus when attending a class type for the first time |
| **Multiple Classes in a Week** | 25 XP | For completing 3, 5, or 7 classes in a week |
| **Profile Completion** | 40 XP | For completing your profile (name + photo) |
| **Sending a Referral** | 15 XP | For sharing a referral link with friends |
| **Successful Referral Signup** | 100 XP | When someone uses your referral code to join |
| **Weekly Feedback Submission** | 25 XP | For submitting weekly feedback about the gym |
| **Social Media Sharing** | 20 XP | For sharing the app on social media |
| **Level 5 Milestone** | 100 XP | Bonus for reaching level 5 |
| **Level 10 Milestone** | 200 XP | Bonus for reaching level 10 |
| **Level 15 Milestone** | 300 XP | Bonus for reaching level 15 |
| **Level 20 Milestone** | 500 XP | Bonus for reaching level 20 |

## Level Requirements

| Level | XP Required |
|-------|-------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 450 |
| 5 | 700 |
| 6 | 1,000 |
| 7 | 1,350 |
| 8 | 1,750 |
| 9 | 2,200 |
| 10 | 2,700 |
| 11 | 3,250 |
| 12 | 3,850 |
| 13 | 4,500 |
| 14 | 5,200 |
| 15 | 6,000 |
| 16 | 6,850 |
| 17 | 7,750 |
| 18 | 8,700 |
| 19 | 9,700 |
| 20 | 10,750 |

## Implementation Details

The XP system is implemented through the following files:

- `src/lib/xpRewardsService.ts` - Contains all XP reward functions
- `src/lib/xpService.ts` - Core XP tracking functionality
- `src/context/XpContext.tsx` - Context provider for XP state
- `src/components/XpNotification.tsx` - Visual notification for XP gains

## How XP Awards are Triggered

1. **Check-ins**:
   - XP is awarded automatically when a user checks in through the app
   - Streak bonuses are calculated based on consecutive days

2. **Class Bookings & Attendance**:
   - XP is awarded when booking a class
   - Additional XP is awarded when attendance is marked for the class
   - First-time bonus is awarded for attending a new class type

3. **Profile Completion**:
   - XP is awarded when a user adds both their name and profile picture

4. **Referrals**:
   - XP is awarded when creating a referral link
   - XP is awarded when someone successfully uses your referral code

5. **Feedback**:
   - XP is awarded when submitting weekly feedback about the gym

6. **Level Milestones**:
   - XP is awarded automatically when reaching level 5, 10, 15, and 20

## XP Notifications

All XP awards trigger a visual notification in the bottom-right corner of the screen, showing the amount of XP earned and the reason. 