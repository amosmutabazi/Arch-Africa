require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

require('./db');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const { router: paymentRoutes, webhookHandler } = require('./routes/payments');
const inquiryRoutes = require('./routes/inquiries');
const heroImageRoutes = require('./routes/hero-images');

require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;
const root = path.join(__dirname, '..');

app.use(cookieParser());

app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookHandler
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(root, 'uploads')));
app.use(express.static(root));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/hero-images', heroImageRoutes);

app.get('/api/config', (_req, res) => {
  res.json({
    tawkPropertyId: process.env.TAWK_PROPERTY_ID || '',
    tawkWidgetId: process.env.TAWK_WIDGET_ID || 'default',
    siteUrl: process.env.SITE_URL || `http://localhost:${PORT}`,
    gaTrackingId: process.env.GA_TRACKING_ID || '',
    adminWhatsAppNumber: process.env.ADMIN_WHATSAPP_NUMBER || '',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    emailEnabled: Boolean(
      process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD &&
        (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST)
    ),
    twilioEnabled: Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM &&
      process.env.ADMIN_WHATSAPP_NUMBER
    ),
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const file = path.join(root, req.path === '/' ? 'index.html' : req.path);
  if (file.endsWith('.html') || !path.extname(req.path)) {
    const tryFile = path.extname(req.path) ? file : path.join(root, 'index.html');
    return res.sendFile(tryFile, (err) => {
      if (err) res.sendFile(path.join(root, 'index.html'));
    });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`ARCH-AFRICA server → http://localhost:${PORT}`);
  console.log(`Gallery → http://localhost:${PORT}/gallery.html`);
  console.log(`Admin CMS → http://localhost:${PORT}/admin.html`);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.warn('⚠ Set a strong JWT_SECRET in .env for production');
  }
});