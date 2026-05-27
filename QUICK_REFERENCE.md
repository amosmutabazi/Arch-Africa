# ARCH-AFRICA — Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# Install dependencies (first time only)
npm install

# Seed database with sample data
npm run seed

# Start dev server (with auto-reload)
npm run dev

# Start production server
npm start

# Server runs on: http://localhost:3000
```

## 📍 Important URLs

| Page | URL |
|------|-----|
| Home | `http://localhost:3000` |
| Gallery | `http://localhost:3000/gallery.html` |
| Admin CMS | `http://localhost:3000/admin.html` |
| Password Reset | `http://localhost:3000/reset-password.html` |

## 🔑 Default Admin Login

```
Email:    admin@archafricabureau.com
Password: ChangeMeAdmin123!
```

⚠️ **Change these in `.env` file for production!**

---

## 📁 Key File Locations

### Backend (Node.js)
```
server/
├── index.js              ← Main server file
├── db.js                 ← Database setup
├── seed.js               ← Initial data
├── routes/
│   ├── auth.js           ← Login/register/reset password
│   ├── projects.js       ← Project CRUD
│   └── payments.js       ← Stripe integration
└── middleware/
    └── auth.js           ← JWT authentication
```

### Frontend (HTML/CSS/JS)
```
js/
├── api.js                ← HTTP client for all API calls
├── admin.js              ← Admin dashboard
├── auth-ui.js            ← Login/register modals
├── projects.js           ← Project display
├── cart.js               ← Shopping cart
├── i18n.js               ← Multi-language
└── theme.js              ← Dark/light mode

HTML Files:
├── index.html            ← Home page
├── gallery.html          ← Project gallery
├── admin.html            ← Admin panel
├── checkout-success.html ← Payment success
└── reset-password.html   ← Password reset

Styles:
└── styles.css            ← All styling

Translations:
locales/
├── en.json               ← English
├── fr.json               ← French
└── rw.json               ← Rwandan
```

### Configuration
```
.env                      ← Environment variables
package.json              ← Dependencies & scripts
data/arch-africa.db       ← SQLite database (created on first run)
```

---

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/register          ← Sign up
POST   /api/auth/login             ← Sign in
GET    /api/auth/me                ← Get current user
POST   /api/auth/forgot-password   ← Request password reset
POST   /api/auth/reset-password    ← Reset password
```

### Projects
```
GET    /api/projects               ← Get all public projects
GET    /api/projects?category=X    ← Filter by category
GET    /api/projects/admin/all     ← Get ALL projects (admin only)
POST   /api/projects               ← Create project (admin only)
PUT    /api/projects/:id           ← Update project (admin only)
DELETE /api/projects/:id           ← Delete project (admin only)
```

### Payments
```
GET    /api/payments/config               ← Get Stripe key
POST   /api/payments/create-checkout-session ← Create checkout
```

---

## 💾 Database Tables

### users
- `id`, `name`, `email`, `password_hash`, `role`, `created_at`
- **Roles:** "user" or "admin"

### projects
- `id`, `slug`, `category`, `title_*`, `description_*`, `image_url`, `price_cents`, `featured`, `published`
- **Categories:** house, villa, hotel, commercial, industrial, institutional, greenhouse

### orders
- `id`, `user_id`, `stripe_session_id`, `amount_cents`, `status`, `items_json`, `customer_email`

### password_resets
- `id`, `user_id`, `token`, `expires_at`, `used`

---

## 🔐 How Security Works

### Passwords
- Hashed with **bcryptjs** (cost 12)
- Never stored in plain text
- Compared using bcrypt's compare function

### Authentication
- JWT tokens created on login (7-day expiration)
- Stored in browser's **localStorage**
- Sent in `Authorization: Bearer {token}` header
- Verified on every protected request

### Admin Protection
- Checked via `role === 'admin'` in middleware
- Applied to sensitive routes
- Returns 403 Forbidden if not admin

### Password Reset
- Random 64-character tokens
- Expire after 1 hour
- Can only be used once
- Marked as `used=1` after reset

---

## 🛠️ Making Common Changes

### Change the Logo
1. Replace `assets/arch-africa-logo.jpeg`
2. Update these files to point to new logo:
   - `index.html` (navbar)
   - `gallery.html` (navbar)
   - `admin.html` (navbar + login)

### Change Admin Password
1. Edit `.env`:
   ```
   ADMIN_PASSWORD=NewPassword123!
   ```
2. Run: `npm run seed`

### Add a New Project Category
1. Add option to `admin.html` form:
   ```html
   <option value="new-category">New Category</option>
   ```
2. Update gallery filters in `js/projects.js` (if needed)

### Change Colors/Theme
1. Edit CSS variables in `styles.css`:
   ```css
   :root {
     --color-primary: #your-color;
     --color-accent: #your-color;
   }
   ```

### Add New Language
1. Create `locales/XX.json` (e.g., `locales/es.json`)
2. Add language button in navbar
3. Add to i18n.js supported languages

---

## 🐛 Troubleshooting

### "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### "Cannot find module 'better-sqlite3'"
```bash
npm install
```

### "Admin login not working"
1. Run `npm run seed` to ensure admin exists
2. Check `.env` for correct credentials
3. Clear browser cache/localStorage
4. Check browser console for errors

### "Projects not showing"
1. Run `npm run seed` to populate sample data
2. Check `/api/projects` in browser
3. Verify database exists: `data/arch-africa.db`

### "Can't upload project image"
1. Check `uploads/` folder exists (created automatically)
2. Check file size < 2MB
3. Check browser console for errors
4. Verify user is logged in as admin

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│       USER BROWSER (Frontend)       │
│  HTML/CSS/JS + LocalStorage         │
└────────────┬────────────────────────┘
             │ HTTPS/HTTP
             ↓ 
┌──────────────────────────────────────┐
│      EXPRESS SERVER (Backend)        │
│  Node.js + Express.js                │
│  - Routes (/api/auth, /api/projects) │
│  - Middleware (JWT auth, admin check)│
│  - Static files (HTML, CSS, JS)      │
└────────────┬─────────────────────────┘
             │ SQL Queries
             ↓
┌──────────────────────────────────────┐
│    SQLite DATABASE (Local File)      │
│  data/arch-africa.db                 │
│  - users                             │
│  - projects                          │
│  - orders                            │
│  - password_resets                   │
└──────────────────────────────────────┘

External Services:
- Stripe (Payments)
- Tawk.to (Live Chat)
```

