# ARCH-AFRICA BUREAU — Full-stack website

Architectural design platform with **gallery**, **CMS admin**, **JWT auth**, **Stripe payments**, **i18n** (EN/FR/RW), **dark/light theme**, and **Tawk.to live chat**.

## Quick start

```bash
npm install
cp .env.example .env   # edit secrets
npm run seed           # admin user + sample projects
npm start
```

Open:

- **Site:** http://localhost:3000  
- **Gallery:** http://localhost:3000/gallery.html  
- **Admin CMS:** http://localhost:3000/admin.html  

Default admin (after seed): `admin@archafricabureau.com` / value of `ADMIN_PASSWORD` in `.env`

## Features

| Feature | How it works |
|--------|----------------|
| **Project gallery** | `gallery.html` loads projects from `GET /api/projects` |
| **CMS** | `admin.html` — upload image, titles/descriptions in 3 languages, price, publish |
| **Auth** | `POST /api/auth/register`, `/login` — bcrypt + JWT in `localStorage` |
| **Payments** | Stripe Checkout — set `STRIPE_SECRET_KEY`, login, click **Buy now** |
| **i18n** | `/locales/{en,fr,rw}.json` — language buttons in top bar |
| **Theme** | Sun/moon toggle — `data-theme` on `<html>` |
| **Live chat** | [Tawk.to](https://www.tawk.to/) — set `TAWK_PROPERTY_ID` in `.env` |

## Stripe setup

1. Create account at https://stripe.com  
2. Copy **test** secret key → `STRIPE_SECRET_KEY`  
3. For webhooks locally: `stripe listen --forward-to localhost:3000/api/payments/webhook`  
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`  

Prices on projects are stored in **USD cents** (e.g. `29900` = $299.00).

## Production checklist

- Set strong `JWT_SECRET` and change admin password  
- Use PostgreSQL instead of SQLite for scale (optional migration)  
- Configure real SMTP for password reset emails (`EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_SERVICE` or `EMAIL_HOST`/`EMAIL_PORT`)  
- Add your Tawk.to property ID  
- Deploy behind HTTPS with `SITE_URL` set to your domain  
- Replace Unsplash seed images with real project photos via Admin  

## API overview

- `POST /api/auth/register` | `/login` | `/forgot-password` | `/reset-password`  
- `GET /api/auth/me` (Bearer token)  
- `GET /api/projects?lang=en&category=house`  
- `GET /api/projects/admin/all` (admin)  
- `POST /api/projects` (admin, multipart)  
- `PUT /api/projects/:id` (admin)  
- `DELETE /api/projects/:id` (admin)  
- `POST /api/payments/create-checkout-session` (auth, `{ projectIds: [1,2] }`)  
