ALTER TABLE "consultation_responses" DROP CONSTRAINT "consultation_responses_template_traceability";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "consultation_responses" response
		JOIN "answer_template_versions" approved
			ON approved."id" = response."answer_template_version_id"
		WHERE response."response_type" = 'deterministic_template'
		AND response."answer_template_id" IS DISTINCT FROM approved."answer_template_id"
	) THEN
		RAISE EXCEPTION 'Existem respostas deterministicas ligadas a um template diferente da versao aprovada.';
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
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_template_traceability" CHECK ("consultation_responses"."response_type" <> 'deterministic_template' or ("consultation_responses"."answer_template_id" is not null and "consultation_responses"."answer_template_version_id" is not null and "consultation_responses"."answer_snapshot" is not null and "consultation_responses"."answer_snapshot_hash" is not null and "consultation_responses"."body" = "consultation_responses"."answer_snapshot"));
