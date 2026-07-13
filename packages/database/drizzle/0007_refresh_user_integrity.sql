ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_parent_family_fk";
--> statement-breakpoint
DROP INDEX "refresh_tokens_id_family_id_unique";--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM "refresh_tokens" child
		JOIN "refresh_tokens" parent ON parent."id" = child."parent_token_id"
		WHERE child."user_id" IS DISTINCT FROM parent."user_id"
		OR child."family_id" IS DISTINCT FROM parent."family_id"
	) THEN
		RAISE EXCEPTION 'Existem refresh tokens cujo pai pertence a outro utilizador ou familia.';
	END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX "refresh_tokens_id_family_id_user_id_unique" ON "refresh_tokens" USING btree ("id","family_id","user_id");--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parent_family_user_fk" FOREIGN KEY ("parent_token_id","family_id","user_id") REFERENCES "public"."refresh_tokens"("id","family_id","user_id") ON DELETE no action ON UPDATE no action;
