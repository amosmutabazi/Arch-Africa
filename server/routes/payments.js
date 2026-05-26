const express = require('express');
const Stripe = require('stripe');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('...')) return null;
  return new Stripe(key);
}

router.post('/create-checkout-session', authRequired, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Payments not configured. Add STRIPE_SECRET_KEY to .env',
    });
  }

  const { projectIds } = req.body;
  if (!Array.isArray(projectIds) || !projectIds.length) {
    return res.status(400).json({ error: 'projectIds array required' });
  }

  const placeholders = projectIds.map(() => '?').join(',');
  const projects = db
    .prepare(`SELECT * FROM projects WHERE id IN (${placeholders}) AND published = 1`)
    .all(...projectIds.map(Number));

  if (!projects.length) return res.status(400).json({ error: 'No valid projects' });

  const line_items = projects.map((p) => ({
    price_data: {
      currency: p.currency || 'usd',
      product_data: {
        name: p.title_en,
        description: p.description_en?.slice(0, 200) || 'ARCH-AFRICA design package',
        images: p.image_url.startsWith('http')
          ? [p.image_url]
          : [`${process.env.SITE_URL}${p.image_url}`],
      },
      unit_amount: p.price_cents > 0 ? p.price_cents : 5000,
    },
    quantity: 1,
  }));

  const total = projects.reduce((s, p) => s + (p.price_cents > 0 ? p.price_cents : 5000), 0);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.SITE_URL}/checkout-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/gallery.html?canceled=1`,
      customer_email: req.user.email,
      metadata: {
        user_id: String(req.user.id),
        project_ids: projectIds.join(','),
      },
    });

    db.prepare(
      `INSERT INTO orders (user_id, stripe_session_id, amount_cents, currency, status, items_json, customer_email)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`
    ).run(
      req.user.id,
      session.id,
      total,
      projects[0].currency || 'usd',
      JSON.stringify(projects.map((p) => ({ id: p.id, title: p.title_en }))),
      req.user.email
    );

    res.json({ url: session.url, sessionId: session.id });
  } catch (e) {
    console.error('Stripe error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.get('/config', (_req, res) => {
  res.json({
    enabled: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('...')),
  });
});

async function webhookHandler(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(503).send('Stripe not configured');

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    db.prepare(`UPDATE orders SET status = 'paid' WHERE stripe_session_id = ?`).run(session.id);
  }
  res.json({ received: true });
}

module.exports = { router, webhookHandler };
