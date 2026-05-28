# ARCH-AFRICA BUREAU — Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Backend Architecture](#backend-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Security](#authentication--security)
8. [File-by-File Breakdown](#file-by-file-breakdown)
9. [How to Make Changes](#how-to-make-changes)
10. [Common Tasks](#common-tasks)

---

## 🎯 Project Overview

**ARCH-AFRICA BUREAU LTD** is a full-stack web application for architectural design services. It's a modern, multi-language website (English, French, Rwandan) that allows:

- **Users:** Browse architectural projects, purchase design packages, manage accounts
- **Admins:** Manage projects via CMS, handle orders, view analytics
- **Visitors:** View gallery, estimate costs, contact support

### Key Features
✅ User authentication (register, login, password reset)
✅ Admin CMS for project management
✅ Payment integration (Stripe)
✅ Multi-language support (EN, FR, RW)
✅ Dark/Light theme toggle
✅ Responsive design (mobile, tablet, desktop)
✅ Real-time chat support (Tawk.to integration)
✅ Project gallery with filtering

---

## 🛠 Technology Stack

### Backend
- **Node.js** — JavaScript runtime
- **Express.js** — Web framework & routing
- **SQLite3 (better-sqlite3)** — Database (local file-based)
- **JWT (jsonwebtoken)** — Authentication tokens
- **bcryptjs** — Password hashing
- **Multer** — File upload handling
- **Stripe** — Payment processing

### Frontend
- **HTML5** — Structure
- **CSS3** — Styling (custom framework, no Tailwind)
- **Vanilla JavaScript** — No frameworks (lightweight)
- **Fetch API** — HTTP requests to backend
- **LocalStorage** — Client-side auth token storage

### Environment & Configuration
- **dotenv** — Environment variables (.env file)
- **Express static** — Serve HTML, CSS, JS, images

---

## 📁 Project Structure

```
Arch-Africa-Websitee/
├── server/                      # Backend code
│   ├── index.js                # Express server setup
│   ├── db.js                   # SQLite database initialization
│   ├── seed.js                 # Database seeding (initial data)
│   ├── middleware/
│   │   └── auth.js             # JWT authentication middleware
│   └── routes/
│       ├── auth.js             # Authentication endpoints
│       ├── projects.js         # Project CRUD endpoints
│       └── payments.js         # Stripe payment endpoints
├── js/                         # Frontend JavaScript
│   ├── api.js                  # API client (fetch wrapper)
│   ├── admin.js                # Admin CMS logic
│   ├── auth-ui.js              # Login/Register modals
│   ├── projects.js             # Project display & filtering
│   ├── gallery-page.js         # Gallery page logic
│   ├── cart.js                 # Shopping cart management
│   ├── chat.js                 # Tawk.to chat integration
│   ├── theme.js                # Dark/Light theme toggle
│   └── i18n.js                 # Internationalization (translations)
├── locales/                    # Translation files
│   ├── en.json                 # English strings
│   ├── fr.json                 # French strings
│   └── rw.json                 # Rwandan (Kinyarwanda) strings
├── data/                       # Database storage
│   └── arch-africa.db          # SQLite database file
├── assets/                     # Static assets
│   ├── arch-africa-logo.jpeg   # Company logo
│   └── A_guide_for_shopping_at_ARCH-AFRICA_BUREAU_WEBSITE1.pdf
├── uploads/                    # User-uploaded files (project images)
├── index.html                  # Home page
├── gallery.html                # Project gallery
├── admin.html                  # Admin dashboard
├── checkout-success.html       # Payment success page
├── reset-password.html         # Password reset page
├── styles.css                  # Global styles
├── script.js                   # Global page logic
├── package.json                # Dependencies & scripts
├── .env                        # Environment variables (local config)
├── .env.example                # Example env file
└── README.md                   # Project description
```

---

## 🗄️ Database Schema

### Table: `users`
Stores user accounts (both regular users and admins).

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,        -- bcrypt hashed
  role TEXT DEFAULT 'user',           -- 'user' or 'admin'
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Example:** Admin account created during `npm run seed`
- Email: `admin@archafricabureau.com`
- Password: `ChangeMeAdmin123!` (hashed in DB)

### Table: `projects`
Stores architectural design projects/templates for sale.

```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,          -- URL-friendly name (e.g., "4-bedroom-villa")
  category TEXT NOT NULL,             -- house, villa, hotel, commercial, etc.
  title_en TEXT NOT NULL,             -- English title
  title_fr TEXT,                      -- French title
  title_rw TEXT,                      -- Rwandan title
  description_en TEXT NOT NULL,       -- English description
  description_fr TEXT,                -- French description
  description_rw TEXT,                -- Rwandan description
  image_url TEXT NOT NULL,            -- Project image URL
  price_cents INTEGER DEFAULT 0,      -- Price in cents ($100 = 10000)
  currency TEXT DEFAULT 'usd',        -- Currency code
  featured INTEGER DEFAULT 0,         -- 1 = show on homepage
  published INTEGER DEFAULT 1,        -- 1 = visible to users
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `orders`
Stores purchase records from Stripe payments.

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,                    -- References users.id
  stripe_session_id TEXT,             -- Stripe checkout session ID
  amount_cents INTEGER NOT NULL,      -- Total amount paid (cents)
  currency TEXT NOT NULL,             -- Currency code
  status TEXT DEFAULT 'pending',      -- pending, completed, failed
  items_json TEXT NOT NULL,           -- JSON: [{id, name, price}, ...]
  customer_email TEXT,                -- Customer email (for non-users)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### Table: `password_resets`
Stores password reset tokens for security.

```sql
CREATE TABLE password_resets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,           -- References users.id
  token TEXT NOT NULL UNIQUE,         -- Random 64-char hex token
  expires_at TEXT NOT NULL,           -- Expiration time (1 hour)
  used INTEGER DEFAULT 0,             -- 1 = token has been used
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔧 Backend Architecture

### Server Entry Point: `server/index.js`

**What it does:**
1. Loads environment variables from `.env`
2. Creates Express app
3. Sets up middleware (JSON parsing, cookies, static files)
4. Mounts API routes
5. Handles static file serving (HTML, CSS, JS, images)
6. Serves fallback HTML for client-side routing

**Key middleware:**
- `cookieParser()` — Parse cookies
- `express.json()` — Parse JSON request bodies
- `express.static()` — Serve files from root directory

**API Routes mounted:**
- `/api/auth/*` → Authentication (login, register, etc.)
- `/api/projects/*` → Project CRUD operations
- `/api/payments/*` → Stripe payment handling

### Database: `server/db.js`

**What it does:**
1. Creates SQLite database at `data/arch-africa.db`
2. Enables WAL mode (Write-Ahead Logging) for concurrency
3. Enables foreign key constraints
4. Creates all tables if they don't exist

**Tables created:**
- `users` — User accounts
- `projects` — Architectural designs
- `orders` — Purchase records
- `password_resets` — Password reset tokens

---

## 🔐 Authentication & Security

### How Authentication Works

**1. Register (POST /api/auth/register)**
```
Frontend: User enters name, email, password
→ API.auth.register({name, email, password})
→ Backend: Hash password with bcryptjs (cost: 12)
→ Insert user with role='user'
→ Generate JWT token (7-day expiration)
→ Return token + user data
→ Frontend: Store in localStorage
```

**2. Login (POST /api/auth/login)**
```
Frontend: User enters email, password
→ API.auth.login({email, password})
→ Backend: Find user by email
→ Compare password with bcrypt
→ If match: Generate JWT token
→ Return token + user data
```

**3. JWT Token Format**
```javascript
{
  id: 1,
  email: "user@example.com",
  name: "John Doe",
  role: "user" or "admin",
  iat: 1234567890,        // issued at
  exp: 1234567890         // expires (7 days)
}
```

### How Admin Protection Works

**Middleware Chain:**
```javascript
authRequired(req, res, next) 
  ↓
  1. Check Authorization header or cookies for JWT token
  2. Verify token signature with JWT_SECRET
  3. Attach user data to req.user
  4. Call next() if valid, return 401 if not

adminRequired(req, res, next)
  ↓
  1. Call authRequired() first
  2. Check if req.user.role === 'admin'
  3. Return 403 if not admin
```

**Usage in routes:**
```javascript
router.get('/admin/all', adminRequired, (req, res) => {
  // Only admins can access this
});
```

### Password Reset Flow

**1. Request Reset (POST /api/auth/forgot-password)**
```
User enters email
→ Check if user exists
→ Generate random 32-byte hex token
→ Set expiration to 1 hour from now
→ Store in password_resets table
→ In development: Return reset URL
→ In production: Send email (TODO: implement)
```

**2. Reset Password (POST /api/auth/reset-password)**
```
User clicks reset link + enters new password
→ Verify token exists, not used, and not expired
→ Hash new password with bcryptjs
→ Update user's password_hash
→ Mark token as used (used=1)
→ Return success message
```

### Security Best Practices
- ✅ Passwords hashed with bcryptjs (cost 12)
- ✅ JWT tokens expire after 7 days
- ✅ Password reset tokens expire after 1 hour
- ✅ One-time use password reset tokens
- ✅ Admin routes require admin role
- ⚠️ TODO: Email password reset links (currently dev-only)
- ⚠️ TODO: Rate limiting on auth endpoints
- ⚠️ TODO: HTTPS only in production

---

## 💻 Frontend Architecture

### Global API Client: `js/api.js`

**What it does:** Provides centralized HTTP client for all API calls.

```javascript
API.request(path, options)     // Base fetch wrapper
  ├── Sets headers (Content-Type, Authorization)
  ├── Attaches JWT token from localStorage
  ├── Makes fetch request
  ├── Throws error if not 2xx status
  └── Returns response JSON

API.auth.register()            // User registration
API.auth.login()               // User login
API.auth.me()                  // Get current user
API.auth.forgot()              // Request password reset
API.auth.reset()               // Reset password
API.projects.list()            // Get public projects
API.projects.adminList()       // Get all projects (admin only)
API.projects.create()          // Create project (admin only)
API.projects.update()          // Update project (admin only)
API.projects.remove()          // Delete project (admin only)
API.payments.config()          // Get Stripe key
API.payments.checkout()        // Create checkout session
API.config()                   // Get app config
```

### Authentication UI: `js/auth-ui.js`

**What it does:** Handles login/register modals and user state.

- Login modal: Email + password form
- Register modal: Name + email + password form
- Shows authenticated vs. non-authenticated UI
- Handles logout

### Project Display: `js/projects.js`

**What it does:** Display projects on homepage with filtering.

- Load projects from API
- Filter by category (house, villa, hotel, etc.)
- Display as grid cards
- Add projects to cart
- Handle "View Details" clicks

### Admin CMS: `js/admin.js`

**What it does:** Manage projects via admin dashboard.

**Features:**
- List all projects
- Create new project (title, description, category, image, price)
- Edit existing project
- Delete project
- Publish/unpublish projects
- Upload project images

**Form Fields:**
- Slug: URL-friendly identifier
- Category: house, villa, hotel, commercial, industrial, institutional, greenhouse
- Title: English, French, Rwandan
- Description: English, French, Rwandan
- Image: Upload or URL
- Price: In USD cents
- Featured: Show on homepage
- Published: Visible to users

### Shopping Cart: `js/cart.js`

**What it does:** Manage user's cart (projects to purchase).

- Store selected projects in localStorage
- Calculate total price
- Show cart badge count
- Handle checkout (redirect to Stripe)
- Clear cart after purchase

### Internationalization (i18n): `js/i18n.js`

**What it does:** Handle multi-language support.

**How it works:**
1. Load translation JSON from `locales/{lang}.json`
2. Replace all `data-i18n="key.subkey"` with translated text
3. Switch language on demand (EN, FR, RW buttons)

**Translation keys structure:**
```json
{
  "nav": {
    "home": "Home",
    "gallery": "Gallery",
    "login": "Login",
    "getStarted": "Get Started"
  },
  "projects": {
    "label": "Our Work",
    "house": "Residential"
  }
}
```

### Theme Toggle: `js/theme.js`

**What it does:** Handle dark/light mode.

- Toggle between light and dark CSS classes
- Save preference in localStorage
- Apply CSS variable overrides

### Chat Integration: `js/chat.js`

**What it does:** Integrate Tawk.to live chat widget.

- Load Tawk.to script
- Use property ID and widget ID from environment

---

## 📄 File-by-File Breakdown

### HTML Files

#### `index.html` (Home Page)
**Purpose:** Main landing page with hero, projects showcase, services, FAQ, contact form.

**Sections:**
- Navbar with logo, menu, language switcher, theme toggle
- Loader animation
- Hero banner
- Featured projects grid
- Services section
- FAQ accordion
- Contact form
- Footer

**Key Elements:**
- `data-i18n="key"` attributes for translations
- Modal structure for auth (login/register)
- Mobile menu toggle

#### `gallery.html` (Project Gallery)
**Purpose:** Full catalog of all architectural projects with filtering.

**Features:**
- Category filters (house, villa, hotel, etc.)
- Grid layout with project cards
- Click to view details or add to cart
- Cart integration

#### `admin.html` (Admin CMS)
**Purpose:** Content management system for admins only.

**Sections:**
- Login gate (email/password required)
- Project list (after login)
- Add/Edit project form
- Delete project buttons
- Publish/unpublish toggle

#### `checkout-success.html`
**Purpose:** Thank you page after successful payment.

**Shows:**
- Success checkmark
- Thank you message
- Link back to gallery

#### `reset-password.html`
**Purpose:** Password reset form (accessed via email link).

**Features:**
- New password input
- Confirm password input
- Validation: passwords must match
- Redirect to login after success

### CSS

#### `styles.css` (Main Stylesheet)
**Purpose:** All styling for the website.

**Key Classes:**
- `.navbar` — Navigation bar styling
- `.btn-*` — Button styles (btn-primary, btn-login, btn-cta)
- `.modal-*` — Modal dialog styles
- `.card` — Project card styles
- `.container` — Fixed-width container
- `.section` — Section padding/spacing
- `[data-theme="dark"]` — Dark mode overrides

**Responsive Design:**
- Mobile first approach
- Breakpoints: 768px, 1024px, 1280px
- Flexbox and CSS Grid used extensively

### JavaScript (Global)

#### `script.js` (Global Page Logic)
**Purpose:** General page functionality loaded on all pages.

**Includes:**
- DOM element selection helpers
- Modal open/close functions
- Navigation menu toggle
- Theme loading from localStorage
- Language loading from localStorage
- User auth state check
- Admin nav link visibility
- Loading animation removal

#### `styles.css` (above)

---

## 🛣️ API Endpoints Reference

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
**Register new user**
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST `/api/auth/login`
**Login existing user**
```json
Request:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### GET `/api/auth/me`
**Get current user (requires auth)**
```
Header: Authorization: Bearer {token}

Response:
{
  "user": { id, name, email, role }
}
```

#### POST `/api/auth/forgot-password`
**Request password reset**
```json
Request:
{
  "email": "john@example.com"
}

Response (Dev):
{
  "resetUrl": "http://localhost:3000/reset-password.html?token=abc123..."
}
```

#### POST `/api/auth/reset-password`
**Reset password with token**
```json
Request:
{
  "token": "abc123...",
  "password": "NewPassword456"
}

Response:
{
  "message": "Password updated successfully"
}
```

### Projects Routes (`/api/projects`)

#### GET `/api/projects`
**Get public projects with filtering**
```
Query params:
  ?category=villa           // Filter by category
  ?featured=1               // Show only featured

Response:
[
  {
    "id": 1,
    "slug": "4-bedroom-contemporary",
    "category": "house",
    "title": "4-Bedroom Contemporary Residence",
    "description": "...",
    "image_url": "...",
    "price_cents": 29900,
    "currency": "usd",
    "featured": 1
  },
  ...
]
```

#### GET `/api/projects/admin/all`
**Get all projects (admin only)**
```
Header: Authorization: Bearer {admin-token}

Response: Same as above, but includes unpublished projects
```

#### POST `/api/projects`
**Create new project (admin only)**
```
Header: Authorization: Bearer {admin-token}
Body: FormData with file upload

Fields:
- slug
- category
- title_en, title_fr, title_rw
- description_en, description_fr, description_rw
- image (file upload)
- price_cents
- featured

Response (201):
{
  "id": 2,
  "slug": "new-villa",
  ...
}
```

#### PUT `/api/projects/{id}`
**Update project (admin only)**
```
Same as POST /api/projects
```

#### DELETE `/api/projects/{id}`
**Delete project (admin only)**
```
Response:
{
  "message": "Project deleted"
}
```

### Payments Routes (`/api/payments`)

#### GET `/api/payments/config`
**Get Stripe public key**
```
Response:
{
  "publishableKey": "pk_test_..."
}
```

#### POST `/api/payments/create-checkout-session`
**Create Stripe checkout session**
```json
Request:
{
  "projectIds": [1, 2, 3]
}

Response:
{
  "sessionId": "cs_test_..."
}
```

#### POST `/api/payments/webhook`
**Stripe webhook (for payment events)**
```
Stripe sends POST when payment completes
Backend updates order status to "completed"
```

---

## 🔄 How Data Flows

### User Registration Flow
```
1. User fills register form (index.html)
2. Clicks "Get Started" button
3. JavaScript calls API.auth.register()
4. Sends POST to /api/auth/register
5. Backend hashes password, inserts user
6. Generates JWT token
7. Returns token + user data
8. Frontend stores in localStorage
9. Redirects to homepage (logged in)
```

### Project Purchase Flow
```
1. User adds projects to cart (js/cart.js)
2. Cart stored in localStorage
3. User clicks "Checkout"
4. JavaScript creates Stripe session
5. POST to /api/payments/create-checkout-session
6. Backend creates Stripe checkout
7. Redirects to Stripe payment page
8. User enters card details
9. Stripe confirms payment
10. Webhook sent to /api/payments/webhook
11. Backend marks order as completed
12. Redirect to checkout-success.html
```

### Admin Project Creation Flow
```
1. Admin logs in at /admin.html
2. JavaScript calls API.auth.login()
3. Gets admin token
4. Shows admin dashboard
5. Admin fills project form
6. Clicks "Add Project"
7. JavaScript calls API.projects.create()
8. Sends FormData with image file
9. Backend saves image, creates database record
10. Project appears in gallery
```

---

## ⚙️ How to Make Changes

### Adding a New Field to Projects

**Example: Add "square_feet" field to projects**

**Step 1: Update Database Schema**
```javascript
// server/db.js — Add column after price_cents:
ALTER TABLE projects ADD COLUMN square_feet INTEGER;
```

**Step 2: Update Admin Form**
```html
<!-- admin.html — Add input field -->
<div class="f-field">
  <label>Square Feet</label>
  <input type="number" id="fSquareFeet" />
</div>
```

**Step 3: Update Admin JavaScript**
```javascript
// js/admin.js — In the form submit handler:
const formData = new FormData(form);
formData.append('square_feet', document.getElementById('fSquareFeet').value);
```

**Step 4: Update Backend Route**
```javascript
// server/routes/projects.js — In POST route:
const { square_feet } = req.body;
// Include in INSERT statement
```

**Step 5: Display in Gallery**
```html
<!-- gallery.html or js/projects.js — Show field in cards -->
<p>${project.square_feet} sq ft</p>
```

### Adding a New Language

**Example: Add Spanish translation**

**Step 1: Create Translation File**
```json
// locales/es.json
{
  "nav": {
    "home": "Inicio",
    "gallery": "Galería",
    ...
  },
  ...
}
```

**Step 2: Add Language Button**
```html
<!-- index.html navbar -->
<button class="lang-btn" data-lang="es">ES</button>
```

**Step 3: Update i18n.js**
```javascript
// Add 'es' to supported languages list
```

### Changing Colors/Branding

**Update CSS variables in styles.css:**
```css
:root {
  --color-primary: #1a73e8;      /* Brand color */
  --color-accent: #ff6b35;        /* Secondary color */
  --color-text: #202124;          /* Text color */
  --color-bg: #ffffff;            /* Background */
}

[data-theme="dark"] {
  --color-primary: #8ab4f8;
  --color-accent: #ff8a65;
  --color-text: #e8eaed;
  --color-bg: #202124;
}
```

### Adding a New Admin Feature

**Example: Add "Featured" toggle in admin**

**Step 1:** Already exists! In admin form, there's a featured checkbox
**Step 2:** To use it, the admin can toggle and submit

### Integrating Email Notifications

**Current state:** Registration welcome emails and password reset emails are now sent when SMTP is configured.

**Configuration:**
- `EMAIL_USER` — your SMTP account email
- `EMAIL_PASSWORD` — your SMTP password or app password
- `EMAIL_SERVICE` — optional named provider like `gmail`, `outlook`, or `hotmail`
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` — optional manual SMTP settings
- `EMAIL_FROM` — sender display name (e.g. `Arch Africa Bureau <no-reply@archafricabureau.com>`)

**Example `.env` values:**
```dotenv
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM="Arch Africa Bureau <no-reply@archafricabureau.com>"
# or for manual SMTP:
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
```

**Server behavior:**
- `POST /api/auth/register` sends a welcome email after account creation
- `POST /api/auth/forgot-password` sends a password reset link if the user exists
- In development with no SMTP configured, reset endpoint returns the reset URL for local testing

---

## 📋 Common Tasks & Solutions

### Task: Change Admin Credentials

**Edit `.env`:**
```
ADMIN_EMAIL=yournewemail@example.com
ADMIN_PASSWORD=YourNewPassword123!
```

**Run seed (creates admin if doesn't exist):**
```bash
npm run seed
```

### Task: Add a New Project Category

**Example: Add "Infrastructure" category**

**Step 1: Update project form dropdown in admin.html**
```html
<option value="infrastructure">Infrastructure</option>
```

**Step 2:** That's it! The category is just a text field. Users can filter by it.

### Task: Change Stripe Keys

**Edit `.env`:**
```
STRIPE_SECRET_KEY=sk_live_your_real_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Restart server:**
```bash
npm run dev
```

### Task: Add a Contact Form Submission Handler

**Currently:** Contact form exists but doesn't submit to backend

**To implement:**
```javascript
// js/contact.js (new file)
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('name').value,
    email: document.getElementById('email').value,
    message: document.getElementById('message').value
  };
  // Send to backend endpoint (needs to be created)
  console.log('Form data:', data);
});
```

### Task: Export Projects to CSV

```javascript
// Add this to admin.js
function exportProjectsToCSV() {
  const projects = await API.projects.adminList();
  const csv = [
    ['ID', 'Title', 'Category', 'Price'],
    ...projects.map(p => [p.id, p.title_en, p.category, p.price_cents])
  ];
  const csvString = csv.map(row => row.join(',')).join('\n');
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'projects.csv';
  a.click();
}
```

---

## 🐛 Debugging Tips

### Check Browser Console
```javascript
// View stored token
console.log(localStorage.getItem('aa_token'));

// View stored user
console.log(localStorage.getItem('aa_user'));

// Make API call directly
API.projects.list().then(console.log);
```

### Check Server Logs
```bash
npm run dev
# Look for errors in terminal output
```

### Check Database
```bash
# Install sqlite3 CLI tool
sqlite3 data/arch-africa.db

# View users
SELECT * FROM users;

# View projects
SELECT id, slug, title_en, price_cents FROM projects;

# View orders
SELECT * FROM orders;
```

### Network Inspector
1. Open Developer Tools → Network tab
2. Perform action (login, create project, etc.)
3. Look at request/response in network tab
4. Check for 4xx/5xx status codes

---

## 📚 Further Learning

### Express.js Concepts
- `app.get()`, `app.post()`, `app.put()`, `app.delete()` — Route handlers
- `app.use()` — Middleware
- `req.body`, `req.params`, `req.query` — Request data
- `res.json()`, `res.status()` — Responses

### SQLite/SQL Basics
- `SELECT * FROM table` — Query data
- `INSERT INTO table VALUES (...)` — Add data
- `UPDATE table SET col = val WHERE id = ?` — Modify data
- `DELETE FROM table WHERE id = ?` — Remove data
- `JOIN` — Combine tables
- `WHERE`, `ORDER BY`, `LIMIT` — Filters

### JavaScript Fetch API
```javascript
fetch(url, {
  method: 'GET|POST|PUT|DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
```

### JWT Tokens
- Created on server: `jwt.sign({data}, secret, {expiresIn: '7d'})`
- Sent from frontend: `Authorization: Bearer {token}`
- Verified on server: `jwt.verify(token, secret)`
- If invalid/expired: 401 Unauthorized

---

## ✅ Confidence Checklist

Before making changes, ask yourself:

- ✅ Do I understand what this file does?
- ✅ Do I know which other files it interacts with?
- ✅ Do I understand the data flow (request → processing → response)?
- ✅ Do I know how to test my changes (browser, admin dashboard, etc.)?
- ✅ Do I know where errors would appear (console, network tab, server logs)?
- ✅ Have I updated all affected files (frontend + backend)?
- ✅ Have I tested the happy path and edge cases?

---

## 🎓 Quick Reference

| Task | Where to look |
|------|---------------|
| Add new field to projects | `server/db.js`, `admin.html`, `js/admin.js`, `server/routes/projects.js` |
| Change UI text | `index.html`, `styles.css`, `js/api.js` |
| Add new translation | `locales/{lang}.json`, `js/i18n.js` |
| Change colors | `styles.css` (CSS variables) |
| Add API endpoint | `server/routes/*.js` |
| Manage users | `server/db.js` (users table), `server/routes/auth.js` |
| Handle payments | `server/routes/payments.js`, `js/cart.js` |
| Admin-only features | Add `adminRequired` middleware to route |
| User authentication required | Add `authRequired` middleware to route |

---

## 📞 Support & Next Steps

- **Run dev server:** `npm run dev`
- **Seed database:** `npm run seed`
- **View logs:** Check terminal output
- **Test API:** Use browser console or Postman
- **Check database:** Use `sqlite3 data/arch-africa.db`

You now have complete understanding of the project! You can confidently make changes, add features, or fix bugs. Good luck! 🚀
