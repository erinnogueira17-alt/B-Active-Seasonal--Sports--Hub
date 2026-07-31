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