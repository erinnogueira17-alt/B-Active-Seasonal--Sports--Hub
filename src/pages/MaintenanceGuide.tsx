import { type ReactNode } from "react";
import {
  CalendarClock,
  Users,
  ShieldPlus,
  CalendarDays,
  Rocket,
  Database,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { AdminOnly } from "../components/Guards";
import { PageContainer, PageHeader } from "../components/ui";

const LIVE_SITE = "https://b-active-seasonal-sports-hub.vercel.app";
const DEPLOYMENTS = "https://vercel.com/b-active/b-active-seasonal-sports-hub/deployments";

export function MaintenanceGuide() {
  return (
    <AdminOnly>
      <Inner />
    </AdminOnly>
  );
}

function Inner() {
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Term Maintenance Guide"
        subtitle="Everything you'll do to keep the hub current each term. Most of it is point-and-click in this admin panel — only two items need a small code edit."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-2">
        <LinkCard href={LIVE_SITE} label="Live site" value="b-active-seasonal-sports-hub.vercel.app" />
        <LinkCard href={DEPLOYMENTS} label="Vercel deployments" value="Watch builds go live" />
      </div>

      <Section n={1} icon={CalendarClock} title="Start of a new term (the code edits)">
        <p>
          The planner submission window and the "current term" are set in one file:{" "}
          <Code>src/pages/SubmitPlanner.tsx</Code> (top of the file).
        </p>
        <CodeBlock>{`const SEASON_OPEN = true;                 // false = planner closed for everyone
const TERM_START  = new Date(2026, 6, 1); // earliest date the weekly window opens
                                          // (month is 0-based: 6 = July)
function getCurrentTerm() { return "term3"; }  // the active term`}</CodeBlock>
        <p className="font-medium">At the start of a new term:</p>
        <ol className="ml-5 list-decimal space-y-1 text-neutral-700">
          <li>
            Set <Code>getCurrentTerm()</Code> to the new term (e.g. <Code>"term4"</Code>).
          </li>
          <li>
            Set <Code>TERM_START</Code> to the term's start date.
          </li>
          <li>
            Make sure <Code>SEASON_OPEN = true</Code>.
          </li>
          <li>
            Update the <strong>home-page dashboard</strong> leaderboard term: set{" "}
            <Code>CURRENT_TERM</Code> in <Code>src/components/QuickDashboard.tsx</Code> to the new term
            (e.g. <Code>"term4"</Code>).
          </li>
          <li>Save → commit → push. The site redeploys automatically (see §5).</li>
        </ol>
        <Callout>
          At the <strong>end</strong> of a season, set <Code>SEASON_OPEN = false</Code> and push — planner
          submissions close with a "season ended" message. The banner text "Term 3 is active" on the Admin
          dashboard lives in <Code>src/pages/AdminDashboard.tsx</Code> if you want to update it too.
        </Callout>
      </Section>

      <Section n={2} icon={Users} title="Rosters, schools, allocations (all in the admin panel — no code)">
        <ul className="ml-5 list-disc space-y-2 text-neutral-700">
          <li>
            <strong>Coaches:</strong> Admin → <strong>Manage Coaches</strong>. Add/rename/remove per term, and use{" "}
            <strong>Copy Roster</strong> to carry a term's coaches into the next term.
          </li>
          <li>
            <strong>Schools:</strong> Results page → <strong>Manage Schools</strong> (admin) — add/rename/delete.
            This list feeds the results form dropdown.
          </li>
          <li>
            <strong>Allocations:</strong> the Allocations page create/delete. (Bulk-loading a whole term is
            easiest via a SQL paste — see §6.)
          </li>
          <li>
            <strong>Leaderboard:</strong> Log page (admin) — add/adjust points; planner submissions auto-award
            +2 on a coach's first submission each week.
          </li>
        </ul>
      </Section>

      <Section n={3} icon={ShieldPlus} title="Add another admin">
        <p>
          New people sign up on the site first (Sign in → Create account). To make one an admin, run this in the
          database (see §6 for where):
        </p>
        <CodeBlock>{`UPDATE users SET role = 'admin' WHERE email = 'their.email@example.com';`}</CodeBlock>
        <p>They'll have admin access next time they load the site.</p>
      </Section>

      <Section n={4} icon={CalendarDays} title="Calendar, results, reports, resources">
        <ul className="ml-5 list-disc space-y-2 text-neutral-700">
          <li>
            <strong>Calendar:</strong> Admin → <strong>Manage Calendar</strong> to add events. On the homepage,
            admins get a <strong>Show/Hide</strong> toggle to control whether the public sees it.
          </li>
          <li>
            <strong>Results:</strong> anyone can submit; admins can delete. Download branded <strong>JPEG</strong>{" "}
            (weekly) and <strong>PDF</strong> (multi-week) reports from the Results page.
          </li>
          <li>
            <strong>Gallery / Resources:</strong> admin upload areas. Files go straight to Vercel Blob.
          </li>
        </ul>
      </Section>

      <Section n={5} icon={Rocket} title="How changes go live">
        <p>
          The GitHub repo is connected to Vercel. <strong>Every push to the <Code>main</Code> branch
          auto-deploys</strong> to the live site — no manual step. Watch progress on the{" "}
          <A href={DEPLOYMENTS}>Vercel deployments page</A>.
        </p>
      </Section>

      <Section n={6} icon={Database} title="Running SQL (when you need it)">
        <p>For admin-promotion (§3) or bulk data loads, use the database query editor:</p>
        <ul className="ml-5 list-disc space-y-1 text-neutral-700">
          <li>
            Vercel → <strong>Storage</strong> → your Postgres DB → <strong>Query</strong>, or
          </li>
          <li>
            <strong>Neon Console → SQL Editor</strong> (via "Open in Neon").
          </li>
        </ul>
        <p className="mt-3">
          Reusable SQL files live in the <Code>db/</Code> folder of the repo:
        </p>
        <ul className="ml-5 list-disc space-y-1 text-neutral-700">
          <li>
            <Code>setup.sql</Code> — first-time schema + seed (already run)
          </li>
          <li>
            <Code>migrate-old-data.sql</Code> — schools, allocations, coach rosters, leaderboard
          </li>
          <li>
            <Code>migrate-results.sql</Code> — results history
          </li>
          <li>
            <Code>resources-seed.sql</Code> — curated official coaching/refereeing links
          </li>
        </ul>
      </Section>

      <Section n={7} icon={Wallet} title="Costs & storage (FYI)">
        <p>
          Hosting is on Vercel (Hobby to start). Data lives in Vercel Postgres (Neon); photos, PDFs and files
          live in Vercel Blob — usage-based storage, so it grows with what you add. Nothing to manage
          day-to-day.
        </p>
      </Section>
    </PageContainer>
  );
}

/* ── small presentational helpers ─────────────────────────── */

function Section({
  n,
  icon: Icon,
  title,
  children,
}: {
  n: number;
  icon: typeof Users;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card mb-6 p-6">
      <div className="mb-4 flex items-center gap-3 border-b border-neutral-100 pb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#dc2626]/10 text-[#dc2626]">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="heading text-lg text-neutral-900">
          <span className="text-[#dc2626]">{n}.</span> {title}
        </h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] text-[#b45309]">
      {children}
    </code>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed text-neutral-100">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border-l-4 border-[#f59e0b] bg-[#f59e0b]/5 p-3 text-sm text-neutral-700">
      {children}
    </div>
  );
}

function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-[#dc2626] underline decoration-[#dc2626]/40 underline-offset-2 hover:decoration-[#dc2626]"
    >
      {children}
    </a>
  );
}

function LinkCard({ href, label, value }: { href: string; label: string; value: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card group flex items-center justify-between gap-3 p-4 transition-shadow hover:shadow-md"
    >
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</div>
        <div className="mt-0.5 font-medium text-neutral-900 group-hover:text-[#dc2626]">{value}</div>
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-[#dc2626]" />
    </a>
  );
}
