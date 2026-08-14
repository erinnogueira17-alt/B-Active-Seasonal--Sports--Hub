import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const termEnum = pgEnum("term", ["term1", "term2", "term3", "term4"]);
export const resourceCategoryEnum = pgEnum("resource_category", [
  "football",
  "rugby",
  "hockey",
  "netball",
  "swimming",
  "athletics",
  "softball",
  "basketball",
  "tennis",
]);
export const resourceSubcategoryEnum = pgEnum("resource_subcategory", [
  "coaching_guides",
  "refereeing_umpiring",
]);
export const eventCategoryEnum = pgEnum("event_category", [
  "fixture",
  "festival",
  "tournament",
  "training",
]);

// ─── users — auth accounts ──────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  loginMethod: varchar("login_method", { length: 50 }).default("password"),
  role: roleEnum("role").notNull().default("user"),
  // Coaches self-serve. Becoming an admin needs approval by an existing admin;
  // this flags a coach who has requested admin access (shows in the admin queue).
  adminRequested: boolean("admin_requested").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }),
});

// ─── results — weekly match results submitted by coaches ────────────────
export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  coachName: varchar("coach_name", { length: 255 }).notNull(),
  sport: varchar("sport", { length: 100 }).notNull(),
  team: varchar("team", { length: 255 }).notNull(), // used as school name
  ageGroup: varchar("age_group", { length: 100 }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  opposition: varchar("opposition", { length: 255 }),
  result: varchar("result", { length: 255 }),
  feedback: text("feedback"),
  submittedBy: integer("submitted_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── allocations — coach-to-team assignments per term ───────────────────
export const allocations = pgTable("allocations", {
  id: serial("id").primaryKey(),
  coachName: varchar("coach_name", { length: 255 }).notNull(),
  team: varchar("team", { length: 255 }).notNull(),
  school: varchar("school", { length: 255 }).notNull(),
  term: termEnum("term").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── resources — uploaded coaching/officiating files (Vercel Blob) ──────
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: resourceCategoryEnum("category").notNull(),
  subcategory: resourceSubcategoryEnum("subcategory"),
  fileUrl: text("file_url").notNull(),
  fileKey: text("file_key").notNull(),
  fileType: varchar("file_type", { length: 100 }),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── gallery — photo gallery images (Vercel Blob) ───────────────────────
export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }),
  caption: text("caption"),
  imageUrl: text("image_url").notNull(),
  imageKey: text("image_key").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── liveLog — points leaderboard per term ──────────────────────────────
export const liveLog = pgTable("live_log", {
  id: serial("id").primaryKey(),
  entityName: varchar("entity_name", { length: 255 }).notNull(), // coach name
  points: integer("points").notNull().default(0),
  rank: integer("rank"),
  term: termEnum("term").notNull().default("term1"),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── events — calendar events ───────────────────────────────────────────
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  category: eventCategoryEnum("category").notNull().default("fixture"),
  color: varchar("color", { length: 50 }).default("#F59E0B"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── notices — homepage notice board (universal coach messages) ─────────
export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── plannerSubmissions — weekly seasonal plan URL submissions ──────────
export const plannerSubmissions = pgTable("planner_submissions", {
  id: serial("id").primaryKey(),
  coachName: varchar("coach_name", { length: 255 }).notNull(),
  plannerUrl: text("planner_url").notNull(),
  weekDate: timestamp("week_date", { withTimezone: true }).notNull(), // Monday of week
  term: termEnum("term").notNull().default("term2"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── coaches — coach roster per term ────────────────────────────────────
export const coaches = pgTable("coaches", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  term: termEnum("term").notNull().default("term2"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── site_settings — key-value feature flags ────────────────────────────
export const siteSettings = pgTable("site_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── points_history — audit trail for auto-awarded points ───────────────
export const pointsHistory = pgTable("points_history", {
  id: serial("id").primaryKey(),
  coachName: varchar("coach_name", { length: 255 }).notNull(),
  term: termEnum("term").notNull().default("term2"),
  points: integer("points").notNull().default(2),
  reason: varchar("reason", { length: 255 }).notNull().default("planner_submission"),
  weekDate: timestamp("week_date", { withTimezone: true }).notNull(),
  awardedAt: timestamp("awarded_at", { withTimezone: true }).defaultNow(),
});

// ─── schools — admin-managed school list for results dropdown ───────────
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Convenience type exports
export type User = typeof users.$inferSelect;
export type Result = typeof results.$inferSelect;
export type Allocation = typeof allocations.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type GalleryItem = typeof gallery.$inferSelect;
export type LiveLogEntry = typeof liveLog.$inferSelect;
export type EventItem = typeof events.$inferSelect;
export type PlannerSubmission = typeof plannerSubmissions.$inferSelect;
export type Coach = typeof coaches.$inferSelect;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type PointsHistoryEntry = typeof pointsHistory.$inferSelect;
export type School = typeof schools.$inferSelect;
