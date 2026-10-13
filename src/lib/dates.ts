/** Monday (00:00 local) of the week containing `d`. */
export function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

/** The `count` most recent Mondays, newest first. */
export function recentMondays(count: number, from: Date = new Date()): Date[] {
  const base = mondayOf(from);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const m = new Date(base);
    m.setDate(m.getDate() - i * 7);
    out.push(m);
  }
  return out;
}

/** All Mondays from `start` to `end` inclusive (ascending). */
export function mondaysBetween(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  let cur = mondayOf(start);
  const last = mondayOf(end);
  while (cur <= last) {
    out.push(new Date(cur));
    const next = new Date(cur);
    next.setDate(next.getDate() + 7);
    cur = next;
  }
  return out;
}

/** All Mondays from first Monday of 2025 up to `weeksAhead` weeks in the future. */
export function allMondaysForAnalytics(weeksAhead = 4): Date[] {
  const start = new Date(2025, 0, 6); // first Monday of 2025
  const end = new Date();
  end.setDate(end.getDate() + weeksAhead * 7);
  return mondaysBetween(start, end);
}

/**
 * Local calendar date as YYYY-MM-DD. Uses local date parts (NOT toISOString,
 * which is UTC) so week keys line up with how dates are displayed and how
 * planner weeks are stored — otherwise, in timezones ahead of UTC, a local
 * midnight Monday becomes the previous day in UTC and week-matching breaks.
 */
export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
