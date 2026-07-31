# Seasonal Sports Hub — The B-Active Group

A production web app for managing The B-Active Group's seasonal coaching
programme: coach allocations, weekly results, a points leaderboard, a weekly
planner tracker, a photo gallery, a resource library, and an events calendar.

Built to run **permanently on Vercel** with **Vercel Postgres** (the database)
and **Vercel Blob** (photos, PDFs, resource files).

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript, Tailwind CSS 4, Wouter routing |
| API | tRPC 11 (end-to-end type-safe) over Express, Superjson |
| Database | **Vercel Postgres (Neon)** via Drizzle ORM |
| File storage | **Vercel Blob** |
| Auth | Email + password, JWT session cookie, `user` / `admin` roles |
| Reports | Branded, browser print-to-PDF (no serverless Chromium needed) |
| Build / test | Vite 6, Vitest |

The API runs as a single Vercel serverless function (`api/index.ts`) that mounts
the whole tRPC router. The React app is a static SPA served by Vercel.

---

## Deploy to Vercel (≈10 minutes, one time)

You don't need anything installed locally for this — it's all done in the Vercel
dashboard. The repo is already configured (`vercel.json`, build command, API
function).

### 1. Import the repository
1. Go to **vercel.com → Add New… → Project**.
2. Import this GitHub repo. Vercel auto-detects the **Vite** framework — leave
   the build settings as detected (build `vite build`, output `dist`).
3. **Don't click Deploy yet** — add the stores and secret first (below), or add
   them right after the first deploy and redeploy.

### 2. Add a Postgres database
1. In the project, open the **Storage** tab → **Create Database** → **Postgres**.
2. Connect it to the project. Vercel automatically injects `DATABASE_URL` (and
   related `POSTGRES_*` vars) into the project's environment.

### 3. Add a Blob store
1. **Storage** tab → **Create** → **Blob**.
2. Connect it to the project. Vercel injects `BLOB_READ_WRITE_TOKEN`.

### 4. Add the remaining environment variables
In **Settings → Environment Variables**, add:

| Name | Value |
|---|---|
| `JWT_SECRET` | a long random string — generate with `openssl rand -base64 48` |
| `ADMIN_EMAIL` | *(optional)* the email that should auto-become admin on sign-up |

`DATABASE_URL` and `BLOB_READ_WRITE_TOKEN` are already there from steps 2–3.

### 5. Deploy, then create the tables and seed data
1. Click **Deploy**. Wait for the build to finish.
2. Create the database tables and seed the initial data. Two options:

   **A. From your own machine** (simplest):
   ```bash
   git clone <this-repo> && cd B-Active-Seasonal--Sports--Hub
   npm install
   # Paste the Postgres connection string from Vercel → Storage → your DB → .env tab:
   echo 'DATABASE_URL="postgres://…"' > .env
   npm run db:push     # creates all tables
   npm run db:seed     # seeds Term 3 coaches, schools, allocations, leaderboard
   ```

   **B. Using Vercel CLI** (`npm i -g vercel`):
   ```bash
   vercel link         # link to the project
   vercel env pull .env
   npm install
   npm run db:push
   npm run db:seed
   ```

### 6. Create the first admin
1. Open the deployed site → **Sign in → Create account**.
2. **The first account created automatically becomes the administrator**
   (or any account whose email matches `ADMIN_EMAIL`). Admin nav + management
   pages appear immediately.

That's it — the site is live and permanent. Every push to the repo auto-deploys.

---

## Local development

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, BLOB_READ_WRITE_TOKEN, JWT_SECRET
npm run db:push           # create tables
npm run db:seed           # seed data

# Two terminals:
npm run dev:api           # Express API on :3000
npm run dev               # Vite app on :5173 (proxies /api → :3000)
```

Open http://localhost:5173.

### Useful scripts
| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (frontend) |
| `npm run dev:api` | Local API server (mirrors the Vercel function) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (planner window + points logic) |
| `npm run db:push` | Apply the Drizzle schema to the database |
| `npm run db:seed` | Seed coaches, schools, allocations, leaderboard, settings |

---

## Season / term maintenance

A few values are intentionally hardcoded and updated at term boundaries — edit
them and push (auto-redeploys):

- **`src/pages/SubmitPlanner.tsx`**
  - `SEASON_OPEN` — master switch (`false` closes planner submissions for everyone).
  - `TERM_START` — earliest date the weekly window can open.
  - `getCurrentTerm()` — the active term (e.g. `"term3"`).
- **`src/pages/AdminDashboard.tsx`** — the "Term N is active" banner text.

The weekly planner window opens **Sunday & Monday** only; the first submission
each week awards **+2 points** and writes a `points_history` audit record.
Re-submitting the same week updates the link but awards no extra points.

---

## Notes

- **Storage sizing:** Vercel Blob is usage-based object storage (pay per
  GB-month), not a fixed cap — it grows with your photos/PDFs. Structured data
  lives in Postgres.
- All timestamps are stored **UTC**; the UI renders them in the viewer's local
  timezone. Coaches operate in UTC+2 (South Africa) — the planner window uses
  plain date arithmetic to avoid off-by-one errors.
- Admin-only tRPC mutations enforce `role === 'admin'` server-side; the
  `allocations` and `gallery.delete` procedures are public by design for easy
  data loading (see the security note in the code to harden for production).
- File limits: 16 MB for resources, 10 MB for gallery images.
