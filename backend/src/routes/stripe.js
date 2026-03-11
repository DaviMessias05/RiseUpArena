const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate, requireAuth } = require('../middleware/auth');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// RC packages definition (must match frontend)
const RC_PACKAGES = {
  starter: { name: 'Starter — 5.000 RC', rc: 5000, price_cents: 1500 },
  popular: { name: 'Popular — 12.000 RC', rc: 12000, price_cents: 2900 },
  pro: { name: 'Pro — 35.000 RC', rc: 35000, price_cents: 6900 },
  elite: { name: 'Elite — 80.000 RC', rc: 80000, price_cents: 12900 },
  ultra: { name: 'Ultra — 200.000 RC', rc: 200000, price_cents: 29900 },
};

// VIP plans definition (must match frontend/VipPage)
const VIP_PLANS = {
  vip_bronze: { name: 'VIP Bronze', tier: 'bronze', price_cents: 2490, days: 30 },
  vip_silver: { name: 'VIP Silver', tier: 'silver', price_cents: 5000, days: 30 },
  vip_premium: { name: 'VIP Premium', tier: 'premium', price_cents: 7500, days: 30 },
};

const FRONTEND_URL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')[0].trim()
  : 'http://localhost:5173';

// POST /api/stripe/checkout-rc — Create Stripe Checkout for RC purchase
router.post('/checkout-rc', authenticate, requireAuth, async (req, res) => {
  try {
    const { package_id } = req.body;
    const pkg = RC_PACKAGES[package_id];

    if (!pkg) {
      return res.status(400).json({ error: 'Pacote inválido.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: pkg.name },
          unit_amount: pkg.price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'rc_purchase',
        package_id,
        user_id: req.user.id,
        rc_amount: String(pkg.rc),
      },
      success_url: `${FRONTEND_URL}/store?success=rc`,
      cancel_url: `${FRONTEND_URL}/store?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout RC error:', err);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
  }
});

// POST /api/stripe/checkout-vip — Create Stripe Checkout for VIP purchase
router.post('/checkout-vip', authenticate, requireAuth, async (req, res) => {
  try {
    const { plan_id } = req.body;
    const plan = VIP_PLANS[plan_id];

    if (!plan) {
      return res.status(400).json({ error: 'Plano VIP inválido.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: plan.name },
          unit_amount: plan.price_cents,
        },
        quantity: 1,
      }],
      metadata: {
        type: 'vip_purchase',
        plan_id,
        user_id: req.user.id,
        vip_tier: plan.tier,
        vip_days: String(plan.days),
      },
      success_url: `${FRONTEND_URL}/vip?success=vip`,
      cancel_url: `${FRONTEND_URL}/vip?cancelled=true`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout VIP error:', err);
    res.status(500).json({ error: 'Erro ao criar sessão de pagamento.' });
  }
});

// POST /api/stripe/webhook — Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else if (process.env.NODE_ENV === 'development') {
      // Development only: parse without signature verification
      console.warn('STRIPE_WEBHOOK_SECRET not set — skipping signature verification (dev mode).');
      event = JSON.parse(req.body);
    } else {
      console.error('STRIPE_WEBHOOK_SECRET is not configured in production.');
      return res.status(500).json({ error: 'Webhook configuration error.' });
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed.' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { type, user_id } = session.metadata;

    try {
      if (type === 'rc_purchase') {
        const rcAmount = parseInt(session.metadata.rc_amount, 10);
        // Add RC to user's balance
        const { error } = await supabase.rpc('add_credits', {
          p_user_id: user_id,
          p_amount: rcAmount,
        });
        if (error) {
          console.error('Failed to add RC credits:', error);
        } else {
          console.log(`Added ${rcAmount} RC to user ${user_id}`);
        }
      } else if (type === 'vip_purchase') {
        const { vip_tier, vip_days } = session.metadata;
        const days = parseInt(vip_days, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // Update profile with VIP tier
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            vip_tier: vip_tier,
            vip_expires_at: expiresAt.toISOString(),
          })
          .eq('id', user_id);

        if (profileError) {
          console.error('Failed to activate VIP:', profileError);
        } else {
          // Create subscription record
          await supabase.from('vip_subscriptions').insert({
            user_id,
            plan_tier: vip_tier,
            status: 'active',
            expires_at: expiresAt.toISOString(),
          });
          console.log(`Activated VIP ${vip_tier} for user ${user_id} until ${expiresAt.toISOString()}`);
        }
      }
    } catch (fulfillErr) {
      console.error('Fulfillment error:', fulfillErr);
    }
  }

  res.json({ received: true });
});

module.exports = router;
