require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const adminEmail = process.env.ADMIN_EMAIL || 'admin@archafricabureau.com';
const adminPass = process.env.ADMIN_PASSWORD || 'ChangeMeAdmin123!';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync(adminPass, 12);
  db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run(
    'ARCH Admin',
    adminEmail,
    hash,
    'admin'
  );
  console.log('Admin user created:', adminEmail);
} else {
  console.log('Admin already exists:', adminEmail);
}

const count = db.prepare('SELECT COUNT(*) as c FROM projects').get().c;
if (count === 0) {
  const samples = [
    {
      slug: '4-bedroom-contemporary',
      category: 'house',
      title_en: '4-Bedroom Contemporary Residence',
      description_en: 'Affordable package with full permit-ready architecture drawings.',
      image_url:
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
      price_cents: 29900,
      featured: 1,
    },
    {
      slug: 'twin-house-g1',
      category: 'house',
      title_en: 'Twin House G+1',
      description_en: 'Modern double-unit family concept for urban neighborhoods.',
      image_url:
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      price_cents: 34900,
      featured: 1,
    },
    {
      slug: '5-bedroom-villa',
      category: 'villa',
      title_en: '5-Bedroom Contemporary Villa',
      description_en: 'Luxury layout balancing elegance, airflow, and natural lighting.',
      image_url:
        'https://images.unsplash.com/photo-1613977257592-4a9a32f9141b?w=800&q=80',
      price_cents: 49900,
      featured: 1,
    },
    {
      slug: 'hotel-5-star',
      category: 'hotel',
      title_en: 'Hotel 5-Star Modern Design',
      description_en: 'Contemporary hospitality architecture with efficient circulation.',
      image_url:
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
      price_cents: 99900,
      featured: 0,
    },
    {
      slug: 'commercial-plaza',
      category: 'commercial',
      title_en: 'Commercial Plaza Concept',
      description_en: 'Mixed-use retail and office footprint for growing districts.',
      image_url:
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
      price_cents: 79900,
      featured: 0,
    },
    {
      slug: 'greenhouse-agri',
      category: 'greenhouse',
      title_en: 'Agricultural Greenhouse',
      description_en: 'Climate-smart greenhouse structure for sustainable farming.',
      image_url:
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
      price_cents: 19900,
      featured: 0,
    },
  ];

  const ins = db.prepare(
    `INSERT INTO projects (slug, category, title_en, description_en, image_url, price_cents, currency, featured, published)
     VALUES (?, ?, ?, ?, ?, ?, 'usd', ?, 1)`
  );
  for (const p of samples) {
    ins.run(p.slug, p.category, p.title_en, p.description_en, p.image_url, p.price_cents, p.featured);
  }
  console.log('Seeded', samples.length, 'projects');
} else {
  console.log('Projects already seeded:', count);
}

console.log('Done.');
