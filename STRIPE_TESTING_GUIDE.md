# Stripe Testing Guide

This guide provides instructions for testing the Stripe payment integration in the FitFlex application and transitioning from test mode to production.

## Testing Stripe Payments

### 1. Test Environment Setup

The application is currently configured to use Stripe's test mode. The following environment variables are used:

```
# Stripe API Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51OsGqtHmITrQfBwqxfDnUUJP7Yf7FIVHxRQNFODRUjpYtNlLGXJQ8RQZGQvYjdJBxkSgLkOJJlCZVwIGBHZqiJYBl

# Test Price IDs
REACT_APP_STRIPE_BASIC_MONTHLY_PRICE_ID=price_1OsGrpHmITrQfBwqxvRZlLpj
REACT_APP_STRIPE_BASIC_YEARLY_PRICE_ID=price_1OsGrpHmITrQfBwqQvHRnkTG
REACT_APP_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_1OsGsOHmITrQfBwqiWZCKu4F
REACT_APP_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_1OsGsOHmITrQfBwqcGLbFbz9
REACT_APP_STRIPE_ELITE_MONTHLY_PRICE_ID=price_1OsGt0HmITrQfBwqSdOKQCJA
REACT_APP_STRIPE_ELITE_YEARLY_PRICE_ID=price_1OsGt0HmITrQfBwqrTzxLEKK
```

### 2. Test Cards

Use these test card numbers to simulate different payment scenarios:

| Card Number           | Description                                      |
|-----------------------|--------------------------------------------------|
| 4242 4242 4242 4242   | Successful payment                              |
| 4000 0000 0000 0002   | Card declined (generic decline)                  |
| 4000 0000 0000 9995   | Card declined (insufficient funds)              |
| 4000 0000 0000 3220   | 3D Secure 2 authentication required              |
| 4000 0027 6000 3184   | 3D Secure 2 authentication required (out of band)|

For all test cards:
- Use any future date for the expiration date
- Use any 3-digit CVC (4 digits for American Express)
- Use any postal code

### 3. Testing Process

1. Start the application with `npm start`
2. Navigate to `/membership` to view the membership plans
3. Select a plan and billing cycle (monthly or yearly)
4. Click on "Subscribe" to initiate the checkout process
5. You'll be redirected to Stripe's checkout page
6. Enter one of the test card numbers above
7. Complete the checkout process
8. You'll be redirected back to the success page
9. Check the browser console for logs showing the checkout session ID
10. Verify that the membership record is created in the database

### 4. Testing Subscription Management

Currently, subscription management is simulated in the frontend. When testing:

- Cancellation, pausing, and resuming subscriptions will show success messages but won't make actual changes to Stripe subscriptions
- Payment history is mocked in the frontend

## Transitioning to Production

When you're ready to move to production, follow these steps:

### 1. Create Products and Prices in Stripe Production

1. Log in to your Stripe dashboard (production mode)
2. Create products for each membership tier (Basic, Premium, Elite)
3. For each product, create prices for monthly and yearly billing
4. Note the price IDs for each product/billing combination

### 2. Update Environment Variables

Update your `.env` file with production values:

```
# Stripe API Keys
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key

# Production Price IDs
REACT_APP_STRIPE_BASIC_MONTHLY_PRICE_ID=price_live_your_basic_monthly_price_id
REACT_APP_STRIPE_BASIC_YEARLY_PRICE_ID=price_live_your_basic_yearly_price_id
REACT_APP_STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_live_your_premium_monthly_price_id
REACT_APP_STRIPE_PREMIUM_YEARLY_PRICE_ID=price_live_your_premium_yearly_price_id
REACT_APP_STRIPE_ELITE_MONTHLY_PRICE_ID=price_live_your_elite_monthly_price_id
REACT_APP_STRIPE_ELITE_YEARLY_PRICE_ID=price_live_your_elite_yearly_price_id
```

### 3. Backend Implementation (Recommended)

For production, it's strongly recommended to implement a backend server to:

1. Create checkout sessions securely
2. Handle Stripe webhooks for subscription lifecycle events
3. Securely manage customer data
4. Implement proper subscription management

The server implementation should:

- Use Stripe's server-side libraries
- Store the Stripe secret key securely on the server
- Implement webhook handlers for events like:
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. Update Database

1. Update the `membership_plans` table with your production price IDs
2. Ensure proper database permissions for production

### 5. Testing in Production

Before full launch:

1. Test the complete payment flow with real cards (use small amounts)
2. Verify webhooks are working correctly
3. Test subscription management (upgrades, downgrades, cancellations)
4. Verify email notifications are sent correctly

## Troubleshooting

### Common Issues

1. **Invalid API Key**: Ensure your publishable key is correct and properly formatted
2. **Price ID Not Found**: Verify that the price IDs in your environment variables match the ones in your Stripe account
3. **Webhook Failures**: Check webhook signatures and ensure your endpoint is accessible
4. **Redirect Issues**: Verify that success and cancel URLs are properly configured

### Debugging Tools

1. Stripe Dashboard: Check the Events and Logs sections
2. Browser Console: Look for errors in the network requests
3. Stripe CLI: Use for local webhook testing

For more information, refer to [Stripe's official documentation](https://stripe.com/docs/testing). 