import { Test } from "@nestjs/testing";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthGuard } from "../auth/auth.guard.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { EntitlementsController } from "./entitlements.controller.js";
import { EntitlementsRepository } from "./entitlements.repository.js";
import { EntitlementsService } from "./entitlements.service.js";

const now = new Date("2026-07-13T12:00:00.000Z");
const guardsMetadata = "__guards__";

const emptyResponse = {
  features: {
    agriculturalDoctor: false,
    cropDetails: false,
    forum: false,
    map: false,
  },
  subscription: null,
};

describe("EntitlementsController", () => {
  const service = {
    getCurrentUserEntitlements: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("protege a consulta com AuthGuard", () => {
    expect(
      Reflect.getMetadata(guardsMetadata, EntitlementsController.prototype.me),
    ).toContain(AuthGuard);
  });

  it("devolve o contrato exacto para o utilizador autenticado", async () => {
    const response = {
      features: {
        agriculturalDoctor: true,
        cropDetails: true,
        forum: true,
        map: true,
      },
      subscription: {
        expiresAt: "2026-08-10T00:00:00.000Z",
        status: "active",
      },
    };
    service.getCurrentUserEntitlements.mockResolvedValue(response);

    const module = await Test.createTestingModule({
      controllers: [EntitlementsController],
      providers: [
        { provide: EntitlementsService, useValue: service },
        { provide: AuthGuard, useValue: { canActivate: () => true } },
        { provide: AuthRepository, useValue: { findById: vi.fn() } },
      ],
    }).compile();

    await expect(
      module
        .get(EntitlementsController)
        .me({ user: { id: "user-1", roles: ["farmer"] } }),
    ).resolves.toEqual(response);
    expect(service.getCurrentUserEntitlements).toHaveBeenCalledWith("user-1");
  });

  it("falha quando nao existe utilizador autenticado", async () => {
    const module = await Test.createTestingModule({
      controllers: [EntitlementsController],
      providers: [
        { provide: EntitlementsService, useValue: service },
        { provide: AuthGuard, useValue: { canActivate: () => true } },
        { provide: AuthRepository, useValue: { findById: vi.fn() } },
      ],
    }).compile();

    expect(() => module.get(EntitlementsController).me({})).toThrow(
      "Utilizador não autenticado",
    );
    expect(service.getCurrentUserEntitlements).not.toHaveBeenCalled();
  });
});

describe("EntitlementsService", () => {
  it("desbloqueia apenas os entitlements activos e validos", async () => {
    const repository = {
      findForUser: vi.fn().mockResolvedValue({
        entitlements: [
          {
            active: true,
            expiresAt: new Date("2026-08-01T00:00:00.000Z"),
            featureKey: "map",
          },
          {
            active: true,
            expiresAt: null,
            featureKey: "crop_details",
          },
        ],
        subscription: {
          expiresAt: new Date("2026-08-01T00:00:00.000Z"),
          status: "active",
        },
      }),
    };
    const service = new EntitlementsService(
      repository as unknown as EntitlementsRepository,
    );

    await expect(
      service.getCurrentUserEntitlements("user-1", now),
    ).resolves.toEqual({
      features: {
        agriculturalDoctor: false,
        cropDetails: true,
        forum: false,
        map: true,
      },
      subscription: {
        expiresAt: "2026-08-01T00:00:00.000Z",
        status: "active",
      },
    });
    expect(repository.findForUser).toHaveBeenCalledWith("user-1");
  });

  it("ignora entitlements inactivos expirados e com feature desconhecida", async () => {
    const repository = {
      findForUser: vi.fn().mockResolvedValue({
        entitlements: [
          {
            active: false,
            expiresAt: null,
            featureKey: "forum",
          },
          {
            active: true,
            expiresAt: new Date("2026-07-13T12:00:00.000Z"),
            featureKey: "map",
          },
          {
            active: true,
            expiresAt: null,
            featureKey: "unknown_feature",
          },
        ],
        subscription: null,
      }),
    };
    const service = new EntitlementsService(
      repository as unknown as EntitlementsRepository,
    );

    await expect(
      service.getCurrentUserEntitlements("user-1", now),
    ).resolves.toEqual(emptyResponse);
  });
});

describe("EntitlementsRepository", () => {
  it("consulta o utilizador pedido e ordena a subscricao mais recente", async () => {
    const entitlementWhere = vi.fn().mockResolvedValue([
      {
        active: true,
        expiresAt: null,
        featureKey: "forum",
      },
    ]);
    const subscriptionWhere = vi.fn();
    const orderBy = vi.fn();
    const limit = vi.fn();
    const select = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: entitlementWhere,
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: subscriptionWhere.mockReturnValue({
            orderBy: orderBy.mockReturnValue({
              limit: limit.mockResolvedValue([
                {
                  expiresAt: new Date("2026-09-01T00:00:00.000Z"),
                  status: "active",
                },
              ]),
            }),
          }),
        }),
      });
    const repository = new EntitlementsRepository({ select } as never);

    await expect(repository.findForUser("user-1")).resolves.toEqual({
      entitlements: [
        {
          active: true,
          expiresAt: null,
          featureKey: "forum",
        },
      ],
      subscription: {
        expiresAt: new Date("2026-09-01T00:00:00.000Z"),
        status: "active",
      },
    });
    const dialect = new PgDialect();
    const entitlementQuery = dialect.sqlToQuery(
      entitlementWhere.mock.calls[0]?.[0] as never,
    );
    const subscriptionQuery = dialect.sqlToQuery(
      subscriptionWhere.mock.calls[0]?.[0] as never,
    );
    const subscriptionOrder = orderBy.mock.calls[0]?.map(
      (expression) => dialect.sqlToQuery(expression as never).sql,
    );

    expect({
      params: entitlementQuery.params,
      sql: entitlementQuery.sql,
    }).toEqual({
      params: ["user-1"],
      sql: '"entitlements"."user_id" = $1',
    });
    expect({
      params: subscriptionQuery.params,
      sql: subscriptionQuery.sql,
    }).toEqual({
      params: ["user-1"],
      sql: '"subscriptions"."user_id" = $1',
    });
    expect(subscriptionOrder).toEqual([
      '"subscriptions"."starts_at" desc',
      '"subscriptions"."created_at" desc',
      '"subscriptions"."id" desc',
    ]);
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("falha de forma clara sem base de dados real", async () => {
    const repository = new EntitlementsRepository(null);

    await expect(repository.findForUser("user-1")).rejects.toThrow(
      "EntitlementsRepository requer uma base de dados real",
    );
  });
});
