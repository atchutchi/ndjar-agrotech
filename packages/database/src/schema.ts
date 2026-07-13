import { AGRONOMIC_SOURCE_STATUSES } from "@ndjar/domain";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  doublePrecision,
  foreignKey,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
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
  "super_admin",
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
  "strongly-acidic",
  "acidic",
  "slightly-acidic",
  "neutral",
  "alkaline",
]);
export const sourceConfidenceEnum = pgEnum("source_confidence", [
  "unknown",
  "low",
  "medium",
  "high",
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
export const authProviderEnum = pgEnum("auth_provider", [
  "password",
  "sms_code",
  "admin_invite",
]);
export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "account_verification",
  "password_reset",
  "phone_change",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "past_due",
  "expired",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "failed",
  "expired",
  "refunded",
]);
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "publish",
  "login",
  "logout",
  "payment_confirmed",
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

export const agronomicSources = pgTable(
  "agronomic_sources",
  {
    id: text("id").primaryKey(),
    documentTitle: text("document_title").notNull(),
    documentDateText: text("document_date_text").notNull(),
    responsibleName: text("responsible_name").notNull(),
    confidence: sourceConfidenceEnum("confidence").default("unknown").notNull(),
    version: integer("version").default(1).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    check("agronomic_sources_version_positive", sql`${table.version} >= 1`),
  ],
);

function agronomicSourceColumn() {
  return text("source_id")
    .notNull()
    .references(() => agronomicSources.id);
}

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: text("display_name"),
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
  sourceId: agronomicSourceColumn(),
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
  sourceId: agronomicSourceColumn(),
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
  sourceId: agronomicSourceColumn(),
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
  sourceId: agronomicSourceColumn(),
  ...timestampColumns(),
});

export const crops = pgTable("crops", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  sourceId: agronomicSourceColumn(),
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
    sourceId: agronomicSourceColumn(),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    ...timestampColumns(),
  },
);

export const cropPresence = pgTable(
  "crop_presence",
  {
    id: text("id").primaryKey(),
    cropId: text("crop_id")
      .notNull()
      .references(() => crops.id),
    communityId: text("community_id")
      .notNull()
      .references(() => communities.id),
    sourceStatus: sourceStatusEnum("source_status").notNull(),
    sourceId: agronomicSourceColumn(),
    sourceGroupId: text("source_group_id").references(() => communityGroups.id),
    observedAt: timestamp("observed_at", { withTimezone: true }),
    ...offlineSyncColumns(),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("crop_presence_crop_community_unique").on(
      table.cropId,
      table.communityId,
    ),
    index("crop_presence_source_group_idx").on(table.sourceGroupId),
    index("crop_presence_source_id_idx").on(table.sourceId),
  ],
);

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
  sourceId: agronomicSourceColumn(),
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
  sourceId: agronomicSourceColumn(),
  ...timestampColumns(),
});

export const soilSamples = pgTable(
  "soil_samples",
  {
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
    sourceId: agronomicSourceColumn(),
    ...offlineSyncColumns(),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "soil_samples_ph_range",
      sql`${table.ph} is null or (${table.ph} >= 0 and ${table.ph} <= 14)`,
    ),
    check(
      "soil_samples_ph_class_coherence",
      sql`(${table.ph} is null and ${table.phClass} is null) or (${table.ph} is not null and ${table.phClass} is not null)`,
    ),
    check(
      "soil_samples_ph_class_matches_value",
      sql`${table.ph} is null or (
        (${table.ph} >= 0 and ${table.ph} < 4.5 and ${table.phClass} = 'strongly-acidic') or
        (${table.ph} >= 4.5 and ${table.ph} < 5.5 and ${table.phClass} = 'acidic') or
        (${table.ph} >= 5.5 and ${table.ph} < 6.5 and ${table.phClass} = 'slightly-acidic') or
        (${table.ph} >= 6.5 and ${table.ph} <= 7.5 and ${table.phClass} = 'neutral') or
        (${table.ph} > 7.5 and ${table.ph} <= 14 and ${table.phClass} = 'alkaline')
      )`,
    ),
    check(
      "soil_samples_depth_non_negative",
      sql`${table.depthCm} is null or ${table.depthCm} >= 0`,
    ),
    index("soil_samples_region_id_idx").on(table.regionId),
    index("soil_samples_community_id_idx").on(table.communityId),
    index("soil_samples_source_id_idx").on(table.sourceId),
  ],
);

