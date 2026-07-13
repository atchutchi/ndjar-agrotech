CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "subscriptions"
		WHERE "starts_at" >= "expires_at"
	) THEN
		RAISE EXCEPTION 'Existem subscricoes com periodo vazio ou negativo.';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM "subscriptions" current_subscription
		JOIN "subscriptions" candidate
			ON current_subscription."user_id" = candidate."user_id"
			AND current_subscription."plan_id" = candidate."plan_id"
			AND current_subscription."id" < candidate."id"
		WHERE current_subscription."status" IN ('active', 'trial')
		AND candidate."status" IN ('active', 'trial')
		AND tstzrange(current_subscription."starts_at", current_subscription."expires_at", '[)') &&
			tstzrange(candidate."starts_at", candidate."expires_at", '[)')
	) THEN
		RAISE EXCEPTION 'Existem subscricoes activas ou em teste sobrepostas para o mesmo utilizador e plano.';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_positive_period" CHECK ("subscriptions"."starts_at" < "subscriptions"."expires_at");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_no_active_plan_overlap" EXCLUDE USING gist (
	"user_id" WITH =,
	"plan_id" WITH =,
	tstzrange("starts_at", "expires_at", '[)') WITH &&
) WHERE ("status" IN ('active', 'trial'));
