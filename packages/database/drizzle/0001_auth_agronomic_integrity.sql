ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parent_token_fk" FOREIGN KEY ("parent_token_id") REFERENCES "public"."refresh_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profiles_phone_number_hash_idx" ON "user_profiles" USING btree ("phone_number_hash");--> statement-breakpoint
CREATE INDEX "verification_codes_target_lookup_idx" ON "verification_codes" USING btree ("target_hash","purpose","consumed_at","expires_at");--> statement-breakpoint
CREATE INDEX "verification_codes_user_purpose_idx" ON "verification_codes" USING btree ("user_id","purpose");--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "soil_samples"
    WHERE "ph" IS NOT NULL
      AND NOT (
        ("ph" >= 0 AND "ph" < 4.5 AND "ph_class" = 'strongly-acidic') OR
        ("ph" >= 4.5 AND "ph" < 5.5 AND "ph_class" = 'acidic') OR
        ("ph" >= 5.5 AND "ph" < 6.5 AND "ph_class" = 'slightly-acidic') OR
        ("ph" >= 6.5 AND "ph" <= 7.5 AND "ph_class" = 'neutral') OR
        ("ph" > 7.5 AND "ph" <= 14 AND "ph_class" = 'alkaline')
      )
  ) THEN
    RAISE EXCEPTION 'soil_samples contem pH e classe contraditorios; corrija os dados antes de migrar';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "soil_samples" ADD CONSTRAINT "soil_samples_ph_class_matches_value" CHECK ("soil_samples"."ph" is null or (
        ("soil_samples"."ph" >= 0 and "soil_samples"."ph" < 4.5 and "soil_samples"."ph_class" = 'strongly-acidic') or
        ("soil_samples"."ph" >= 4.5 and "soil_samples"."ph" < 5.5 and "soil_samples"."ph_class" = 'acidic') or
        ("soil_samples"."ph" >= 5.5 and "soil_samples"."ph" < 6.5 and "soil_samples"."ph_class" = 'slightly-acidic') or
        ("soil_samples"."ph" >= 6.5 and "soil_samples"."ph" <= 7.5 and "soil_samples"."ph_class" = 'neutral') or
        ("soil_samples"."ph" > 7.5 and "soil_samples"."ph" <= 14 and "soil_samples"."ph_class" = 'alkaline')
      ));
