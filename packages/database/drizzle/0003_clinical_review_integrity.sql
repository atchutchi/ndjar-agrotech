CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TABLE "answer_template_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_template_id" text NOT NULL,
	"version" integer NOT NULL,
	"trigger_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer_text" text NOT NULL,
	"content_hash" text NOT NULL,
	"deterministic_priority" integer DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"reviewed_by_user_id" uuid NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_template_versions_version_positive" CHECK ("answer_template_versions"."version" >= 1),
	CONSTRAINT "answer_template_versions_content_hash_format" CHECK ("answer_template_versions"."content_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "consultation_responses" DROP CONSTRAINT "consultation_responses_template_traceability";--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD COLUMN "answer_template_version_id" uuid;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD COLUMN "answer_snapshot" text;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD COLUMN "answer_snapshot_hash" text;--> statement-breakpoint
ALTER TABLE "answer_template_versions" ADD CONSTRAINT "answer_template_versions_answer_template_id_answer_templates_id_fk" FOREIGN KEY ("answer_template_id") REFERENCES "public"."answer_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_template_versions" ADD CONSTRAINT "answer_template_versions_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_template_versions" ADD CONSTRAINT "answer_template_versions_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "answer_template_versions_template_version_unique" ON "answer_template_versions" USING btree ("answer_template_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "answer_template_versions_template_hash_unique" ON "answer_template_versions" USING btree ("answer_template_id","content_hash");--> statement-breakpoint
CREATE INDEX "answer_template_versions_active_idx" ON "answer_template_versions" USING btree ("answer_template_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "answer_template_versions_one_active_unique" ON "answer_template_versions" USING btree ("answer_template_id") WHERE "answer_template_versions"."active";--> statement-breakpoint
CREATE INDEX "answer_template_versions_reviewer_idx" ON "answer_template_versions" USING btree ("reviewed_by_user_id");--> statement-breakpoint
CREATE INDEX "answer_template_versions_source_idx" ON "answer_template_versions" USING btree ("source_id");--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_answer_template_version_id_answer_template_versions_id_fk" FOREIGN KEY ("answer_template_version_id") REFERENCES "public"."answer_template_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultation_responses_template_version_idx" ON "consultation_responses" USING btree ("answer_template_version_id");--> statement-breakpoint
INSERT INTO "roles" ("id", "label", "description") VALUES
	('medical_consultant', 'Consultor medico agricola', 'Pode rever conteudo clinico e responder a consultas.')
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
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
		SELECT 1
		FROM "answer_templates" template
		WHERE template."active" = true
		AND NOT EXISTS (
			SELECT 1
			FROM "user_roles" reviewer_role
			WHERE reviewer_role."user_id" = template."reviewed_by_user_id"
			AND reviewer_role."role_id" IN ('agricultural_doctor', 'medical_consultant', 'admin', 'super_admin')
		)
	) THEN
		RAISE EXCEPTION 'Existem templates activos sem revisor agricola, medical_consultant, admin ou super_admin.';
	END IF;
END $$;--> statement-breakpoint
INSERT INTO "answer_template_versions" (
	"answer_template_id",
	"version",
	"trigger_terms",
	"answer_text",
	"content_hash",
	"deterministic_priority",
	"active",
	"reviewed_by_user_id",
	"reviewed_at",
	"source_status",
	"source_id",
	"created_at",
	"updated_at"
)
SELECT
	template."id",
	template."review_version",
	template."trigger_terms",
	template."answer_text",
	encode(digest(template."answer_text", 'sha256'), 'hex'),
	template."deterministic_priority",
	true,
	template."reviewed_by_user_id",
	template."reviewed_at",
	template."source_status",
	template."source_id",
	template."created_at",
	template."updated_at"
FROM "answer_templates" template
WHERE template."active" = true;--> statement-breakpoint
UPDATE "consultation_responses" response
SET
	"answer_template_version_id" = version."id",
	"answer_snapshot" = version."answer_text",
	"answer_snapshot_hash" = version."content_hash"
FROM "answer_template_versions" version
WHERE response."response_type" = 'deterministic_template'
	AND response."answer_template_id" = version."answer_template_id"
	AND version."active" = true;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "consultation_responses"
		WHERE "response_type" = 'deterministic_template'
		AND "answer_template_version_id" IS NULL
	) THEN
		RAISE EXCEPTION 'Existem respostas deterministicas sem versao clinica activa migravel.';
	END IF;
