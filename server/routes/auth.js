const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === 'production' ? '' : 'dev-jwt-secret-change-me');

const emailEnabled = Boolean(
  process.env.EMAIL_USER &&
    process.env.EMAIL_PASSWORD &&
    (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST)
);

const emailTransportOptions = process.env.EMAIL_SERVICE
  ? {
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    }
  : process.env.EMAIL_HOST
  ? {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
      },
    }
  : null;

const emailTransporter = emailEnabled
  ? nodemailer.createTransport(emailTransportOptions)
  : null;
const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'Arch Africa Bureau <no-reply@archafricabureau.com>';

if (emailTransporter) {
  emailTransporter.verify().then(
    () => console.log('SMTP transporter ready. Email delivery enabled.'),
    (err) => console.warn('SMTP transporter verification failed:', err.message || err)
  );
}

function signToken(user) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  const em = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(em);
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 12);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(name.trim(), em, hash, 'user');

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);
  let emailSent = false;

  if (emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: emailFrom,
        to: user.email,
        subject: 'Welcome to ARCH-AFRICA',
        html: `<p>Hi ${user.name},</p><p>Welcome to ARCH-AFRICA. Your account has been created.</p>`,
      });
      emailSent = true;
    } catch (err) {
      console.error('Welcome email failed:', err);
    }
  }

  res.status(201).json({ token, user: publicUser(user), emailSent });
});

// Google sign-in: accept Google ID token from client, verify, and create/find user
router.post('/google', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ error: 'id_token required' });
  try {
    // verify token with Google tokeninfo endpoint
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
    const data = await resp.json();
    if (data.aud && process.env.GOOGLE_CLIENT_ID && data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Invalid token audience' });
    }
    const email = (data.email || '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Unable to verify Google token' });
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      const name = data.name || email.split('@')[0];
      const result = db
        .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(name, email, '', 'user');
      user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    console.error('Google sign-in failed', e);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000).toISOString();
  db.prepare('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').run(
    user.id,
    token,
    expires
  );

  const resetUrl = `${process.env.SITE_URL}/reset-password.html?token=${token}`;

  if (emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: emailFrom,
        to: normalizedEmail,
        subject: 'Reset your password',
        html: `
          <p>Hi,</p>
          <p>You requested a password reset for your Arch Africa Bureau account.</p>
          <p><a href="${resetUrl}">Click here to reset your password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (error) {
      console.error('Password reset email failed:', error);
    }
  }

  if (process.env.NODE_ENV === 'development' && !emailTransporter) {
    return res.json({ message: 'Reset link created (dev only)', resetUrl });
  }

  if (!emailTransporter && process.env.NODE_ENV !== 'development') {
    console.warn('⚠ Password reset email not configured. Set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_SERVICE or EMAIL_HOST.');
  }

  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

router.post('/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ error: 'Valid token and password (8+ chars) required' });
  }
  const row = db
    .prepare(
      `SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')`
    )
    .get(token);
  if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });

  const hash = bcrypt.hashSync(password, 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(row.id);
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
