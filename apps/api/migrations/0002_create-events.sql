CREATE TABLE "events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"discipline_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"site" varchar(50) NOT NULL,
	"starts_at" timestamp (3) with time zone NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "events_site_check" CHECK ("events"."site" IN ('dakar', 'diamniadio', 'saly')),
	CONSTRAINT "events_status_check" CHECK ("events"."status" IN ('scheduled', 'in-progress', 'finished'))
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_discipline_id_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."disciplines"("id") ON DELETE no action ON UPDATE no action;