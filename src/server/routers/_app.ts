import { router } from "../trpc.js";
import { authRouter } from "./auth.js";
import { resultsRouter } from "./results.js";
import { allocationsRouter } from "./allocations.js";
import { resourcesRouter } from "./resources.js";
import { galleryRouter } from "./gallery.js";
import { liveLogRouter } from "./liveLog.js";
import { eventsRouter } from "./events.js";
import { coachesRouter } from "./coaches.js";
import { plannerRouter } from "./planner.js";
import { pointsHistoryRouter } from "./pointsHistory.js";
import { schoolsRouter } from "./schools.js";
import { settingsRouter } from "./settings.js";

export const appRouter = router({
  auth: authRouter,
  results: resultsRouter,
  allocations: allocationsRouter,
  resources: resourcesRouter,
  gallery: galleryRouter,
  liveLog: liveLogRouter,
  events: eventsRouter,
  coaches: coachesRouter,
  planner: plannerRouter,
  pointsHistory: pointsHistoryRouter,
  schools: schoolsRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
