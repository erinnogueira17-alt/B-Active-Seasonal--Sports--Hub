# Seasonal Sports Hub — Running it each term

A short reference for the few things you'll do to keep the hub current. Most of
it is point-and-click in the admin panel; only two items need a small code edit.

Live site: https://b-active-seasonal-sports-hub.vercel.app
Admin panel: sign in, then the gold **Admin Panel** button appears in the nav.

---

## 1. Start of a new term (the code edits)

The planner submission window and the "current term" are set in one file:
`src/pages/SubmitPlanner.tsx` (top of the file).

```ts
const SEASON_OPEN = true;                 // false = planner closed for everyone
const TERM_START  = new Date(2026, 6, 1); // earliest date the weekly window opens
                                          // (month is 0-based: 6 = July)
function getCurrentTerm() { return "term3"; }  // the active term
```

At the start of a new term:
1. Set `getCurrentTerm()` to the new term (e.g. `"term4"`).
2. Set `TERM_START` to the term's start date.
3. Make sure `SEASON_OPEN = true`.
4. Update the **home-page dashboard** leaderboard term: set `CURRENT_TERM`
   in `src/components/QuickDashboard.tsx` to the new term (e.g. `"term4"`).
5. Save → commit → push. The site redeploys automatically (see §5).

At the **end** of a season, set `SEASON_OPEN = false` and push — planner
submissions close with a "season ended" message.

> The banner text "Term 3 is active" on the Admin dashboard lives in
> `src/pages/AdminDashboard.tsx` if you want to update it too.

---

## 2. Rosters, schools, allocations (all in the admin panel — no code)

- **Coaches:** Admin → **Manage Coaches**. Add/rename/remove per term, and use
  **Copy Roster** to carry a term's coaches into the next term.
- **Schools:** Results page → **Manage Schools** (admin) — add/rename/delete.
  This list feeds the results form dropdown.
- **Allocations:** the Allocations page create/delete. (Bulk-loading a whole
  term is easiest via a SQL paste — see §6.)
- **Leaderboard:** Log page (admin) — add/adjust points; planner submissions
  auto-award +2 on a coach's first submission each week.

---

## 3. Accounts, coaches & admins

Everyone signs in — the login screen has two tabs, **Coach** and **Admin**.

- **Coaches** create their own account (Coach → Create account) and can use all
  coach-facing pages straight away. No approval needed.
- **Admins** are the management team (the backend). A coach becomes an admin
  only when an existing admin approves them.

**Approving / adding admins** — Admin → **Team & Accounts** (the dashboard shows
a gold banner when someone requests admin):

1. A coach signs in, then clicks **Request admin access** on the home page.
2. Their request appears under **Admin access requests** — click
   **Approve as admin**. (You can also **Make admin** on any coach directly.)
3. To remove an admin, use **Make coach**. You can't change your own role, so
   there's always at least one admin. **Remove** deletes a coach account.

> Coaches can never see the admin panel — only admins can.

---

## 4. Calendar, results, reports, resources

- **Calendar:** Admin → **Manage Calendar** to add events. On the homepage,
  admins get a **Show/Hide** toggle to control whether the public sees it.
- **Results:** anyone can submit; admins can delete. Download branded **JPEG**
  (weekly) and **PDF** (multi-week) reports from the Results page.
- **Gallery / Resources:** admin upload areas. Files go straight to Vercel Blob.

---

## 5. How changes go live

The GitHub repo is connected to Vercel. **Every push to the `main` branch
auto-deploys** to the live site — no manual step. Watch progress at:
https://vercel.com/b-active/b-active-seasonal-sports-hub/deployments

---

## 6. Running SQL (when you need it)

For admin-promotion (§3) or bulk data loads, use the database query editor:
- Vercel → **Storage** → your Postgres DB → **Query**, or
- **Neon Console → SQL Editor** (via "Open in Neon").

Reusable SQL files live in the `db/` folder of the repo:
- `setup.sql` — first-time schema + seed (already run)
- `migrate-old-data.sql` — schools, allocations, coach rosters, leaderboard
- `migrate-results.sql` — results history
- `resources-seed.sql` — curated official coaching/refereeing links
- `dedupe-resources.sql` — remove duplicate curated links (if seeded twice)
- `add-admin-requests.sql` — one-time: team model (admin-request flag)

---

## 7. Costs & storage (FYI)

Hosting is on Vercel (Hobby to start). Data lives in Vercel Postgres (Neon);
photos, PDFs and files live in Vercel Blob — usage-based storage, so it grows
with what you add. Nothing to manage day-to-day.
