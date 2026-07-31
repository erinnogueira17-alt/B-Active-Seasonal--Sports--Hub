/**
 * Pure role helpers — no DB, easy to unit-test.
 */

/**
 * Should a newly-registering account be made an admin automatically?
 * True when it's the very first account, or its email matches ADMIN_EMAIL.
 * Everyone else registers as a coach (approved by an admin later).
 *
 * @param existingUserCount how many users already exist
 * @param adminEmailEnv     process.env.ADMIN_EMAIL (may be undefined)
 * @param email             the registering email (case-insensitive match)
 */
export function isBootstrapAdmin(
  existingUserCount: number,
  adminEmailEnv: string | undefined,
  email: string,
): boolean {
  if (existingUserCount === 0) return true;
  if (!adminEmailEnv) return false;
  return adminEmailEnv.toLowerCase().trim() === email.toLowerCase().trim();
}
