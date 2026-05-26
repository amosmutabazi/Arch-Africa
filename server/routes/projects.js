const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `project-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Images only'));
    cb(null, true);
  },
});

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function localizeProject(row, lang) {
  const l = ['en', 'fr', 'rw'].includes(lang) ? lang : 'en';
  const titleKey = l === 'en' ? 'title_en' : `title_${l}`;
  const descKey = l === 'en' ? 'description_en' : `description_${l}`;
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row[titleKey] || row.title_en,
    description: row[descKey] || row.description_en,
    image_url: row.image_url,
    price_cents: row.price_cents,
    currency: row.currency,
    featured: !!row.featured,
    published: !!row.published,
    created_at: row.created_at,
  };
}

router.get('/', (req, res) => {
  const lang = req.query.lang || 'en';
  const category = req.query.category;
  const featured = req.query.featured;
  let sql = 'SELECT * FROM projects WHERE published = 1';
  const params = [];
  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (featured === '1') sql += ' AND featured = 1';
  sql += ' ORDER BY featured DESC, created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json({ projects: rows.map((r) => localizeProject(r, lang)) });
});

router.get('/admin/all', adminRequired, (req, res) => {
  const rows = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  res.json({ projects: rows });
});

router.get('/:idOrSlug', (req, res) => {
  const lang = req.query.lang || 'en';
  const key = req.params.idOrSlug;
  const row = /^\d+$/.test(key)
    ? db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(key))
    : db.prepare('SELECT * FROM projects WHERE slug = ?').get(key);
  if (!row || (!row.published && req.user?.role !== 'admin')) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json({ project: localizeProject(row, lang) });
});

router.post('/', adminRequired, upload.single('image'), (req, res) => {
  try {
    const b = req.body;
    const title = b.title_en || b.title;
    if (!title) return res.status(400).json({ error: 'title_en required' });

    let image_url = b.image_url;
    if (req.file) image_url = `/uploads/${req.file.filename}`;
    if (!image_url) return res.status(400).json({ error: 'Image required' });

    let slug = slugify(b.slug || title);
    const exists = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug);
    if (exists) slug += `-${Date.now()}`;

    const result = db
      .prepare(
        `INSERT INTO projects (
          slug, category, title_en, title_fr, title_rw,
          description_en, description_fr, description_rw,
          image_url, price_cents, currency, featured, published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        slug,
        b.category || 'house',
        title,
        b.title_fr || null,
        b.title_rw || null,
        b.description_en || b.description || '',
        b.description_fr || null,
        b.description_rw || null,
        image_url,
        Number(b.price_cents) || 0,
        b.currency || 'usd',
        b.featured === '1' || b.featured === true ? 1 : 0,
        b.published === '0' || b.published === false ? 0 : 1
      );

    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ project: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', adminRequired, upload.single('image'), (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const b = req.body;
  let image_url = existing.image_url;
  if (req.file) image_url = `/uploads/${req.file.filename}`;

  db.prepare(
    `UPDATE projects SET
      slug = ?, category = ?, title_en = ?, title_fr = ?, title_rw = ?,
      description_en = ?, description_fr = ?, description_rw = ?,
      image_url = ?, price_cents = ?, currency = ?, featured = ?, published = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(
    b.slug || existing.slug,
    b.category ?? existing.category,
    b.title_en ?? existing.title_en,
    b.title_fr ?? existing.title_fr,
    b.title_rw ?? existing.title_rw,
    b.description_en ?? existing.description_en,
    b.description_fr ?? existing.description_fr,
    b.description_rw ?? existing.description_rw,
    b.image_url || image_url,
    b.price_cents !== undefined ? Number(b.price_cents) : existing.price_cents,
    b.currency ?? existing.currency,
    b.featured !== undefined ? (b.featured === '1' || b.featured === true ? 1 : 0) : existing.featured,
    b.published !== undefined ? (b.published === '0' || b.published === false ? 0 : 1) : existing.published,
    id
  );

  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ project: row });
});

router.delete('/:id', adminRequired, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (!result.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
