# SalesFlow CRM Dashboard

A full-stack CRM for managing contacts, deals, activities, and sales performance — with role-based access, admin tooling, Google Sign-In, two-factor authentication, and English/German UI support.

![Tech](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Tech](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![Tech](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

---

## Features

### Core CRM
- **Dashboard** — KPI cards, revenue charts, deal stage distribution, recent activity, quota progress, forecast widget, and onboarding checklist
- **Contacts** — CRUD, search, filters (status, score tier, tags, territory, lead source), sorting, CSV import/export, duplicate detection & merge
- **Contact detail** — Profile, notes timeline, activity history, related deals, attachments, custom fields, tags
- **Pipeline** — Kanban board with drag-and-drop, configurable stages, lost-reason capture, territory filter
- **Activities** — Log calls, emails, meetings, and notes with filtering and search
- **Global search** — Quick search across contacts, deals, and activities
- **Leaderboard** — Monthly rep rankings by revenue and deals closed
- **Reports** — Win rate, average deal size, sales cycle length, rep/team/territory comparisons, lead source analytics

### Admin & security
- **Role-based access** — Admin vs. sales rep permissions
- **Teams & territories** — Organize reps and filter contacts/deals by territory
- **Audit log** — Track create/update/delete/merge actions across entities
- **Two-factor authentication (2FA)** — TOTP setup with recovery codes; admin can force-disable for users
- **User invites** — Admins can create new team accounts from Settings
- **Pipeline settings** — Rename, reorder, and manage Kanban stages
- **Sales quotas** — Set monthly revenue targets per rep
- **Custom fields & lead sources** — Extend contact records and manage lead source options
- **Onboarding checklist** — Guided first-run steps on the dashboard

### Auth & UX
- **Email/password login & registration**
- **Google Sign-In** — Optional OAuth via Google Cloud Client ID
- **Internationalization (i18n)** — English and German; switch language from login/register, sidebar, or Settings → Appearance
- **Dark / light theme** — Persisted theme preference
- **Responsive layout** — Desktop sidebar + mobile-friendly views

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (Docker or local install)

### 1. Start PostgreSQL

**Option A — Docker (recommended for a clean setup):**

```bash
docker compose up -d
```

Uses `postgres` / `postgres` on port **5432**. Set `DATABASE_URL` in `crm-dashboard-backend/.env` accordingly:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/salesflow_crm?schema=public"
```

**Option B — Homebrew PostgreSQL (macOS):**

```bash
brew services start postgresql@14
npm run setup:db
```

The setup script prompts for your PostgreSQL password, creates the database, updates `.env`, and seeds demo data. Homebrew Postgres typically uses your macOS username (not `postgres`).

> **Note:** The default `postgres:postgres` credentials only work with Docker.

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment

Copy the example env files and adjust as needed:

```bash
cp crm-dashboard-backend/.env.example crm-dashboard-backend/.env
cp crm-dashboard-frontend/.env.example crm-dashboard-frontend/.env
```

**Backend (`crm-dashboard-backend/.env`):**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing auth tokens |
| `PORT` | API port (default `3001`) |
| `GOOGLE_CLIENT_ID` | Optional — enables Google Sign-In |

**Frontend (`crm-dashboard-frontend/.env`):**

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Optional — only needed if not served from backend `/api/auth/config` |

### 4. Set up database & seed demo data

**If you used Docker:**

```bash
cd crm-dashboard-backend
npm run db:setup
```

**If you used Homebrew:**

```bash
npm run setup:db
```

This applies the Prisma schema and seeds demo contacts, deals, activities, teams, territories, and more.

### 5. Run the app

**Terminal 1 — Backend (port 3001):**

```bash
npm run dev:backend
```

**Terminal 2 — Frontend (port 5173):**

```bash
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173)

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `password123` |
| Sales Rep | `sales@example.com` | `password123` |

---

## Google Sign-In (optional)

1. Create an OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Web application).
2. Add authorized JavaScript origins: `http://localhost:5173`
3. Set `GOOGLE_CLIENT_ID` in `crm-dashboard-backend/.env`
4. Restart the backend — the login and register pages will show the Google button automatically

