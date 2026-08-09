CREATE TABLE "variety_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"variety_id" text NOT NULL,
	"conventional_price_per_kg" double precision NOT NULL,
	"bio_price_per_kg" double precision,
	"effective_from" timestamp with time zone NOT NULL,
	"source" text DEFAULT 'reference' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "harvests" DROP COLUMN "conventional_price_per_kg";--> statement-breakpoint
ALTER TABLE "harvests" DROP COLUMN "bio_price_per_kg";