const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, role: row.role };
}

router.post('/register', (req, res) => {
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
  res.status(201).json({ token, user: publicUser(user) });
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

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
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
  if (process.env.NODE_ENV === 'development') {
    return res.json({ message: 'Reset link created (dev only)', resetUrl });
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
