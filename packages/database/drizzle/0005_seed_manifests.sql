CREATE TABLE "seed_manifests" (
	"key" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"content_hash" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seed_manifests_version_positive" CHECK ("seed_manifests"."version" >= 1),
	CONSTRAINT "seed_manifests_content_hash_format" CHECK ("seed_manifests"."content_hash" ~ '^[0-9a-f]{64}$')
);
