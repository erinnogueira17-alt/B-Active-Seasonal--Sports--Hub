import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { siteSettings } from "../db/schema.js";

const CALENDAR_KEY = "calendarVisible";
const HERO_KEY = "heroImageUrl";

async function readSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (existing[0]) {
    await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value });
  }
}

export const settingsRouter = router({
  // Homepage hero background photo (empty string = use the default).
  getHeroImage: publicProcedure.query(async () => {
    const value = await readSetting(HERO_KEY);
    return { url: value && value.length > 0 ? value : null };
  }),

  setHeroImage: adminProcedure
    .input(z.object({ url: z.string().max(2000) }))
    .mutation(async ({ input }) => {
      await writeSetting(HERO_KEY, input.url);
      return { success: true };
    }),

  getCalendarVisible: publicProcedure.query(async () => {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, CALENDAR_KEY))
      .limit(1);
    return { visible: rows[0]?.value === "true" };
  }),

  setCalendarVisible: adminProcedure
    .input(z.object({ visible: z.boolean() }))
    .mutation(async ({ input }) => {
      const value = input.visible ? "true" : "false";
      const existing = await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, CALENDAR_KEY))
        .limit(1);
      if (existing[0]) {
        await db
          .update(siteSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(siteSettings.key, CALENDAR_KEY));
      } else {
        await db.insert(siteSettings).values({ key: CALENDAR_KEY, value });
      }
      return { success: true };
    }),
});
