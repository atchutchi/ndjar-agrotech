ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_parent_token_fk";--> statement-breakpoint
INSERT INTO "roles" ("id", "label", "description")
SELECT DISTINCT
	"role"::text,
	CASE "role"::text
		WHEN 'farmer' THEN 'Agricultor'
		WHEN 'agricultural_doctor' THEN 'Medico Agricola'
		WHEN 'admin' THEN 'Administrador'
		WHEN 'super_admin' THEN 'Super Administrador'
	END,
	'Papel preservado durante a migracao de users.role para user_roles.'
FROM "users"
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "user_roles" ("user_id", "role_id")
SELECT "id", "role"::text
FROM "users"
ON CONFLICT ("user_id", "role_id") DO NOTHING;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT "family_id"
		FROM "refresh_tokens"
		GROUP BY "family_id"
		HAVING count(*) FILTER (WHERE "parent_token_id" IS NULL) <> 1
	) THEN
		RAISE EXCEPTION 'Cada familia de refresh tokens tem de possuir exactamente uma raiz antes da migracao.';
	END IF;
END $$;--> statement-breakpoint
WITH normalized_refresh_families AS (
	SELECT "family_id" AS "legacy_family_id", "id" AS "root_id"
	FROM "refresh_tokens"
	WHERE "parent_token_id" IS NULL
)
UPDATE "refresh_tokens" token
SET "family_id" = family."root_id"
FROM normalized_refresh_families family
WHERE token."family_id" = family."legacy_family_id";--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_id_family_id_unique" ON "refresh_tokens" USING btree ("id","family_id");--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_family_root_fk" FOREIGN KEY ("family_id") REFERENCES "public"."refresh_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parent_family_fk" FOREIGN KEY ("parent_token_id","family_id") REFERENCES "public"."refresh_tokens"("id","family_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_root_family_coherence" CHECK ("refresh_tokens"."parent_token_id" is not null or "refresh_tokens"."family_id" = "refresh_tokens"."id");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";
