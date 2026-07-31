import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { siteSettings } from "../db/schema.js";

const CALENDAR_KEY = "calendarVisible";

export const settingsRouter = router({
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