export const calendarTasks = pgTable("calendar_tasks", {
  id: text("id").primaryKey(),
  regionId: text("region_id").references(() => regions.id),
  cropId: text("crop_id").references(() => crops.id),
  month: monthEnum("month").notNull(),
  season: seasonEnum("season").notNull(),
  taskType: calendarTaskTypeEnum("task_type").notNull(),
  summary: text("summary").notNull(),
  sourceStatus: sourceStatusEnum("source_status").notNull(),
  sourceId: agronomicSourceColumn(),
  ...offlineSyncColumns(),
  ...timestampColumns(),
});

export const answerTemplates = pgTable(
  "answer_templates",
  {
    id: text("id").primaryKey(),
    cropId: text("crop_id").references(() => crops.id),
    regionId: text("region_id").references(() => regions.id),
    language: text("language").default("pt").notNull(),
    questionKey: text("question_key").notNull(),
    triggerTerms: jsonb("trigger_terms")
      .$type<string[]>()
      .default([])
      .notNull(),
    answerText: text("answer_text").notNull(),
    deterministicPriority: integer("deterministic_priority")
      .default(100)
      .notNull(),
    requiresDoctorReview: boolean("requires_doctor_review")
      .default(true)
      .notNull(),
    active: boolean("active").default(false).notNull(),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewVersion: integer("review_version"),
    sourceStatus: sourceStatusEnum("source_status").notNull(),
    sourceId: agronomicSourceColumn(),
    ...offlineSyncColumns(),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "answer_templates_active_requires_review",
      sql`not ${table.active} or (${table.reviewedByUserId} is not null and ${table.reviewedAt} is not null and ${table.reviewVersion} >= 1)`,
    ),
    index("answer_templates_source_id_idx").on(table.sourceId),
    index("answer_templates_reviewed_by_idx").on(table.reviewedByUserId),
  ],
);

export const answerTemplateVersions = pgTable(
  "answer_template_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    answerTemplateId: text("answer_template_id")
      .notNull()
      .references(() => answerTemplates.id),
    version: integer("version").notNull(),
    triggerTerms: jsonb("trigger_terms")
      .$type<string[]>()
      .default([])
      .notNull(),
    answerText: text("answer_text").notNull(),
    contentHash: text("content_hash").notNull(),
    deterministicPriority: integer("deterministic_priority")
      .default(100)
      .notNull(),
    active: boolean("active").default(false).notNull(),
    reviewedByUserId: uuid("reviewed_by_user_id")
      .notNull()
      .references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
    sourceStatus: sourceStatusEnum("source_status").notNull(),
    sourceId: agronomicSourceColumn(),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "answer_template_versions_version_positive",
      sql`${table.version} >= 1`,
    ),
    check(
      "answer_template_versions_content_hash_format",
      sql`${table.contentHash} ~ '^[0-9a-f]{64}$'`,
    ),
    uniqueIndex("answer_template_versions_template_version_unique").on(
      table.answerTemplateId,
      table.version,
    ),
    uniqueIndex("answer_template_versions_template_hash_unique").on(
      table.answerTemplateId,
      table.contentHash,
    ),
    index("answer_template_versions_active_idx").on(
      table.answerTemplateId,
      table.active,
    ),
    uniqueIndex("answer_template_versions_one_active_unique")
      .on(table.answerTemplateId)
      .where(sql`${table.active}`),
    index("answer_template_versions_reviewer_idx").on(table.reviewedByUserId),
    index("answer_template_versions_source_idx").on(table.sourceId),
  ],
);

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

