import { ConflictException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";

const repository = {
  createFarmerAccount: vi.fn(),
  createPasswordResetCode: vi.fn(),
  createRefreshToken: vi.fn(),
  findById: vi.fn(),
  findByIdentifierHash: vi.fn(),
  resetPassword: vi.fn(),
  revokeRefreshToken: vi.fn(),
  rotateRefreshToken: vi.fn(),
  consumeAccountVerification: vi.fn(),
};

const testPassword = randomBytes(32).toString("base64url");

function createService() {
  return new AuthService(repository as unknown as AuthRepository);
}

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persiste o email opcional durante o registo", async () => {
    repository.createFarmerAccount.mockResolvedValue({ userId: "user-1" });

    await createService().register({
      displayName: "Binta Cisse",
      email: "binta@example.com",
      password: testPassword,
      phone: "+245956086144",
    });

    expect(repository.createFarmerAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "binta@example.com",
      }),
    );
  });

  it("devolve conflito controlado quando o identificador ja existe", async () => {
    repository.createFarmerAccount.mockRejectedValue({ code: "23505" });

    await expect(
      createService().register({
        displayName: "Binta Cisse",
        password: testPassword,
        phone: "+245956086144",
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("nao transforma erros desconhecidos em conflito", async () => {
    const error = new Error("base indisponivel");
    repository.createFarmerAccount.mockRejectedValue(error);

    await expect(
      createService().register({
        displayName: "Binta Cisse",
        password: testPassword,
        phone: "+245956086144",
      }),
    ).rejects.toBe(error);
  });
});
