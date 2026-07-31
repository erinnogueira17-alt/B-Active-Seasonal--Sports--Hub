import { Link } from "wouter";
import { CalendarDays, Trophy, Camera, ChevronRight, Medal } from "lucide-react";
import { trpc } from "../lib/trpc";
import { formatDate } from "../lib/utils";

/** The term currently on show in the dashboard leaderboard. Update at term rollover. */
const CURRENT_TERM = "term3" as const;

type EventRow = { id: number; title: string; date: string | Date; category: string; color?: string | null };
type LogRow = { id: number; entityName: string; points: number };
type Photo = { id: number; title: string | null; caption: string | null; imageUrl: string };

/**
 * At-a-glance dashboard for the home page — works on desktop (3 columns) and
 * mobile (stacked). Shows the next fixtures, the top of the leaderboard and the
 * latest photos, each linking through to its full page.
 */
export function QuickDashboard() {
  const events = trpc.events.list.useQuery();
  const leaderboard = trpc.liveLog.list.useQuery({ term: CURRENT_TERM });
  const gallery = trpc.gallery.list.useQuery();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcoming = ((events.data ?? []) as EventRow[])
    .filter((e) => new Date(e.date) >= now)
    .slice(0, 4);
  const topCoaches = ((leaderboard.data ?? []) as LogRow[]).slice(0, 5);
  const photos = ((gallery.data ?? []) as Photo[]).slice(0, 6);

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Upcoming fixtures */}
      <Panel title="Upcoming" icon={CalendarDays} href="/" hideMore>
        {upcoming.length === 0 ? (
          <Empty>No upcoming events.</Empty>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: e.color || "#f59e0b" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-800">{e.title}</p>
                  <p className="text-xs capitalize text-neutral-500">{e.category}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-neutral-500">
                  {formatDate(e.date, { month: "short", day: "numeric" })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Leaderboard */}
      <Panel title="Leaderboard" icon={Trophy} href="/log">
        {topCoaches.length === 0 ? (
          <Empty>Leaderboard starts after the first submissions.</Empty>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {topCoaches.map((row, i) => (
              <li key={row.id} className="flex items-center gap-3 py-2.5">
                <RankBadge rank={i + 1} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                  {row.entityName}
                </span>
                <span className="shrink-0 text-sm font-bold text-neutral-900">{row.points}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Latest photos */}
      <Panel title="Latest Photos" icon={Camera} href="/gallery">
        {photos.length === 0 ? (
          <Empty>No photos yet.</Empty>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <Link key={p.id} href="/gallery" className="block overflow-hidden rounded-lg bg-neutral-100">
                <img
                  src={p.imageUrl}
                  alt={p.caption ?? p.title ?? ""}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition-transform hover:scale-105"
                />
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  href,
  hideMore,
  children,
}: {
  title: string;
  icon: typeof Trophy;
  href: string;
  hideMore?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="heading flex items-center gap-2 text-base text-neutral-900">
          <Icon className="h-5 w-5 text-[#dc2626]" /> {title}
        </h3>
        {!hideMore && (
          <Link href={href} className="flex items-center text-xs font-semibold text-[#dc2626] hover:underline">
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? "bg-[#f59e0b] text-black"
      : rank === 2
        ? "bg-neutral-300 text-neutral-800"
        : rank === 3
          ? "bg-[#cd7f32] text-white"
          : "bg-neutral-100 text-neutral-500";
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${styles}`}>
      {rank <= 3 ? <Medal className="h-3.5 w-3.5" /> : rank}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-neutral-400">{children}</p>;
}
