CREATE TYPE "public"."events_status" AS ENUM('DRAFT', 'PUBLISHED', 'CANCELED');--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"date" timestamp NOT NULL,
	"location" varchar(255) NOT NULL,
	"capacity" integer NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"status" "events_status" DEFAULT 'DRAFT' NOT NULL,
	"organizer_id" uuid NOT NULL,
	"create_at" timestamp DEFAULT now() NOT NULL,
	"update_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;