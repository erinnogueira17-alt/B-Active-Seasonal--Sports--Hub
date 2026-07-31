import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, adminProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { pointsHistory } from "../db/schema.js";

const termSchema = z.enum(["term1", "term2", "term3", "term4"]);

export const pointsHistoryRouter = router({
  list: adminProcedure
    .input(z.object({ term: termSchema.optional() }).optional())
    .query(async ({ input }) => {
      if (input?.term) {
        return db
          .select()
          .from(pointsHistory)
          .where(eq(pointsHistory.term, input.term))
          .orderBy(desc(pointsHistory.awardedAt));
      }
      return db
        .select()
        .from(pointsHistory)
        .orderBy(desc(pointsHistory.awardedAt));
    }),
});