---

## 🧠 Data Flow Examples

### User Registration
```
User Form (index.html)
    ↓
API.auth.register() [js/api.js]
    ↓
POST /api/auth/register [server/routes/auth.js]
    ↓
Hash password with bcryptjs
    ↓
INSERT user into database [server/db.js]
    ↓
Generate JWT token
    ↓
Return {token, user} to frontend
    ↓
Store in localStorage
    ↓
Redirect to homepage (logged in)
```

### Admin Creates Project
```
Admin Form (admin.html)
    ↓
API.projects.create() [js/api.js]
    ↓
POST /api/projects [server/routes/projects.js]
    ↓
Verify admin (adminRequired middleware)
    ↓
Save image file to uploads/
    ↓
INSERT project into database
    ↓
Return project data
    ↓
Update admin dashboard display
```

### User Buys Project
```
Gallery (gallery.html)
    ↓
Add to cart [js/cart.js]
    ↓
Click "Checkout"
    ↓
API.payments.checkout() [js/api.js]
    ↓
POST /api/payments/create-checkout-session
    ↓
Create Stripe session
    ↓
Redirect to Stripe payment page
    ↓
User pays with card
    ↓
Stripe webhook → /api/payments/webhook
    ↓
Update order status to "completed"
    ↓
Redirect to checkout-success.html
```

---

## 📋 Checklist Before Deployment

- [ ] Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
- [ ] Set `JWT_SECRET` to a strong random value
- [ ] Update `SITE_URL` to production domain
- [ ] Get real Stripe keys (not test keys)
- [ ] Set `NODE_ENV=production`
- [ ] Configure email sending for password resets
- [ ] Set up HTTPS
- [ ] Add rate limiting to auth endpoints
- [ ] Backup database regularly
- [ ] Monitor error logs
- [ ] Test all flows (register, login, purchase, admin)

---

## 📚 File Relationship Map

```
Frontend starts with:
  ├─ index.html
  │   ├─ styles.css
  │   ├─ script.js
  │   ├─ js/api.js
  │   ├─ js/auth-ui.js
  │   ├─ js/projects.js
  │   ├─ js/cart.js
  │   ├─ js/i18n.js
  │   ├─ js/theme.js
  │   └─ locales/{en,fr,rw}.json
  │
  ├─ admin.html
  │   ├─ styles.css
  │   ├─ js/api.js
  │   └─ js/admin.js
  │
  └─ gallery.html
      ├─ styles.css
      ├─ js/api.js
      ├─ js/projects.js
      └─ js/gallery-page.js

Backend starts with:
  ├─ server/index.js
  │   ├─ server/db.js
  │   ├─ server/routes/auth.js
  │   │   └─ server/middleware/auth.js
  │   ├─ server/routes/projects.js
  │   │   └─ server/middleware/auth.js
  │   └─ server/routes/payments.js
  └─ .env (config)
```

---

## 🎯 Now You're Ready!

You have complete understanding of:
- ✅ How every file works
- ✅ How frontend and backend communicate
- ✅ How data is stored and retrieved
- ✅ How authentication and security work
- ✅ How to make changes confidently

**Next steps:**
1. Run `npm run seed`
2. Run `npm run dev`
3. Visit `http://localhost:3000`
4. Log in as admin
5. Create/edit/delete a project
6. Explore the codebase with confidence!

Good luck! 🚀
