DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "subscriptions" current_subscription
		JOIN "subscriptions" candidate
			ON current_subscription."user_id" = candidate."user_id"
			AND current_subscription."id" < candidate."id"
		WHERE current_subscription."status" IN ('active', 'trial')
		AND candidate."status" IN ('active', 'trial')
		AND tstzrange(current_subscription."starts_at", current_subscription."expires_at", '[)') &&
			tstzrange(candidate."starts_at", candidate."expires_at", '[)')
	) THEN
		RAISE EXCEPTION 'Existem subscricoes validas sobrepostas para o mesmo utilizador.';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_no_active_plan_overlap";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_no_active_user_overlap" EXCLUDE USING gist (
	"user_id" WITH =,
	tstzrange("starts_at", "expires_at", '[)') WITH &&
) WHERE ("status" IN ('active', 'trial'));
