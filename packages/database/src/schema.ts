import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import {
  boolean,
  customType,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const sourceStatusEnum = pgEnum(
  "agronomic_source_status",
  AGRONOMIC_SOURCE_STATUSES,
);

export const userRoleEnum = pgEnum("user_role", [
  "farmer",
  "agricultural_doctor",
  "admin",
]);
export const userChannelEnum = pgEnum("user_channel", [
  "mobile",
  "web",
  "ussd",
  "admin",
]);
export const communityGroupTypeEnum = pgEnum("community_group_type", [
  "area",
  "crop_presence",
  "administrative",
]);
export const phClassEnum = pgEnum("ph_class", [
  "acidic",
  "favorable",
  "near-neutral",
  "neutral",
  "alkaline",
]);
export const phMethodEnum = pgEnum("ph_method", [
  "water",
  "calcium_chloride",
  "unknown",
]);
export const seasonEnum = pgEnum("season", ["rainy", "dry"]);
export const calendarTaskTypeEnum = pgEnum("calendar_task_type", [
  "preparation",
  "planting",
  "weeding",
  "harvest",
  "threshing",
]);
export const monthEnum = pgEnum("month_name", [
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
]);
export const consultationChannelEnum = pgEnum("consultation_channel", [
  "mobile",
  "web",
  "ussd",
  "admin",
]);
export const consultationStatusEnum = pgEnum("consultation_status", [
  "draft",
  "pending_review",
  "answered_by_template",
  "escalated",
  "answered_by_doctor",
  "closed",
]);
export const escalationReasonEnum = pgEnum("escalation_reason", [
  "reviewed_answer_available",
  "chemical_or_dosage_risk",
  "severe_pest_risk",
  "no_safe_answer",
]);
export const consultationResponseTypeEnum = pgEnum(
  "consultation_response_type",
  ["deterministic_template", "doctor_response", "admin_note"],
);
export const notificationJobStatusEnum = pgEnum("notification_job_status", [
  "pending",
  "claimed",
  "sent",
  "failed",
  "cancelled",
]);
export const notificationJobTypeEnum = pgEnum("notification_job_type", [
  "doctor_escalation_due",
  "consultation_reply",
  "offline_sync_reminder",
  "ussd_follow_up",
]);
export const ussdSessionStatusEnum = pgEnum("ussd_session_status", [
  "active",
  "completed",
  "expired",
  "abandoned",
]);

type PostgisGeometryType = "Point" | "Polygon" | "MultiPolygon";

const postgisGeometry = customType<{
  data: string;
  driverData: string;
  config: { type: PostgisGeometryType; srid?: number };
  configRequired: true;
}>({
  dataType(config) {
    return `geometry(${config.type}, ${config.srid ?? 4326})`;
  },
});

function timestampColumns() {
  return {
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  };
}

function offlineSyncColumns() {
  return {
    offlineClientId: text("offline_client_id"),
    offlineDeviceId: text("offline_device_id"),
    localRevision: text("local_revision"),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    syncVersion: integer("sync_version").default(1).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  };
}

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
  role: userRoleEnum("role").default("farmer").notNull(),
  preferredChannel: userChannelEnum("preferred_channel")
    .default("mobile")
    .notNull(),
  preferredLanguage: text("preferred_language").default("pt").notNull(),
  phoneNumberHash: text("phone_number_hash"),
  communityId: text("community_id").references(() => communities.id),
  isActive: boolean("is_active").default(true).notNull(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const regions = pgTable("regions", {
  id: text("id").primaryKey(),
  regionName: text("region_name").notNull(),
  sectorName: text("sector_name").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  centroid: postgisGeometry("centroid", { type: "Point" }),
  centroidSourceStatus: sourceStatusEnum("centroid_source_status"),
  boundary: postgisGeometry("boundary", { type: "MultiPolygon" }),
  boundarySourceStatus: sourceStatusEnum("boundary_source_status"),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const communityGroups = pgTable("community_groups", {
  id: text("id").primaryKey(),
  regionId: text("region_id")
    .notNull()
    .references(() => regions.id),
  groupType: communityGroupTypeEnum("group_type").notNull(),
  label: text("label").notNull(),
  areaHectares: doublePrecision("area_hectares"),
  parcelSizeHectares: doublePrecision("parcel_size_hectares"),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  geometry: postgisGeometry("geometry", { type: "Polygon" }),
  geometrySourceStatus: sourceStatusEnum("geometry_source_status"),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const communities = pgTable("communities", {
  id: text("id").primaryKey(),
  regionId: text("region_id")
    .notNull()
    .references(() => regions.id),
  name: text("name").notNull(),
  areaHectares: doublePrecision("area_hectares"),
  areaHectaresSourceStatus: sourceStatusEnum(
    "area_hectares_source_status",
  ).notNull(),
  areaHectaresSourceGroupId: text("area_hectares_source_group_id").references(
    () => communityGroups.id,
  ),
  parcelSizeHectares: doublePrecision("parcel_size_hectares"),
  productionMode: text("production_mode"),
  chemicalUse: text("chemical_use"),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  centroid: postgisGeometry("centroid", { type: "Point" }),
  centroidSourceStatus: sourceStatusEnum("centroid_source_status"),
  boundary: postgisGeometry("boundary", { type: "MultiPolygon" }),
  boundarySourceStatus: sourceStatusEnum("boundary_source_status"),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const communityGroupMembers = pgTable("community_group_members", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => communityGroups.id),
  communityId: text("community_id")
    .notNull()
    .references(() => communities.id),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...timestampColumns(),
});

export const crops = pgTable("crops", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const cropPresenceGroupObservations = pgTable(
  "crop_presence_group_observations",
  {
    id: text("id").primaryKey(),
    cropId: text("crop_id")
      .notNull()
      .references(() => crops.id),
    groupId: text("group_id")
      .notNull()
      .references(() => communityGroups.id),
    sourceStatus: sourceStatusEnum("source_status").notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    ...timestampColumns(),
  },
);

export const cropPresence = pgTable("crop_presence", {
  id: text("id").primaryKey(),
  cropId: text("crop_id")
    .notNull()
    .references(() => crops.id),
  communityId: text("community_id")
    .notNull()
    .references(() => communities.id),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  sourceGroupId: text("source_group_id").references(() => communityGroups.id),
  observedAt: timestamp("observed_at", { withTimezone: true }),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const cropProductionEvidence = pgTable("crop_production_evidence", {
  id: text("id").primaryKey(),
  cropId: text("crop_id")
    .notNull()
    .references(() => crops.id),
  annualBagsMinimum: integer("annual_bags_minimum").notNull(),
  annualBagsUnit: text("annual_bags_unit").notNull(),
  bagWeightKg: doublePrecision("bag_weight_kg").notNull(),
  useCases: jsonb("use_cases").$type<string[]>().notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...timestampColumns(),
});

export const cropAgronomicNotes = pgTable("crop_agronomic_notes", {
  id: text("id").primaryKey(),
  cropId: text("crop_id")
    .notNull()
    .references(() => crops.id),
  communityId: text("community_id").references(() => communities.id),
  note: text("note").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...timestampColumns(),
});

export const soilSamples = pgTable("soil_samples", {
  id: text("id").primaryKey(),
  regionId: text("region_id").references(() => regions.id),
  communityId: text("community_id").references(() => communities.id),
  ph: doublePrecision("ph"),
  phClass: phClassEnum("ph_class"),
  phMethod: phMethodEnum("ph_method").default("unknown").notNull(),
  collectedAt: timestamp("collected_at", { withTimezone: true }),
  collectedAtText: text("collected_at_text"),
  depthCm: doublePrecision("depth_cm"),
  location: postgisGeometry("location", { type: "Point" }),
  locationSourceStatus: sourceStatusEnum("location_source_status"),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const calendarTasks = pgTable("calendar_tasks", {
  id: text("id").primaryKey(),
  regionId: text("region_id").references(() => regions.id),
  cropId: text("crop_id").references(() => crops.id),
  month: monthEnum("month").notNull(),
  season: seasonEnum("season").notNull(),
  taskType: calendarTaskTypeEnum("task_type").notNull(),
  summary: text("summary").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const answerTemplates = pgTable("answer_templates", {
  id: text("id").primaryKey(),
  cropId: text("crop_id").references(() => crops.id),
  regionId: text("region_id").references(() => regions.id),
  language: text("language").default("pt").notNull(),
  questionKey: text("question_key").notNull(),
  triggerTerms: jsonb("trigger_terms").$type<string[]>().default([]).notNull(),
  answerText: text("answer_text").notNull(),
  deterministicPriority: integer("deterministic_priority")
    .default(100)
    .notNull(),
  requiresDoctorReview: boolean("requires_doctor_review")
    .default(false)
    .notNull(),
  active: boolean("active").default(true).notNull(),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const ussdSessions = pgTable("ussd_sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  phoneNumberHash: text("phone_number_hash"),
  route: jsonb("route").$type<string[]>().default([]).notNull(),
  currentScreen: text("current_screen"),
  depth: integer("depth").default(0).notNull(),
  phase: text("phase").default("phase_2_placeholder").notNull(),
  status: ussdSessionStatusEnum("status").default("active").notNull(),
  lastInboundText: text("last_inbound_text"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const consultations = pgTable("consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  regionId: text("region_id").references(() => regions.id),
  communityId: text("community_id").references(() => communities.id),
  cropId: text("crop_id").references(() => crops.id),
  ussdSessionId: text("ussd_session_id").references(() => ussdSessions.id),
  channel: consultationChannelEnum("channel").default("mobile").notNull(),
  language: text("language").default("pt").notNull(),
  questionText: text("question_text").notNull(),
  normalizedQuestionText: text("normalized_question_text"),
  matchedRiskTerms: jsonb("matched_risk_terms")
    .$type<string[]>()
    .default([])
    .notNull(),
  status: consultationStatusEnum("status").default("pending_review").notNull(),
  escalationReason: escalationReasonEnum("escalation_reason"),
  escalatedAt: timestamp("escalated_at", { withTimezone: true }),
  escalationDueAt: timestamp("escalation_due_at", { withTimezone: true }),
  assignedDoctorId: uuid("assigned_doctor_id").references(() => users.id),
  selectedAnswerTemplateId: text("selected_answer_template_id").references(
    () => answerTemplates.id,
  ),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const consultationResponses = pgTable("consultation_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  consultationId: uuid("consultation_id")
    .notNull()
    .references(() => consultations.id),
  answerTemplateId: text("answer_template_id").references(
    () => answerTemplates.id,
  ),
  responderUserId: uuid("responder_user_id").references(() => users.id),
  responseType: consultationResponseTypeEnum("response_type").notNull(),
  body: text("body").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const notificationJobs = pgTable("notification_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  consultationId: uuid("consultation_id").references(() => consultations.id),
  userId: uuid("user_id").references(() => users.id),
  ussdSessionId: text("ussd_session_id").references(() => ussdSessions.id),
  jobType: notificationJobTypeEnum("job_type").notNull(),
  channel: userChannelEnum("channel").notNull(),
  status: notificationJobStatusEnum("status").default("pending").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  attempts: integer("attempts").default(0).notNull(),
  payload: jsonb("payload")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  lastError: text("last_error"),
  ...timestampColumns(),
});
