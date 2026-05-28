# ARCH-AFRICA API Map

This document is a quick reference for backend endpoints, auth rules, and integration behavior.

Base URL examples:
- Local: `http://localhost:3000`
- Production: `https://arch-africa-production.up.railway.app`

All API routes are under `/api`.

---

## Authentication model

- Auth token: JWT
- Header format: `Authorization: Bearer <token>`
- Token contains: `id`, `email`, `name`, `role`
- Role values: `user`, `admin`

Protected endpoints return:
- `401` when token is missing/invalid
- `403` when user is authenticated but not admin

---

## Endpoint Summary

### Public utility

#### `GET /api/config`
Returns frontend runtime config.

Example response:
```json
{
  "tawkPropertyId": "",
  "tawkWidgetId": "default",
  "siteUrl": "http://localhost:3000",
  "googleClientId": "",
  "emailEnabled": true
}
```

---

### Auth APIs (`/api/auth`)

#### `POST /api/auth/register`
Creates a user and returns auth token.

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "StrongPass123!"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  },
  "emailSent": true
}
```

#### `POST /api/auth/login`
Logs in an existing user.

Request:
```json
{
  "email": "jane@example.com",
  "password": "StrongPass123!"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

#### `POST /api/auth/google`
Google sign-in using ID token from client.

Request:
```json
{
  "id_token": "google-id-token"
}
```

Response:
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

#### `GET /api/auth/me` (Auth required)
Returns current authenticated user.

Response:
```json
{
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user"
  }
}
```

#### `POST /api/auth/forgot-password`
Creates password reset token and sends email if SMTP is configured.

Request:
```json
{
  "email": "jane@example.com"
}
```

Response (normal):
```json
{
  "message": "If that email exists, a reset link has been sent."
}
```

Response (development fallback when email is unavailable):
```json
{
  "message": "Reset link created (dev only)",
  "resetUrl": "http://localhost:3000/reset-password.html?token=..."
}
```

#### `POST /api/auth/reset-password`
Resets password using token.

Request:
```json
{
  "token": "reset-token",
  "password": "NewStrongPass123!"
}
```

Response:
```json
{
  "message": "Password updated successfully"
}
```

---

### Project APIs (`/api/projects`)

#### `GET /api/projects`
Lists published projects only.

Query params:
- `lang`: `en` | `fr` | `rw` (default `en`)
- `category`: e.g. `house`, `villa`, `hotel`, `commercial`, `all`
- `featured`: `1` to return featured only

Example:
`GET /api/projects?lang=en&category=house&featured=1`

Response:
```json
{
  "projects": [
    {
      "id": 1,
      "slug": "modern-family-home",
      "category": "house",
      "title": "Modern Family Home",
      "description": "Permit-ready design...",
      "image_url": "/uploads/project-123.jpg",
      "price_cents": 29900,
      "currency": "usd",
      "featured": true,
      "published": true,
      "created_at": "2026-05-28 12:00:00"
    }
  ]
}
```

#### `GET /api/projects/:idOrSlug`
Returns one project by numeric ID or slug.

Example:
- `GET /api/projects/1`
- `GET /api/projects/modern-family-home`

#### `GET /api/projects/admin/all` (Admin required)
Returns all projects including unpublished.

#### `POST /api/projects` (Admin required, multipart/form-data)
Creates a project. Accepts image upload (`image`) or direct `image_url`.

Common fields:
- `category`
- `title_en`, `title_fr`, `title_rw`
- `description_en`, `description_fr`, `description_rw`
- `price_cents`, `currency`
- `featured` (`1` or `0`)
- `published` (`1` or `0`)
- `image` (file) or `image_url` (string)

Response:
```json
{
  "project": {
    "id": 10,
    "slug": "new-project",
    "category": "house"
  }
}
```

#### `PUT /api/projects/:id` (Admin required, multipart/form-data)
Updates existing project.

#### `DELETE /api/projects/:id` (Admin required)
Deletes project.

Response:
```json
{
  "ok": true
}
```

---

### Payments APIs (`/api/payments`)

#### `GET /api/payments/config`
Returns whether Stripe is configured.

Response:
```json
{
  "enabled": true
}
```

#### `POST /api/payments/create-checkout-session` (Auth required)
Creates Stripe Checkout session from selected project IDs.

Request:
```json
{
  "projectIds": [1, 2, 5]
}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

#### `POST /api/payments/webhook` (Stripe server-to-server)
Stripe webhook endpoint. Verifies signature and updates order status to paid when checkout completes.

Event handled:
- `checkout.session.completed`

---

### Inquiries APIs (`/api/inquiries`)

#### `POST /api/inquiries`
Saves contact inquiry and optionally sends email notifications.

Request:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+250700000000",
  "type": "residential",
  "message": "I need a 4-bedroom plan."
}
```

Response:
```json
{
  "ok": true,
  "message": "Inquiry received! We will get back to you within 24 hours."
}
```

#### `GET /api/inquiries`
Returns all inquiries (currently no auth guard in code).

Response:
```json
{
  "inquiries": []
}
```

---

## External integrations

### Stripe
- Required env:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `SITE_URL`
- Used by:
  - `POST /api/payments/create-checkout-session`
  - `POST /api/payments/webhook`

### SMTP / email
- Required env:
  - `EMAIL_USER`
  - `EMAIL_PASSWORD`
  - and (`EMAIL_SERVICE` or `EMAIL_HOST`)
- Optional:
  - `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_FROM`, `ADMIN_EMAIL`
- Used by:
  - welcome email on register
  - password reset emails
  - inquiry notification and auto-reply

### Google Sign-In
- Required env:
  - `GOOGLE_CLIENT_ID`
- Endpoint:
  - `POST /api/auth/google`

### Tawk chat widget
- Env:
  - `TAWK_PROPERTY_ID`
  - `TAWK_WIDGET_ID`
- Exposed via:
  - `GET /api/config`

---

## Frontend integration file

- `js/api.js` is the single API client used by frontend pages.
- It automatically:
  - injects JWT bearer token when available
  - sends JSON for normal requests
  - supports `FormData` for uploads
  - throws API errors with backend message

---

## Notes for maintainers

- Keep API responses backward compatible where possible (`token`, `user`, `projects`, `ok`).
- If adding new protected endpoints, apply `authRequired` or `adminRequired`.
- For production, set a strong `JWT_SECRET` and ensure `SITE_URL` matches deployed domain.
