# Product Manager — Full-Stack CRUD App

A production-style product catalog with Postgres, Redis caching, Google OAuth,
SMTP OTP flows, and role-based access (User / Admin / Super Admin). Fully
containerized with Docker Compose.

## Stack

- **Backend**: FastAPI (Python), SQLAlchemy ORM, PostgreSQL, Redis, JWT auth,
  Google OAuth2 (authorization-code flow), SMTP email. Clean layered
  architecture: **Controller → Service → Repository**, with **DTOs**
  (Pydantic) separate from SQLAlchemy **Models**.
- **Frontend**: Next.js 15 (App Router, TypeScript), Tailwind CSS, axios.
- **Infra**: Docker Compose — postgres, redis, backend, frontend containers.

## Quick start

```bash
# 1. Unzip and enter the project
cd product-crud-app

# 2. (Optional) edit backend/.env to add Google OAuth + SMTP credentials.
#    The app runs fine without them -- Google buttons will show a clear
#    error if clicked, and OTP emails print to the backend container logs
#    instead of sending, so you can copy the code from `docker compose logs backend`.

# 3. Start everything
docker compose up --build

# Frontend:  http://localhost:3000
# Backend:   http://localhost:3001
# API docs:  http://localhost:3001/docs
```

That's it — Postgres and Redis start automatically, tables are created on
backend startup, and the frontend is built and served on port 3000.

## Demo accounts (seeded automatically)

Three accounts are created the first time the backend starts (idempotent —
safe on every restart, won't overwrite passwords you change later). Just go
to **http://localhost:3000/login** and fill the form directly:

| Email | Password | Role |
|---|---|---|
| `omshrestha40@gmail.com` | `Password123!` | Super Admin |
| `luciferdrose124@gmail.com` | `Password123!` | Admin |
| `omkishor.28471@student.trinity.edu.np` | `Password123!` | User |

- **Super Admin** → can invite new Admins from `/app/admin/invitations`.
- **Admin** → can manage categories from `/app/categories`.
- **User** → can create/edit/delete their own products only.

## Ports

| Service | Host port | Notes |
|---|---|---|
| Frontend | `3000` | http://localhost:3000 |
| Backend | `3001` | http://localhost:3001/docs |
| Postgres | `5438` | moved off the default `5432` to avoid clashing with a local Postgres install |
| Redis | `6379` | default |

## Roles & permissions

| Action                     | User | Admin | Super Admin |
|----------------------------|:----:|:-----:|:------------:|
| Create / edit / delete products | ✅ | ✅ | ✅ |
| Create / edit / delete categories | ❌ | ✅ | ✅ |
| Invite new admins (email + OTP) | ❌ | ❌ | ✅ |

- Anyone who registers gets the `user` role by default.
- To make yourself a **Super Admin**, add your email to `SUPER_ADMIN_EMAILS`
  in `backend/.env` (comma-separated) *before* registering/logging in — it's
  auto-applied on your next login.
- A Super Admin can then invite other people as **Admin** from
  `/app/admin/invitations`. The invitee gets an email with a link + a 6-digit
  OTP; both are required, and the account is created using exactly the
  invited email address.

## Google Sign-In setup (optional)

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth 2.0 Client ID** (type: Web application).
3. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
4. Copy the Client ID / Secret into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. Restart: `docker compose up -d --build backend`

Google account **linking** (from the Profile page) only succeeds if the
Google account's email exactly matches the signed-in user's account email —
this prevents anyone from attaching an unrelated Google identity.

## SMTP setup (optional, for OTP / forgot-password / invite emails)

Any standard SMTP provider works. For Gmail:

1. Enable 2FA on your Google account.
2. Create an [App Password](https://myaccount.google.com/apppasswords).
3. Fill in `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=you@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   SMTP_FROM_EMAIL=you@gmail.com
   ```

Without SMTP configured, OTP codes are printed to the backend logs instead of
emailed (`docker compose logs -f backend`), so local development still works.

## Project structure

```
product-crud-app/
├── docker-compose.yml
├── backend/
│   ├── app/
│   │   ├── core/          # config, db session, redis, security, email, google oauth, deps
│   │   ├── models/        # SQLAlchemy models (Product, Category, User, OTP, Invitation)
│   │   ├── dtos/          # Pydantic request/response schemas
│   │   ├── repositories/  # DB access layer
│   │   ├── services/      # Business logic + caching
│   │   ├── controllers/   # FastAPI routers
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   │   ├── page.tsx           # public landing page
    │   │   ├── login/ register/ forgot-password/ reset-password/
    │   │   ├── accept-invite/     # admin invite acceptance
    │   │   ├── auth/callback/     # Google OAuth redirect handler
    │   │   └── app/                # authenticated shell (sidebar + header)
    │   │       ├── page.tsx              # product table
    │   │       ├── products/new, products/[id]/edit
    │   │       ├── categories/           # admin-only
    │   │       ├── admin/invitations/    # super-admin-only
    │   │       └── profile/              # Google link/unlink
    │   ├── components/
    │   ├── lib/            # API clients, AuthContext
    │   └── types/
    ├── package.json
    └── Dockerfile
```

## API overview

All endpoints are prefixed with `/api`. Full interactive docs at `/docs`.

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /auth/google/login`, `GET /auth/google/callback` (sign-in)
- `GET /auth/google/link`, `POST /auth/google/unlink` (account linking)
- `POST /auth/forgot-password`, `POST /auth/reset-password` (OTP via SMTP)
- `GET/POST /admin/invitations`, `POST /admin/invitations/accept`, `DELETE /admin/invitations/{id}`
- `GET/POST/PUT/DELETE /products` (search, category filter, pagination)
- `GET/POST/PUT/DELETE /categories` (admin+ only for mutations)
- `POST /upload` (image upload, local disk storage, served at `/uploads/...`)

## Running without Docker (local dev)

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# point POSTGRES_HOST/REDIS_HOST at localhost in .env, then:
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
