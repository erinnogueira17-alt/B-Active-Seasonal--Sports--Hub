/**
 * Coach access — a shared, simple sign-in for coaches: first name + surname +
 * a shared access code (PIN). No per-coach passwords, so there's nothing to
 * forget. Admins keep their own real passwords (handled separately).
 *
 * Change the code by setting COACH_PIN in the environment, or edit the
 * fallback below (e.g. bump it each year).
 */
export const COACH_PIN = (process.env.COACH_PIN ?? "2026").trim();

export function verifyCoachPin(pin: string): boolean {
  return pin.trim() === COACH_PIN;
}

/** Tidy a first/surname pair into a trimmed, single-spaced display name. */
export function normalizeCoachName(first: string, surname: string) {
  const f = first.trim().replace(/\s+/g, " ");
  const s = surname.trim().replace(/\s+/g, " ");
  return { first: f, surname: s, display: `${f} ${s}`.trim() };
}

/**
 * A stable synthetic email used to key a coach's account row from their name,
 * e.g. ("Daniel", "Mann") → "daniel.mann@coach.hub". This lets the existing
 * account/session machinery (and photo-uploader tracking) keep working without
 * asking coaches for an email.
 */
export function coachEmail(first: string, surname: string): string {
  const slug = `${first} ${surname}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug || "coach"}@coach.hub`;
}
