import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { AppModule } from "./app.module.js";

import type { INestApplication } from "@nestjs/common";

describe("API foundation", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns health status", async () => {
    const response = await request(app.getHttpServer()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "@ndjar/api",
      mode: "fixture-backed",
    });
  });

  it("returns pilot regions for the mobile app", async () => {
    const response = await request(app.getHttpServer()).get("/regions");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: [
        {
          id: "quinara-buba-pilot",
          regionName: "Quinara",
          sectorName: "Buba",
        },
      ],
      meta: {
        source: "fixtures",
      },
    });
  });

  it("returns pilot crops for the mobile app", async () => {
    const response = await request(app.getHttpServer()).get("/crops");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "arroz",
          label: "Arroz",
        }),
      ]),
      meta: {
        source: "fixtures",
      },
    });
  });

  it("escalates unsafe assistant questions for agricultural doctor review", async () => {
    const response = await request(app.getHttpServer())
      .post("/assistant/ask")
      .send({
        question: "Que dose de ureia devo aplicar no arroz antes da colheita?",
        cropId: "arroz",
        regionId: "quinara-buba-pilot",
        language: "pt",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      answerType: "pending_review",
      status: "escalated",
      escalation: {
        assigneeRole: "Medico Agricola",
        dueInHours: 24,
        reason: "chemical_or_dosage_risk",
      },
    });
    expect(Date.parse(response.body.escalation.dueAt)).not.toBeNaN();
  });

  it("answers simple reviewed questions with a deterministic template", async () => {
    const response = await request(app.getHttpServer())
      .post("/assistant/ask")
      .send({
        question: "O que significa o ph do solo?",
        regionId: "quinara-buba-pilot",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      answerType: "deterministic_template",
      status: "answered_by_template",
      source: "local_reviewed_template",
      templateId: "soil-ph-basic",
      decision: {
        shouldEscalate: false,
        reason: "reviewed_answer_available",
      },
    });
  });

  it("creates mobile consultations with pending review metadata", async () => {
    const response = await request(app.getHttpServer())
      .post("/consultations")
      .send({
        question: "A minha lavoura esta a morrer com uma praga grave.",
        cropId: "mandioca",
        regionId: "quinara-buba-pilot",
        channel: "mobile",
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      consultation: {
        cropId: "mandioca",
        regionId: "quinara-buba-pilot",
        channel: "mobile",
        status: "pending_review",
      },
      assistant: {
        answerType: "pending_review",
        status: "escalated",
      },
      mobile: {
        showImmediateAnswer: false,
        showPendingReview: true,
      },
    });
  });

  it("returns an offline sync snapshot", async () => {
    const response = await request(app.getHttpServer()).get("/sync");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      mode: "offline-bootstrap",
      versions: {
        regions: "pilot-south-regions-v1",
        crops: "pilot-crops-v1",
        calendar: "pilot-calendar-v1",
      },
      data: {
        regions: expect.any(Array),
        crops: expect.any(Array),
        calendar: expect.any(Array),
      },
      seedSummary: {
        regions: 1,
      },
    });
  });

  it("returns the phase 2 USSD preview menu", async () => {
    const response = await request(app.getHttpServer()).get("/ussd-preview");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      phase: "phase_2_placeholder",
      integration: "not_connected",
      menu: {
        screen: "home",
        options: expect.arrayContaining([
          expect.objectContaining({
            input: "3",
            label: "Perguntar ao Medico Agricola",
          }),
        ]),
      },
    });
  });
});