---

## Internationalization

Supported languages: **English (EN)** and **German (DE)**.

- Language is detected from browser settings on first visit, then stored in `localStorage` (`salesflow-language`)
- Switch language from:
  - Login / Register (top-right)
  - Sidebar footer (when logged in)
  - Settings → Appearance

Translation files live in `crm-dashboard-frontend/src/i18n/locales/`. Only static UI labels are translated — user-generated content (contact names, notes, etc.) is shown as entered.

---

## Tech Stack

### Frontend

| | |
|---|---|
| React 19 + Vite | UI framework & build tool |
| Tailwind CSS 4 | Styling |
| React Query | Server state & caching |
| React Router | Routing |
| React Hook Form | Forms |
| i18next + react-i18next | Internationalization |
| @react-oauth/google | Google Sign-In |
| DnD Kit | Pipeline drag-and-drop |
| Recharts | Charts & analytics |
| Axios | HTTP client |

### Backend

| | |
|---|---|
| Node.js + Express 5 | REST API |
| PostgreSQL | Database |
| Prisma | ORM & migrations |
| JWT | Authentication |
| bcryptjs | Password hashing |
| google-auth-library | Google token verification |
| otplib + qrcode | TOTP 2FA |
| multer | File uploads |

---

## Project structure

```
SalesFlow-CRM-Dashboard/
├── crm-dashboard-frontend/     # React SPA
│   └── src/
│       ├── api/                # API client modules
│       ├── components/         # UI components (auth, common, dashboard, …)
│       ├── context/            # Auth, theme, Google auth providers
│       ├── i18n/               # i18n config + en/de locale files
│       ├── layouts/            # App shell, sidebar
│       ├── pages/              # Route pages
│       └── routes/             # Route definitions
├── crm-dashboard-backend/      # Express API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Demo data seeder
│   └── src/
│       ├── controllers/
│       ├── middleware/         # Auth, admin guard, upload
│       ├── routes/
│       └── utils/              # Audit, 2FA helpers
├── scripts/
│   └── setup-db.sh             # macOS PostgreSQL setup helper
└── docker-compose.yml            # PostgreSQL container
```

---

## API overview

Base URL: `http://localhost:3001/api`

| Area | Endpoints |
|------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/google`, `GET /auth/config`, `POST /auth/2fa/verify`, profile & password, 2FA setup/disable, user invite (admin) |
| **Contacts** | CRUD, import/export CSV, duplicate check & merge |
| **Deals** | CRUD, stage updates |
| **Activities** | List, create, delete |
| **Notes** | Per-contact notes |
| **Dashboard** | Stats, forecast, quota progress |
| **Pipeline** | Stage management (admin) |
| **Reports & leaderboard** | Analytics & rankings |
| **Teams & territories** | CRUD (admin) |
| **Custom fields & lead sources** | CRUD (admin) |
| **Tags & attachments** | Contact tagging & file uploads |
| **Audit log** | Change history (admin) |
| **Search** | Global search |
| **Onboarding** | Checklist progress |

All protected routes require a `Authorization: Bearer <token>` header.

---

## Roles

| Capability | Admin | Sales Rep |
|------------|:-----:|:---------:|
| View all contacts & deals | ✓ | Own records only |
| Manage pipeline stages & quotas | ✓ | — |
| Teams, territories, audit log | ✓ | — |
| Invite users & disable 2FA | ✓ | — |
| Reports (org-wide) | ✓ | Own metrics |
| Dashboard, pipeline, activities | ✓ | ✓ |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install frontend & backend dependencies |
| `npm run dev:frontend` | Start Vite dev server |
| `npm run dev:backend` | Start Express API with watch mode |
| `npm run setup:db` | Interactive macOS DB setup + seed |
| `npm run db:setup` | Reset schema & seed (from backend) |
| `npm run db:seed` | Re-run seed only |

---

## Production build

```bash
cd crm-dashboard-frontend
npm run build
npm run preview   # preview production build locally
```

---

## License

MIT
