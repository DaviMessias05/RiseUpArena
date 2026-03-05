/**
 * Script único para criar Produtos, Preços e Payment Links no Stripe.
 * Rode uma vez: node scripts/create-stripe-links.js
 * Copie as URLs geradas para o frontend.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const RC_PACKAGES = [
  { id: 'starter', name: 'Starter — 5.000 RC', price_cents: 1500 },
  { id: 'popular', name: 'Popular — 12.000 RC', price_cents: 2900 },
  { id: 'pro', name: 'Pro — 35.000 RC', price_cents: 6900 },
  { id: 'elite', name: 'Elite — 80.000 RC', price_cents: 12900 },
  { id: 'ultra', name: 'Ultra — 200.000 RC', price_cents: 29900 },
];

const VIP_PLANS = [
  { id: 'vip_bronze', name: 'VIP Bronze — 30 dias', price_cents: 2490 },
  { id: 'vip_silver', name: 'VIP Silver — 30 dias', price_cents: 5000 },
  { id: 'vip_premium', name: 'VIP Premium — 30 dias', price_cents: 7500 },
];

async function createPaymentLink(item) {
  // Create product
  const product = await stripe.products.create({
    name: item.name,
    metadata: { internal_id: item.id },
  });

  // Create price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: item.price_cents,
    currency: 'brl',
  });

  // Create payment link
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    after_completion: {
      type: 'redirect',
      redirect: {
        url: item.id.startsWith('vip_')
          ? 'https://riseuparena.com/vip?success=vip'
          : 'https://riseuparena.com/store?success=rc',
      },
    },
  });

  return { id: item.id, url: link.url };
}

async function main() {
  console.log('Criando Payment Links no Stripe...\n');

  const allItems = [...RC_PACKAGES, ...VIP_PLANS];
  const results = [];

  for (const item of allItems) {
    try {
      const result = await createPaymentLink(item);
      results.push(result);
      console.log(`✓ ${item.name}: ${result.url}`);
    } catch (err) {
      console.error(`✗ ${item.name}: ${err.message}`);
    }
  }

  console.log('\n\n=== Cole no código do frontend ===\n');
  console.log('const PAYMENT_LINKS = {');
  for (const r of results) {
    console.log(`  '${r.id}': '${r.url}',`);
  }
  console.log('};');
}

main().catch(console.error);
