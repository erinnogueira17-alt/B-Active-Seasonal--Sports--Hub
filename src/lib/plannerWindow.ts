/**
 * Planner submission window logic — pure date arithmetic (no ISO-week helpers,
 * which cause off-by-one errors around the Sunday boundary).
 *
 * The window is open on Sunday and Monday only. Sunday is the "week start"
 * marker for the week that begins the following Monday.
 */

export type WindowStatus =
  | { state: "season_ended" }
  | { state: "not_started"; termStart: Date }
  | { state: "closed"; nextSunday: Date }
  | { state: "open"; sunday: Date; monday: Date };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function getWindowStatus(
  now: Date,
  seasonOpen: boolean,
  termStart: Date,
): WindowStatus {
  if (!seasonOpen) return { state: "season_ended" };
  if (now < termStart) return { state: "not_started", termStart };

  const today = startOfDay(now);
  const day = today.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  if (day === 0) {
    const sunday = today;
    const monday = addDays(sunday, 1);
    return { state: "open", sunday, monday };
  }
  if (day === 1) {
    const monday = today;
    const sunday = addDays(monday, -1);
    return { state: "open", sunday, monday };
  }

  const daysUntilSunday = 7 - day;
  const nextSunday = addDays(today, daysUntilSunday);
  return { state: "closed", nextSunday };
}

/** The Monday-of-week value stored with a submission when the window is open. */
export function submissionWeekDate(status: Extract<WindowStatus, { state: "open" }>): Date {
  return status.monday;
}