END $$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION validate_answer_template_version_review()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'INSERT' OR NEW."active" = true THEN
		IF NOT EXISTS (
			SELECT 1
			FROM "user_roles"
			WHERE "user_id" = NEW."reviewed_by_user_id"
			AND "role_id" IN ('agricultural_doctor', 'medical_consultant', 'admin', 'super_admin')
		) THEN
			RAISE EXCEPTION 'O revisor tem de ser agricultural_doctor, medical_consultant, admin ou super_admin.';
		END IF;
	END IF;

	IF NEW."content_hash" IS DISTINCT FROM encode(digest(NEW.answer_text, 'sha256'), 'hex') THEN
		RAISE EXCEPTION 'O hash da versao clinica nao corresponde ao conteudo aprovado.';
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER answer_template_version_review_guard
BEFORE INSERT OR UPDATE ON "answer_template_versions"
FOR EACH ROW EXECUTE FUNCTION validate_answer_template_version_review();--> statement-breakpoint
CREATE OR REPLACE FUNCTION protect_answer_template_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	IF TG_OP = 'DELETE' THEN
		RAISE EXCEPTION 'Versoes clinicas revistas nao podem ser apagadas.';
	END IF;

	IF OLD."answer_template_id" IS DISTINCT FROM NEW."answer_template_id"
		OR OLD."version" IS DISTINCT FROM NEW."version"
		OR OLD."trigger_terms" IS DISTINCT FROM NEW."trigger_terms"
		OR OLD."answer_text" IS DISTINCT FROM NEW."answer_text"
		OR OLD."content_hash" IS DISTINCT FROM NEW."content_hash"
		OR OLD."deterministic_priority" IS DISTINCT FROM NEW."deterministic_priority"
		OR OLD."reviewed_by_user_id" IS DISTINCT FROM NEW."reviewed_by_user_id"
		OR OLD."reviewed_at" IS DISTINCT FROM NEW."reviewed_at"
		OR OLD."source_status" IS DISTINCT FROM NEW."source_status"
		OR OLD."source_id" IS DISTINCT FROM NEW."source_id"
		OR OLD."created_at" IS DISTINCT FROM NEW."created_at"
	THEN
		RAISE EXCEPTION 'O conteudo, revisao e proveniencia de uma versao clinica sao imutaveis.';
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER answer_template_version_immutable_guard
BEFORE UPDATE OR DELETE ON "answer_template_versions"
FOR EACH ROW EXECUTE FUNCTION protect_answer_template_version();--> statement-breakpoint
CREATE OR REPLACE FUNCTION validate_deterministic_response_snapshot()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
	approved "answer_template_versions"%ROWTYPE;
BEGIN
	IF NEW."response_type" = 'deterministic_template' THEN
		SELECT * INTO approved
		FROM "answer_template_versions"
		WHERE "id" = NEW."answer_template_version_id"
		AND "active" = true;

		IF NOT FOUND THEN
			RAISE EXCEPTION 'A resposta deterministica exige uma versao clinica activa e revista.';
		END IF;

		IF NEW."answer_template_id" IS DISTINCT FROM approved."answer_template_id"
			OR NEW."answer_snapshot" IS DISTINCT FROM approved."answer_text"
			OR NEW."answer_snapshot_hash" IS DISTINCT FROM approved."content_hash"
			OR NEW."body" IS DISTINCT FROM approved."answer_text"
		THEN
			RAISE EXCEPTION 'O snapshot da resposta nao corresponde a versao clinica aprovada.';
		END IF;
	END IF;

	RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER consultation_response_snapshot_guard
BEFORE INSERT OR UPDATE ON "consultation_responses"
FOR EACH ROW EXECUTE FUNCTION validate_deterministic_response_snapshot();--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_agronomic_source_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'A proveniencia agronomica e imutavel. Crie uma nova fonte versionada.';
END;
$$;--> statement-breakpoint
CREATE TRIGGER agronomic_source_immutable_guard
BEFORE UPDATE OR DELETE ON "agronomic_sources"
FOR EACH ROW EXECUTE FUNCTION prevent_agronomic_source_mutation();--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_snapshot_hash_format" CHECK ("consultation_responses"."answer_snapshot_hash" is null or "consultation_responses"."answer_snapshot_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_template_traceability" CHECK ("consultation_responses"."response_type" <> 'deterministic_template' or ("consultation_responses"."answer_template_id" is not null and "consultation_responses"."answer_template_version_id" is not null and "consultation_responses"."answer_snapshot" is not null and "consultation_responses"."answer_snapshot_hash" is not null and "consultation_responses"."body" = "consultation_responses"."answer_snapshot"));
