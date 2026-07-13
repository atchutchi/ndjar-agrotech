CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'publish', 'login', 'logout', 'payment_confirmed');--> statement-breakpoint
CREATE TYPE "public"."auth_provider" AS ENUM('password', 'sms_code', 'admin_invite');--> statement-breakpoint
CREATE TYPE "public"."calendar_task_type" AS ENUM('preparation', 'planting', 'weeding', 'harvest', 'threshing');--> statement-breakpoint
CREATE TYPE "public"."community_group_type" AS ENUM('area', 'crop_presence', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."consultation_channel" AS ENUM('mobile', 'web', 'ussd', 'admin');--> statement-breakpoint
CREATE TYPE "public"."consultation_response_type" AS ENUM('deterministic_template', 'doctor_response', 'admin_note');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('draft', 'pending_review', 'answered_by_template', 'escalated', 'answered_by_doctor', 'closed');--> statement-breakpoint
CREATE TYPE "public"."escalation_reason" AS ENUM('reviewed_answer_available', 'chemical_or_dosage_risk', 'severe_pest_risk', 'no_safe_answer');--> statement-breakpoint
CREATE TYPE "public"."month_name" AS ENUM('September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August');--> statement-breakpoint
CREATE TYPE "public"."notification_job_status" AS ENUM('pending', 'claimed', 'sent', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_job_type" AS ENUM('doctor_escalation_due', 'consultation_reply', 'offline_sync_reminder', 'ussd_follow_up');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'failed', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."ph_class" AS ENUM('strongly-acidic', 'acidic', 'slightly-acidic', 'neutral', 'alkaline');--> statement-breakpoint
CREATE TYPE "public"."ph_method" AS ENUM('water', 'calcium_chloride', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."season" AS ENUM('rainy', 'dry');--> statement-breakpoint
CREATE TYPE "public"."source_confidence" AS ENUM('unknown', 'low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."agronomic_source_status" AS ENUM('example', 'estimated', 'field_observed', 'self_reported', 'lab_validated', 'consultant_reviewed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'past_due', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_channel" AS ENUM('mobile', 'web', 'ussd', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('farmer', 'agricultural_doctor', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."ussd_session_status" AS ENUM('active', 'completed', 'expired', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."verification_purpose" AS ENUM('account_verification', 'password_reset', 'phone_change');--> statement-breakpoint
CREATE TABLE "agronomic_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"document_title" text NOT NULL,
	"document_date_text" text NOT NULL,
	"responsible_name" text NOT NULL,
	"confidence" "source_confidence" DEFAULT 'unknown' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agronomic_sources_version_positive" CHECK ("agronomic_sources"."version" >= 1)
);
--> statement-breakpoint
CREATE TABLE "answer_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text,
	"region_id" text,
	"language" text DEFAULT 'pt' NOT NULL,
	"question_key" text NOT NULL,
	"trigger_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer_text" text NOT NULL,
	"deterministic_priority" integer DEFAULT 100 NOT NULL,
	"requires_doctor_review" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"review_version" integer,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "answer_templates_active_requires_review" CHECK (not "answer_templates"."active" or ("answer_templates"."reviewed_by_user_id" is not null and "answer_templates"."reviewed_at" is not null and "answer_templates"."review_version" >= 1))
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"summary" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "auth_provider" DEFAULT 'password' NOT NULL,
	"login_identifier_hash" text NOT NULL,
	"password_hash" text,
	"last_login_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"region_id" text,
	"crop_id" text,
	"month" "month_name" NOT NULL,
	"season" "season" NOT NULL,
	"task_type" "calendar_task_type" NOT NULL,
	"summary" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "communities" (
	"id" text PRIMARY KEY NOT NULL,
	"region_id" text NOT NULL,
	"name" text NOT NULL,
	"area_hectares" double precision,
	"area_hectares_source_status" "agronomic_source_status" NOT NULL,
	"area_hectares_source_group_id" text,
	"parcel_size_hectares" double precision,
	"production_mode" text,
	"chemical_use" text,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"centroid" geometry(Point, 4326),
	"centroid_source_status" "agronomic_source_status",
	"boundary" geometry(MultiPolygon, 4326),
	"boundary_source_status" "agronomic_source_status",
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_group_members" (
	"id" text PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"community_id" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"region_id" text NOT NULL,
	"group_type" "community_group_type" NOT NULL,
	"label" text NOT NULL,
	"area_hectares" double precision,
	"parcel_size_hectares" double precision,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"geometry" geometry(Polygon, 4326),
	"geometry_source_status" "agronomic_source_status",
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"answer_template_id" text,
	"responder_user_id" uuid,
	"response_type" "consultation_response_type" NOT NULL,
	"body" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"delivered_at" timestamp with time zone,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultation_responses_template_traceability" CHECK ("consultation_responses"."response_type" <> 'deterministic_template' or "consultation_responses"."answer_template_id" is not null),
	CONSTRAINT "consultation_responses_doctor_traceability" CHECK ("consultation_responses"."response_type" <> 'doctor_response' or "consultation_responses"."responder_user_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"region_id" text,
	"community_id" text,
	"crop_id" text,
	"ussd_session_id" text,
	"channel" "consultation_channel" DEFAULT 'mobile' NOT NULL,
	"language" text DEFAULT 'pt' NOT NULL,
	"question_text" text NOT NULL,
	"normalized_question_text" text,
	"matched_risk_terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "consultation_status" DEFAULT 'pending_review' NOT NULL,
	"escalation_reason" "escalation_reason",
	"escalated_at" timestamp with time zone,
	"escalation_due_at" timestamp with time zone,
	"assigned_doctor_id" uuid,
	"selected_answer_template_id" text,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_agronomic_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text NOT NULL,
	"community_id" text,
	"note" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_presence" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text NOT NULL,
	"community_id" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"source_group_id" text,
	"observed_at" timestamp with time zone,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_presence_group_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text NOT NULL,
	"group_id" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"observed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_production_evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"crop_id" text NOT NULL,
	"annual_bags_minimum" integer NOT NULL,
	"annual_bags_unit" text NOT NULL,
	"bag_weight_kg" double precision NOT NULL,
	"use_cases" jsonb NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crops" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"feature_key" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid,
	"user_id" uuid,
	"ussd_session_id" text,
	"job_type" "notification_job_type" NOT NULL,
	"channel" "user_channel" NOT NULL,
	"status" "notification_job_status" DEFAULT 'pending' NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"plan_id" text,
	"amount_xof" integer NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"external_reference" text,
	"confirmed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_providers" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"logo_storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"price_xof" integer NOT NULL,
	"interval" text DEFAULT 'month' NOT NULL,
	"included_consultations" integer DEFAULT 3 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"family_id" uuid NOT NULL,
	"parent_token_id" uuid,
	"user_agent" text,
	"ip_hash" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"region_name" text NOT NULL,
	"sector_name" text NOT NULL,
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"centroid" geometry(Point, 4326),
	"centroid_source_status" "agronomic_source_status",
	"boundary" geometry(MultiPolygon, 4326),
	"boundary_source_status" "agronomic_source_status",
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soil_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"region_id" text,
	"community_id" text,
	"ph" double precision,
	"ph_class" "ph_class",
	"ph_method" "ph_method" DEFAULT 'unknown' NOT NULL,
	"collected_at" timestamp with time zone,
	"collected_at_text" text,
	"depth_cm" double precision,
	"location" geometry(Point, 4326),
	"location_source_status" "agronomic_source_status",
	"source_status" "agronomic_source_status" NOT NULL,
	"source_id" text NOT NULL,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "soil_samples_ph_range" CHECK ("soil_samples"."ph" is null or ("soil_samples"."ph" >= 0 and "soil_samples"."ph" <= 14)),
	CONSTRAINT "soil_samples_ph_class_coherence" CHECK (("soil_samples"."ph" is null and "soil_samples"."ph_class" is null) or ("soil_samples"."ph" is not null and "soil_samples"."ph_class" is not null)),
	CONSTRAINT "soil_samples_depth_non_negative" CHECK ("soil_samples"."depth_cm" is null or "soil_samples"."depth_cm" >= 0)
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"full_name" text,
	"email" text,
	"phone_number_hash" text,
	"phone_country_code" text DEFAULT '245' NOT NULL,
	"region_id" text,
	"community_id" text,
	"preferred_language" text DEFAULT 'pt' NOT NULL,
	"avatar_storage_key" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" text NOT NULL,
	"assigned_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text,
	"role" "user_role" DEFAULT 'farmer' NOT NULL,
	"preferred_channel" "user_channel" DEFAULT 'mobile' NOT NULL,
	"preferred_language" text DEFAULT 'pt' NOT NULL,
	"phone_number_hash" text,
	"community_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ussd_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"phone_number_hash" text,
	"route" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"current_screen" text,
	"depth" integer DEFAULT 0 NOT NULL,
	"phase" text DEFAULT 'phase_2_placeholder' NOT NULL,
	"status" "ussd_session_status" DEFAULT 'active' NOT NULL,
	"last_inbound_text" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"offline_client_id" text,
	"offline_device_id" text,
	"local_revision" text,
	"last_synced_at" timestamp with time zone,
	"sync_version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"purpose" "verification_purpose" NOT NULL,
	"target_hash" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "answer_templates" ADD CONSTRAINT "answer_templates_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_templates" ADD CONSTRAINT "answer_templates_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_templates" ADD CONSTRAINT "answer_templates_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_templates" ADD CONSTRAINT "answer_templates_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_tasks" ADD CONSTRAINT "calendar_tasks_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_tasks" ADD CONSTRAINT "calendar_tasks_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_tasks" ADD CONSTRAINT "calendar_tasks_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_area_hectares_source_group_id_community_groups_id_fk" FOREIGN KEY ("area_hectares_source_group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_group_members" ADD CONSTRAINT "community_group_members_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_groups" ADD CONSTRAINT "community_groups_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_answer_template_id_answer_templates_id_fk" FOREIGN KEY ("answer_template_id") REFERENCES "public"."answer_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_responder_user_id_users_id_fk" FOREIGN KEY ("responder_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_responses" ADD CONSTRAINT "consultation_responses_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_ussd_session_id_ussd_sessions_id_fk" FOREIGN KEY ("ussd_session_id") REFERENCES "public"."ussd_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assigned_doctor_id_users_id_fk" FOREIGN KEY ("assigned_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_selected_answer_template_id_answer_templates_id_fk" FOREIGN KEY ("selected_answer_template_id") REFERENCES "public"."answer_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_agronomic_notes" ADD CONSTRAINT "crop_agronomic_notes_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_agronomic_notes" ADD CONSTRAINT "crop_agronomic_notes_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_agronomic_notes" ADD CONSTRAINT "crop_agronomic_notes_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence" ADD CONSTRAINT "crop_presence_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence" ADD CONSTRAINT "crop_presence_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence" ADD CONSTRAINT "crop_presence_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence" ADD CONSTRAINT "crop_presence_source_group_id_community_groups_id_fk" FOREIGN KEY ("source_group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence_group_observations" ADD CONSTRAINT "crop_presence_group_observations_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence_group_observations" ADD CONSTRAINT "crop_presence_group_observations_group_id_community_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."community_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_presence_group_observations" ADD CONSTRAINT "crop_presence_group_observations_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_production_evidence" ADD CONSTRAINT "crop_production_evidence_crop_id_crops_id_fk" FOREIGN KEY ("crop_id") REFERENCES "public"."crops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crop_production_evidence" ADD CONSTRAINT "crop_production_evidence_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crops" ADD CONSTRAINT "crops_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_id_user_id_unique" ON "subscriptions" USING btree ("id","user_id");--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_subscription_user_fk" FOREIGN KEY ("subscription_id","user_id") REFERENCES "public"."subscriptions"("id","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_jobs" ADD CONSTRAINT "notification_jobs_ussd_session_id_ussd_sessions_id_fk" FOREIGN KEY ("ussd_session_id") REFERENCES "public"."ussd_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_provider_id_payment_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."payment_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "regions" ADD CONSTRAINT "regions_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_samples" ADD CONSTRAINT "soil_samples_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_samples" ADD CONSTRAINT "soil_samples_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soil_samples" ADD CONSTRAINT "soil_samples_source_id_agronomic_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."agronomic_sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ussd_sessions" ADD CONSTRAINT "ussd_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "answer_templates_source_id_idx" ON "answer_templates" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "answer_templates_reviewed_by_idx" ON "answer_templates" USING btree ("reviewed_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auth_accounts_provider_login_identifier_hash_unique" ON "auth_accounts" USING btree ("provider","login_identifier_hash");--> statement-breakpoint
CREATE INDEX "consultation_responses_consultation_idx" ON "consultation_responses" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "consultation_responses_source_id_idx" ON "consultation_responses" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crop_presence_crop_community_unique" ON "crop_presence" USING btree ("crop_id","community_id");--> statement-breakpoint
CREATE INDEX "crop_presence_source_group_idx" ON "crop_presence" USING btree ("source_group_id");--> statement-breakpoint
CREATE INDEX "crop_presence_source_id_idx" ON "crop_presence" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entitlements_subscription_feature_unique" ON "entitlements" USING btree ("subscription_id","feature_key");--> statement-breakpoint
CREATE INDEX "entitlements_user_active_idx" ON "entitlements" USING btree ("user_id","active");--> statement-breakpoint
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "soil_samples_region_id_idx" ON "soil_samples" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "soil_samples_community_id_idx" ON "soil_samples" USING btree ("community_id");--> statement-breakpoint
CREATE INDEX "soil_samples_source_id_idx" ON "soil_samples" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_validity_idx" ON "subscriptions" USING btree ("user_id","status","starts_at","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_roles_user_id_role_id_unique" ON "user_roles" USING btree ("user_id","role_id");
