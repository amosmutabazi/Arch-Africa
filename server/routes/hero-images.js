const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { adminRequired } = require('../middleware/auth');

const router = express.Router();
const heroDir = path.join(__dirname, '..', '..', 'assets', 'hero');
if (!fs.existsSync(heroDir)) fs.mkdirSync(heroDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, heroDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, fileName);
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

function safeName(name) {
  return path.basename(name);
}

function listImages() {
  return fs
    .readdirSync(heroDir)
    .filter((file) => !file.startsWith('.') && /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(file))
    .sort();
}

router.get('/', (req, res) => {
  try {
    const images = listImages().map((name) => `assets/hero/${name}`);
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to load hero images' });
  }
});

router.post('/', adminRequired, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Image file required' });
  }
  res.status(201).json({
    image_url: `assets/hero/${req.file.filename}`,
    fileName: req.file.filename,
  });
});

router.delete('/:name', adminRequired, (req, res) => {
  const name = safeName(req.params.name);
  const filePath = path.join(heroDir, name);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  try {
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unable to delete image' });
  }
});

module.exports = router;
