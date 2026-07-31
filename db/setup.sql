-- ============================================================
-- Seasonal Sports Hub — one-shot database setup
-- Paste this whole file into the Vercel Postgres / Neon query editor.
-- Creates all tables + enums, then loads the initial seed data.
-- Safe to run once on a fresh database.
-- ============================================================

CREATE TYPE "public"."event_category" AS ENUM('fixture', 'festival', 'tournament', 'training');--> statement-breakpoint
CREATE TYPE "public"."resource_category" AS ENUM('football', 'rugby', 'hockey', 'netball', 'swimming', 'athletics', 'softball', 'basketball', 'tennis');--> statement-breakpoint
CREATE TYPE "public"."resource_subcategory" AS ENUM('coaching_guides', 'refereeing_umpiring');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."term" AS ENUM('term1', 'term2', 'term3', 'term4');--> statement-breakpoint
CREATE TABLE "allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_name" varchar(255) NOT NULL,
	"team" varchar(255) NOT NULL,
	"school" varchar(255) NOT NULL,
	"term" "term" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "coaches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"term" "term" DEFAULT 'term2' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"date" timestamp with time zone NOT NULL,
	"category" "event_category" DEFAULT 'fixture' NOT NULL,
	"color" varchar(50) DEFAULT '#F59E0B',
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "gallery" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"caption" text,
	"image_url" text NOT NULL,
	"image_key" text NOT NULL,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "live_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_name" varchar(255) NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"term" "term" DEFAULT 'term1' NOT NULL,
	"updated_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "planner_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_name" varchar(255) NOT NULL,
	"planner_url" text NOT NULL,
	"week_date" timestamp with time zone NOT NULL,
	"term" "term" DEFAULT 'term2' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_name" varchar(255) NOT NULL,
	"term" "term" DEFAULT 'term2' NOT NULL,
	"points" integer DEFAULT 2 NOT NULL,
	"reason" varchar(255) DEFAULT 'planner_submission' NOT NULL,
	"week_date" timestamp with time zone NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" "resource_category" NOT NULL,
	"subcategory" "resource_subcategory",
	"file_url" text NOT NULL,
	"file_key" text NOT NULL,
	"file_type" varchar(100),
	"file_size" integer,
	"uploaded_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"coach_name" varchar(255) NOT NULL,
	"sport" varchar(100) NOT NULL,
	"team" varchar(255) NOT NULL,
	"age_group" varchar(100),
	"date" timestamp with time zone NOT NULL,
	"opposition" varchar(255),
	"result" varchar(255),
	"feedback" text,
	"submitted_by" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64),
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"login_method" varchar(50) DEFAULT 'password',
	"role" "role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	"last_signed_in" timestamp with time zone,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery" ADD CONSTRAINT "gallery_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_log" ADD CONSTRAINT "live_log_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- ─── Seed data ───────────────────────────────────────────────

-- Schools
INSERT INTO schools (name) VALUES
  ('Curro Sagewood'),
  ('Curro Halfway Gardens'),
  ('Curro Rivonia'),
  ('Colin Mann'),
  ('St Francis'),
  ('Carlswald'),
  ('Crawford Sandton'),
  ('Generation Schools'),
  ('Lion Pride Academy'),
  ('Sandton Sinai'),
  ('Rallim');

-- Coaches (Term 3)
INSERT INTO coaches (name, term) VALUES
  ('Abbey', 'term3'),
  ('Akimi', 'term3'),
  ('Azande', 'term3'),
  ('Bahle', 'term3'),
  ('Breyton', 'term3'),
  ('Busani', 'term3'),
  ('Daniel', 'term3'),
  ('Deon', 'term3'),
  ('Dylan', 'term3'),
  ('Edgar', 'term3'),
  ('Elizabeth', 'term3'),
  ('Harnu', 'term3'),
  ('Jean', 'term3'),
  ('Jerome', 'term3'),
  ('Jolie', 'term3'),
  ('Justin', 'term3'),
  ('Kabelo', 'term3'),
  ('Kamohelo', 'term3'),
  ('Keatlegile', 'term3'),
  ('Khanya', 'term3'),
  ('Lasley', 'term3'),
  ('Lebogang', 'term3'),
  ('Lungile', 'term3'),
  ('Mahlatsi', 'term3'),
  ('Mamello', 'term3'),
  ('Mikael', 'term3'),
  ('Mpho', 'term3'),
  ('Musa', 'term3'),
  ('Na''eel', 'term3'),
  ('Nhlanhla', 'term3'),
  ('Nosipho', 'term3'),
  ('Paballo', 'term3'),
  ('Remi', 'term3'),
  ('Ross', 'term3'),
  ('Samokelo', 'term3'),
  ('Sanele', 'term3'),
  ('Sergio', 'term3'),
  ('Shalom', 'term3'),
  ('Sipho', 'term3'),
  ('Siseko', 'term3'),
  ('Tapiwa', 'term3'),
  ('Thembi', 'term3'),
  ('Tshepiso', 'term3'),
  ('Welcome', 'term3');

