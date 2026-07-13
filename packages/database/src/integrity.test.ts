import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  agronomicSources,
  answerTemplates,
  answerTemplateVersions,
  calendarTasks,
  consultationResponses,
  cropAgronomicNotes,
  cropPresence,
  phClassEnum,
  soilSamples,
} from "./schema.js";

function checkSql(table: Parameters<typeof getTableConfig>[0]): string[] {
  const dialect = new PgDialect();
  return getTableConfig(table).checks.map(
    (constraint) => dialect.sqlToQuery(constraint.value).sql,
  );
}

function indexedColumns(table: Parameters<typeof getTableConfig>[0]): string[] {
  return getTableConfig(table).indexes.map((item) =>
    item.config.columns
      .map((column) => ("name" in column ? column.name : "expression"))
      .join(","),
  );
}

describe("agronomic integrity", () => {
  it("persists chemical pH bands and constrains the physical scale", () => {
    expect(phClassEnum.enumValues).toEqual([
      "strongly-acidic",
      "acidic",
      "slightly-acidic",
      "neutral",
      "alkaline",
    ]);
    expect(checkSql(soilSamples).join(" ")).toContain('"ph" >= 0');
    expect(checkSql(soilSamples).join(" ")).toContain('"ph" <= 14');
    expect(checkSql(soilSamples).join(" ")).toContain('"ph_class"');
    expect(checkSql(soilSamples).join(" ")).toContain(
      '"soil_samples"."ph_class" = \'strongly-acidic\'',
    );
    expect(checkSql(soilSamples).join(" ")).toContain(
      '"soil_samples"."ph_class" = \'alkaline\'',
    );
  });

  it("stores minimum traceable provenance and links agronomic records", () => {
    expect(agronomicSources).toHaveProperty("documentTitle");
    expect(agronomicSources).toHaveProperty("documentDateText");
    expect(agronomicSources).toHaveProperty("responsibleName");
    expect(agronomicSources).toHaveProperty("confidence");
    expect(agronomicSources).toHaveProperty("version");
    expect(soilSamples.sourceId.notNull).toBe(true);
    expect(calendarTasks.sourceId.notNull).toBe(true);
    expect(cropAgronomicNotes.sourceId.notNull).toBe(true);
    expect(answerTemplates.sourceId.notNull).toBe(true);
  });

  it("stores reviewed clinical content as versioned inactive records", () => {
    const sql = checkSql(answerTemplateVersions).join(" ");
    const indexes = indexedColumns(answerTemplateVersions);

    expect(answerTemplateVersions.active.default).toBe(false);
    expect(answerTemplateVersions.reviewedByUserId.notNull).toBe(true);
    expect(answerTemplateVersions.reviewedAt.notNull).toBe(true);
    expect(answerTemplateVersions.contentHash.notNull).toBe(true);
    expect(answerTemplateVersions.sourceId.notNull).toBe(true);
    expect(sql).toContain('"version" >= 1');
    expect(sql).toContain('"content_hash"');
    expect(indexes).toContain("answer_template_id,version");
  });

  it("requires traceability for deterministic and doctor responses", () => {
    const sql = checkSql(consultationResponses).join(" ");
    expect(sql).toContain('"answer_template_version_id" is not null');
    expect(sql).toContain('"answer_snapshot" is not null');
    expect(sql).toContain('"answer_snapshot_hash" is not null');
    expect(sql).toContain(
      '"consultation_responses"."body" = "consultation_responses"."answer_snapshot"',
    );
    expect(sql).toContain('"responder_user_id" is not null');
    expect(consultationResponses.sourceId.notNull).toBe(true);
  });

  it("indexes common agronomic foreign-key lookups", () => {
    expect(indexedColumns(soilSamples)).toEqual(
      expect.arrayContaining(["region_id", "community_id", "source_id"]),
    );
    expect(indexedColumns(cropPresence)).toEqual(
      expect.arrayContaining(["crop_id,community_id", "source_group_id"]),
    );
  });
});
