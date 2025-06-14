const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Create a Stripe Checkout Session
app.post('/api/payments/create-checkout-session', async (req, res) => {
  try {
    const { userId, priceId, tier, billingCycle } = req.body;

    // Create a new checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/membership`,
      client_reference_id: userId,
      metadata: {
        userId,
        tier,
        billingCycle,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Handle Stripe webhook events
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check if we've already processed this event
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .select('id')
    .eq('id', event.id)
    .single();

  if (data) {
    // Event already processed
    return res.status(200).json({ received: true, duplicate: true });
  }

  // Handle the event based on its type
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Record the event as processed
  await supabase.from('stripe_webhook_events').insert([
    {
      id: event.id,
      event_type: event.type,
    },
  ]);

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).json({ received: true });
});

// Helper function to handle checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    const { client_reference_id: userId, metadata } = session;
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    const customer = await stripe.customers.retrieve(session.customer);

    // Calculate dates
    const startDate = new Date(subscription.current_period_start * 1000).toISOString();
    const endDate = new Date(subscription.current_period_end * 1000).toISOString();

    // Create membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .insert([
        {
          user_id: userId,
          type: metadata.tier,
          status: 'active',
          start_date: startDate,
          end_date: endDate,
          auto_renew: true,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id,
        },
      ])
      .select()
      .single();

    if (membershipError) {
      console.error('Error creating membership:', membershipError);
      return;
    }

    // Add membership history record
    await supabase.from('membership_history').insert([
      {
        membership_id: membership.id,
        action: 'created',
        timestamp: new Date().toISOString(),
        details: `Created ${metadata.tier} membership`,
      },
    ]);

    console.log(`Membership created for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout.session.completed:', error);
  }
}

// Helper function to handle invoice.paid event
async function handleInvoicePaid(invoice) {
  try {
    // Get subscription and customer details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customerId = invoice.customer;

    // Find the membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (membershipError) {
      console.error('Error finding membership:', membershipError);
      return;
    }

    // Add payment record
    await supabase.from('payment_history').insert([
      {
        user_id: membership.user_id,
        membership_id: membership.id,
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents to dollars
        currency: invoice.currency,
        status: 'succeeded',
        payment_date: new Date().toISOString(),
        billing_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        billing_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      },
    ]);

    // Update membership dates
    await supabase
      .from('memberships')
      .update({
        start_date: new Date(subscription.current_period_start * 1000).toISOString(),
        end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    // Add membership history record
    await supabase.from('membership_history').insert([
      {
        membership_id: membership.id,
        action: 'renewed',
        timestamp: new Date().toISOString(),
        details: `Membership renewed for period ${new Date(
          subscription.current_period_start * 1000
        ).toLocaleDateString()} to ${new Date(
          subscription.current_period_end * 1000
        ).toLocaleDateString()}`,
      },
    ]);

    console.log(`Payment recorded for membership ${membership.id}`);
  } catch (error) {
    console.error('Error handling invoice.paid:', error);
  }
}

// Helper function to handle invoice.payment_failed event
async function handleInvoicePaymentFailed(invoice) {
  try {
    // Find the membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (membershipError) {
      console.error('Error finding membership:', membershipError);
      return;
    }

    // Add payment record
    await supabase.from('payment_history').insert([
      {
        user_id: membership.user_id,
        membership_id: membership.id,
        stripe_payment_intent_id: invoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due / 100, // Convert from cents to dollars
        currency: invoice.currency,
        status: 'failed',
        payment_date: new Date().toISOString(),
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date().toISOString(),
      },
    ]);

    console.log(`Failed payment recorded for membership ${membership.id}`);
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
  }
}

// Helper function to handle customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find the membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (membershipError) {
      console.error('Error finding membership:', membershipError);
      return;
    }

    // Determine the new status
    let status = membership.status;
    let action = 'updated';
    let details = 'Subscription details updated';

    if (subscription.status === 'active' && membership.status !== 'active') {
      status = 'active';
      action = 'resumed';
      details = 'Subscription resumed';
    } else if (subscription.status === 'paused' && membership.status !== 'paused') {
      status = 'paused';
      action = 'paused';
      details = 'Subscription paused';
    } else if (subscription.status === 'canceled' && membership.status !== 'cancelled') {
      status = 'cancelled';
      action = 'cancelled';
      details = 'Subscription cancelled';
    }

    // Update membership
    await supabase
      .from('memberships')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    // Add membership history record
    await supabase.from('membership_history').insert([
      {
        membership_id: membership.id,
        action,
        timestamp: new Date().toISOString(),
        details,
      },
    ]);

    console.log(`Membership ${membership.id} updated to status: ${status}`);
  } catch (error) {
    console.error('Error handling customer.subscription.updated:', error);
  }
}

// Helper function to handle customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find the membership record
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (membershipError) {
      console.error('Error finding membership:', membershipError);
      return;
    }

    // Update membership
    await supabase
      .from('memberships')
      .update({
        status: 'cancelled',
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', membership.id);

    // Add membership history record
    await supabase.from('membership_history').insert([
      {
        membership_id: membership.id,
        action: 'cancelled',
        timestamp: new Date().toISOString(),
        details: 'Subscription cancelled',
      },
    ]);

    console.log(`Membership ${membership.id} cancelled`);
  } catch (error) {
    console.error('Error handling customer.subscription.deleted:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 