export const consultationResponses = pgTable(
  "consultation_responses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    consultationId: uuid("consultation_id")
      .notNull()
      .references(() => consultations.id),
    answerTemplateId: text("answer_template_id").references(
      () => answerTemplates.id,
    ),
    answerTemplateVersionId: uuid("answer_template_version_id").references(
      () => answerTemplateVersions.id,
    ),
    answerSnapshot: text("answer_snapshot"),
    answerSnapshotHash: text("answer_snapshot_hash"),
    responderUserId: uuid("responder_user_id").references(() => users.id),
    responseType: consultationResponseTypeEnum("response_type").notNull(),
    body: text("body").notNull(),
    sourceStatus: sourceStatusEnum("source_status").notNull(),
    sourceId: agronomicSourceColumn(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...offlineSyncColumns(),
    ...timestampColumns(),
  },
  (table) => [
    check(
      "consultation_responses_template_traceability",
      sql`${table.responseType} <> 'deterministic_template' or (${table.answerTemplateVersionId} is not null and ${table.answerSnapshot} is not null and ${table.answerSnapshotHash} is not null and ${table.body} = ${table.answerSnapshot})`,
    ),
    check(
      "consultation_responses_snapshot_hash_format",
      sql`${table.answerSnapshotHash} is null or ${table.answerSnapshotHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "consultation_responses_doctor_traceability",
      sql`${table.responseType} <> 'doctor_response' or ${table.responderUserId} is not null`,
    ),
    index("consultation_responses_consultation_idx").on(table.consultationId),
    index("consultation_responses_template_version_idx").on(
      table.answerTemplateVersionId,
    ),
    index("consultation_responses_source_id_idx").on(table.sourceId),
  ],
);

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

export const userProfiles = pgTable(
  "user_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id),
    fullName: text("full_name"),
    email: text("email"),
    phoneNumberHash: text("phone_number_hash"),
    phoneCountryCode: text("phone_country_code").default("245").notNull(),
    regionId: text("region_id").references(() => regions.id),
    communityId: text("community_id").references(() => communities.id),
    preferredLanguage: text("preferred_language").default("pt").notNull(),
    avatarStorageKey: text("avatar_storage_key"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    index("user_profiles_phone_number_hash_idx").on(table.phoneNumberHash),
  ],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    provider: authProviderEnum("provider").default("password").notNull(),
    loginIdentifierHash: text("login_identifier_hash").notNull(),
    passwordHash: text("password_hash"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("auth_accounts_provider_login_identifier_hash_unique").on(
      table.provider,
      table.loginIdentifierHash,
    ),
    index("auth_accounts_user_id_idx").on(table.userId),
  ],
);

export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    purpose: verificationPurposeEnum("purpose").notNull(),
    targetHash: text("target_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    attempts: integer("attempts").default(0).notNull(),
    ...timestampColumns(),
  },
  (table) => [
    index("verification_codes_target_lookup_idx").on(
      table.targetHash,
      table.purpose,
      table.consumedAt,
      table.expiresAt,
    ),
    index("verification_codes_user_purpose_idx").on(
      table.userId,
      table.purpose,
    ),
  ],
);

export const authRateLimits = pgTable(
  "auth_rate_limits",
  {
    key: text("key").primaryKey(),
    requestCount: integer("request_count").default(1).notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestampColumns(),
  },
  (table) => [index("auth_rate_limits_expires_at_idx").on(table.expiresAt)],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tokenHash: text("token_hash").notNull(),
    familyId: uuid("family_id").notNull(),
    parentTokenId: uuid("parent_token_id"),
    userAgent: text("user_agent"),
    ipHash: text("ip_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    foreignKey({
      columns: [table.familyId],
      foreignColumns: [table.id],
      name: "refresh_tokens_family_root_fk",
    }),
    foreignKey({
      columns: [table.parentTokenId, table.familyId],
      foreignColumns: [table.id, table.familyId],
      name: "refresh_tokens_parent_family_fk",
    }),
    check(
      "refresh_tokens_root_family_coherence",
      sql`${table.parentTokenId} is not null or ${table.familyId} = ${table.id}`,
    ),
    uniqueIndex("refresh_tokens_id_family_id_unique").on(
      table.id,
      table.familyId,
    ),
    index("refresh_tokens_family_id_idx").on(table.familyId),
    index("refresh_tokens_user_id_idx").on(table.userId),
  ],
);

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  ...timestampColumns(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("user_roles_user_id_role_id_unique").on(
      table.userId,
      table.roleId,
    ),
  ],
);

export const plans = pgTable("plans", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  priceXof: integer("price_xof").notNull(),
  interval: text("interval").default("month").notNull(),
  includedConsultations: integer("included_consultations").default(3).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestampColumns(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    uniqueIndex("subscriptions_id_user_id_unique").on(table.id, table.userId),
    index("subscriptions_user_status_validity_idx").on(
      table.userId,
      table.status,
      table.startsAt,
      table.expiresAt,
    ),
  ],
);

export const paymentProviders = pgTable("payment_providers", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  active: boolean("active").default(true).notNull(),
  logoStorageKey: text("logo_storage_key"),
  ...timestampColumns(),
});

export const paymentAttempts = pgTable("payment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => paymentProviders.id),
  planId: text("plan_id").references(() => plans.id),
  amountXof: integer("amount_xof").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  externalReference: text("external_reference"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  ...timestampColumns(),
});

export const entitlements = pgTable(
  "entitlements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    subscriptionId: uuid("subscription_id").notNull(),
    featureKey: text("feature_key").notNull(),
    active: boolean("active").default(true).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    ...timestampColumns(),
  },
  (table) => [
    foreignKey({
      columns: [table.subscriptionId, table.userId],
      foreignColumns: [subscriptions.id, subscriptions.userId],
      name: "entitlements_subscription_user_fk",
    }),
    uniqueIndex("entitlements_subscription_feature_unique").on(
      table.subscriptionId,
      table.featureKey,
    ),
    index("entitlements_user_active_idx").on(table.userId, table.active),
  ],
);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata")
    .$type<Record<string, unknown>>()
    .default({})
    .notNull(),
  ...timestampColumns(),
});
