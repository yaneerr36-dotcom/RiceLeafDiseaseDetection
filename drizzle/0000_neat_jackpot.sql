CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_id" integer,
	"farmer_name" text NOT NULL,
	"phone" text,
	"location" text NOT NULL,
	"disease_name" text,
	"question" text NOT NULL,
	"urgency" text DEFAULT 'Medium' NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"image_name" text DEFAULT 'leaf.jpg' NOT NULL,
	"disease_id" text NOT NULL,
	"disease_name" text NOT NULL,
	"confidence" real NOT NULL,
	"severity" text DEFAULT 'Moderate' NOT NULL,
	"severity_score" integer DEFAULT 50 NOT NULL,
	"leaf_health_score" integer DEFAULT 70 NOT NULL,
	"affected_area" real DEFAULT 12 NOT NULL,
	"location" text DEFAULT 'Dhaka, Bangladesh',
	"farmer_name" text DEFAULT 'Guest Farmer',
	"field_id" text DEFAULT 'Field A-12',
	"notes" text,
	"is_healthy" boolean DEFAULT false NOT NULL,
	"feedback" text,
	"top_predictions" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
