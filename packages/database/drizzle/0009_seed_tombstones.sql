CREATE TABLE "seed_tombstones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seed_key" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"removed_in_version" integer NOT NULL,
	"removed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seed_tombstones_version_positive" CHECK ("seed_tombstones"."removed_in_version" >= 1)
);
--> statement-breakpoint
ALTER TABLE "seed_manifests" ADD COLUMN "entity_ids" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "seed_tombstones" ADD CONSTRAINT "seed_tombstones_seed_key_seed_manifests_key_fk" FOREIGN KEY ("seed_key") REFERENCES "public"."seed_manifests"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "seed_tombstones_entity_unique" ON "seed_tombstones" USING btree ("seed_key","entity_type","entity_id");--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_seed_tombstone_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'Tombstones de seed sao imutaveis. Declare uma nova versao do manifesto.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER seed_tombstone_immutable_guard
BEFORE UPDATE OR DELETE ON "seed_tombstones"
FOR EACH ROW EXECUTE FUNCTION prevent_seed_tombstone_mutation();
