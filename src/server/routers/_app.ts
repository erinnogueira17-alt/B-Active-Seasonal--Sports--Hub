import { router } from "../trpc";
import { authRouter } from "./auth";
import { resultsRouter } from "./results";
import { allocationsRouter } from "./allocations";
import { resourcesRouter } from "./resources";
import { galleryRouter } from "./gallery";
import { liveLogRouter } from "./liveLog";
import { eventsRouter } from "./events";
import { coachesRouter } from "./coaches";
import { plannerRouter } from "./planner";
import { pointsHistoryRouter } from "./pointsHistory";
import { schoolsRouter } from "./schools";
import { settingsRouter } from "./settings";

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
