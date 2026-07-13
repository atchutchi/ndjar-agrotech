import { PgDialect, getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  agronomicSources,
  answerTemplates,
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

  it("keeps clinical templates inactive until a responsible review exists", () => {
    expect(answerTemplates.active.default).toBe(false);
    const sql = checkSql(answerTemplates).join(" ");
    expect(sql).toContain('"reviewed_by_user_id" is not null');
    expect(sql).toContain('"reviewed_at" is not null');
    expect(sql).toContain('"review_version" >= 1');
  });

  it("requires traceability for deterministic and doctor responses", () => {
    const sql = checkSql(consultationResponses).join(" ");
    expect(sql).toContain('"answer_template_id" is not null');
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
