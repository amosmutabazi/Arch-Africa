const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../db');

const router = express.Router();

// Add inquiries table to DB
db.exec(`
  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    type TEXT,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const emailEnabled = Boolean(
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD &&
  (process.env.EMAIL_SERVICE || process.env.EMAIL_HOST)
);

const transporter = emailEnabled
  ? nodemailer.createTransport(
      process.env.EMAIL_SERVICE
        ? { service: process.env.EMAIL_SERVICE, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } }
        : {
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT || 587),
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
          }
    )
  : null;

router.post('/', async (req, res) => {
  const { name, email, phone, type, message } = req.body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  db.prepare(
    'INSERT INTO inquiries (name, email, phone, type, message) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), email.trim().toLowerCase(), phone || '', type || 'other', message.trim());

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
        subject: `New Inquiry from ${name} — ${type || 'General'}`,
        html: `
          <h2>New Inquiry — ARCH-AFRICA</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Name</strong></td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Email</strong></td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #ddd">${phone || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Type</strong></td><td style="padding:8px;border:1px solid #ddd">${type || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd"><strong>Message</strong></td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>
          </table>
        `,
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'We received your inquiry — ARCH-AFRICA Bureau',
        html: `
          <p>Hi ${name},</p>
          <p>Thank you for reaching out to <strong>ARCH-AFRICA Bureau Ltd.</strong></p>
          <p>We have received your inquiry and will respond within 24 hours.</p>
          <p>Here's a summary of what you sent:</p>
          <blockquote style="border-left:3px solid #c8a951;padding-left:1rem;color:#555">${message}</blockquote>
          <p>In the meantime, feel free to reach us on WhatsApp: <a href="https://wa.link/w72bdf">+250 798 541 111</a></p>
          <br/>
          <p>Best regards,<br/><strong>ARCH-AFRICA Bureau Ltd.</strong></p>
        `,
      });
    } catch (err) {
      console.error('Inquiry email failed:', err);
    }
  }

  res.json({ ok: true, message: 'Inquiry received! We will get back to you within 24 hours.' });
});

router.get('/', async (req, res) => {
  const rows = db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC').all();
  res.json({ inquiries: rows });
});

module.exports = router;