-- Allocations (Term 3)
INSERT INTO allocations (school, team, coach_name, term) VALUES
  ('Curro Sagewood', 'u7 Hockey', 'Musa', 'term3'),
  ('Curro Sagewood', 'u8 Hockey', 'Lungile', 'term3'),
  ('Curro Sagewood', 'u10 Boys Hockey', 'Musa', 'term3'),
  ('Curro Sagewood', 'u11 Boys Hockey', 'Lungile', 'term3'),
  ('Curro Sagewood', 'Opens Boys Hockey', 'Ross', 'term3'),
  ('Curro Halfway Gardens', 'U7 Boys Hockey', 'Edgar', 'term3'),
  ('Curro Halfway Gardens', 'U8 Boys Hockey', 'Edgar', 'term3'),
  ('Curro Halfway Gardens', 'u9 Boys Hockey', 'Edgar', 'term3'),
  ('Curro Halfway Gardens', 'u10 Girls Hockey', 'Paballo', 'term3'),
  ('Curro Halfway Gardens', 'u11 Boys Hockey', 'Thembi', 'term3'),
  ('Curro Halfway Gardens', 'Opens Boys B Hockey', 'Thembi', 'term3'),
  ('Curro Rivonia', 'Mini Athletics R-1', 'Lasley', 'term3'),
  ('Curro Rivonia', 'Mini Athletics 2-3', 'Lasley', 'term3'),
  ('Curro Rivonia', 'Mini Hockey R-1', 'Na''eel', 'term3'),
  ('Curro Rivonia', 'Mini Hockey 2-3', 'Na''eel', 'term3'),
  ('Curro Rivonia', 'PS Athletics', 'Keatlegile', 'term3'),
  ('Curro Rivonia', 'PS Athletics', 'Samokelo', 'term3'),
  ('Curro Rivonia', 'PS Hockey U10', 'Justin', 'term3'),
  ('Curro Rivonia', 'PS Hockey U11', 'Breyton', 'term3'),
  ('Curro Rivonia', 'PS Hockey U12', 'Abbey', 'term3'),
  ('Curro Rivonia', 'PS Hockey U13', 'Tapiwa', 'term3'),
  ('Curro Rivonia', 'HS u15 Boys Football', 'Lebogang', 'term3'),
  ('Curro Rivonia', 'HS u19 Boys Football', 'Sipho', 'term3'),
  ('Curro Rivonia', 'HS Girls Football', 'Kabelo', 'term3'),
  ('Curro Rivonia', 'HS Hockey', 'Mpho', 'term3'),
  ('Colin Mann', 'u7 Cricket', 'Daniel', 'term3'),
  ('Colin Mann', 'u8 Cricket', 'Tshepiso', 'term3'),
  ('Colin Mann', 'u9 Cricket', 'Harnu', 'term3'),
  ('Colin Mann', 'u10 Cricket', 'Remi', 'term3'),
  ('Colin Mann', '2nd Team Cricket', 'Busani', 'term3'),
  ('St Francis', 'u15 Football', 'Bahle', 'term3'),
  ('St Francis', 'u17 Football', 'Mahlatsi', 'term3'),
  ('St Francis', 'u19 Football', 'Kamohelo', 'term3'),
  ('Carlswald', 'Hockey', 'Khanya', 'term3'),
  ('Crawford Sandton', 'Hockey', 'Jean', 'term3'),
  ('Crawford Sandton', 'Hockey', 'Jolie', 'term3'),
  ('Generation Schools', 'Jnr Football', 'Sanele', 'term3'),
  ('Generation Schools', 'Snr Football', 'Sanele', 'term3'),
  ('Generation Schools', 'HS Football', 'Tshepiso', 'term3'),
  ('Generation Schools', 'Jnr Netball', 'Elizabeth', 'term3'),
  ('Generation Schools', 'Snr Netball', 'Elizabeth', 'term3'),
  ('Generation Schools', 'HS Netball', 'Azande', 'term3'),
  ('Lion Pride Academy', 'u7 Boys Soccer', 'Siseko', 'term3'),
  ('Lion Pride Academy', 'u9 Boys Soccer', 'Mamello', 'term3'),
  ('Lion Pride Academy', 'u11 Boys Soccer', 'Nosipho', 'term3'),
  ('Lion Pride Academy', 'u11 Girls Netball', 'Deon', 'term3'),
  ('Lion Pride Academy', 'Gr1-3 Tennis', 'Deon', 'term3'),
  ('Lion Pride Academy', 'GR4-9 Tennis', 'Kabelo', 'term3'),
  ('Lion Pride Academy', 'Gr1-3 Touch Rugby', 'Welcome', 'term3'),
  ('Lion Pride Academy', 'GR4-9 Touch Rugby', 'Edgar', 'term3'),
  ('Lion Pride Academy', 'Gr6-9 Girls Soccer', 'Siseko', 'term3'),
  ('Sandton Sinai', 'Soccer', 'Mikael', 'term3'),
  ('Sandton Sinai', 'Soccer', 'Jerome', 'term3'),
  ('Sandton Sinai', 'Soccer', 'Ross', 'term3'),
  ('Sandton Sinai', 'Table Tennis', 'Breyton', 'term3'),
  ('Sandton Sinai', 'Cricket', 'Jerome', 'term3'),
  ('Sandton Sinai', 'Rugby', 'Nhlanhla', 'term3'),
  ('Rallim', 'Hockey & Football', 'Akimi', 'term3'),
  ('Rallim', 'Hockey', 'Shalom', 'term3'),
  ('Rallim', 'Hockey & Football', 'Dylan', 'term3'),
  ('Rallim', 'Oversee all sport', 'Sergio', 'term3');

-- Leaderboard (Term 3, all coaches at 0 points)
INSERT INTO live_log (entity_name, points, term) VALUES
  ('Abbey', 0, 'term3'),
  ('Akimi', 0, 'term3'),
  ('Azande', 0, 'term3'),
  ('Bahle', 0, 'term3'),
  ('Breyton', 0, 'term3'),
  ('Busani', 0, 'term3'),
  ('Daniel', 0, 'term3'),
  ('Deon', 0, 'term3'),
  ('Dylan', 0, 'term3'),
  ('Edgar', 0, 'term3'),
  ('Elizabeth', 0, 'term3'),
  ('Harnu', 0, 'term3'),
  ('Jean', 0, 'term3'),
  ('Jerome', 0, 'term3'),
  ('Jolie', 0, 'term3'),
  ('Justin', 0, 'term3'),
  ('Kabelo', 0, 'term3'),
  ('Kamohelo', 0, 'term3'),
  ('Keatlegile', 0, 'term3'),
  ('Khanya', 0, 'term3'),
  ('Lasley', 0, 'term3'),
  ('Lebogang', 0, 'term3'),
  ('Lungile', 0, 'term3'),
  ('Mahlatsi', 0, 'term3'),
  ('Mamello', 0, 'term3'),
  ('Mikael', 0, 'term3'),
  ('Mpho', 0, 'term3'),
  ('Musa', 0, 'term3'),
  ('Na''eel', 0, 'term3'),
  ('Nhlanhla', 0, 'term3'),
  ('Nosipho', 0, 'term3'),
  ('Paballo', 0, 'term3'),
  ('Remi', 0, 'term3'),
  ('Ross', 0, 'term3'),
  ('Samokelo', 0, 'term3'),
  ('Sanele', 0, 'term3'),
  ('Sergio', 0, 'term3'),
  ('Shalom', 0, 'term3'),
  ('Sipho', 0, 'term3'),
  ('Siseko', 0, 'term3'),
  ('Tapiwa', 0, 'term3'),
  ('Thembi', 0, 'term3'),
  ('Tshepiso', 0, 'term3'),
  ('Welcome', 0, 'term3');

-- Site settings
INSERT INTO site_settings (key, value) VALUES ('calendarVisible', 'false')
  ON CONFLICT (key) DO NOTHING;
