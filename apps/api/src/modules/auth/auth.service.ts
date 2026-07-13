import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { hash, verify } from "argon2";
import { createHash, randomInt } from "node:crypto";

import { AuthRepository } from "./auth.repository.js";
import { signAccessToken } from "./auth.tokens.js";

import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  ResetPasswordInput,
  VerifyInput,
} from "./auth.schemas.js";

export interface AuthenticatedUser {
  id: string;
  roles: string[];
}

function stableHash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function verificationCode() {
  return String(randomInt(100000, 999999));
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
  ) {}

  async register(input: RegisterInput) {
    const code = verificationCode();
    const passwordHash = await hash(input.password);
    let result: { userId: string };

    try {
      result = await this.repository.createFarmerAccount({
        displayName: input.displayName,
        email: input.email,
        identifierHash: stableHash(input.phone),
        passwordHash,
        verificationCodeHash: await hash(code),
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          "Ja existe uma conta com este numero de telefone.",
        );
      }

      throw error;
    }

    return {
      devVerificationCode:
        process.env.NODE_ENV === "production" ? undefined : code,
      userId: result.userId,
      verificationRequired: true,
    };
  }

  async verify(input: VerifyInput) {
    const verified = await this.repository.consumeAccountVerification(input);
    if (!verified) {
      throw new BadRequestException("Codigo invalido ou expirado");
    }

    return { verified: true };
  }

  async login(input: LoginInput) {
    const user = await this.repository.findByIdentifierHash(
      stableHash(input.identifier),
    );

    if (
      !user ||
      !user.verifiedAt ||
      !(await verify(user.passwordHash, input.password))
    ) {
      throw new UnauthorizedException("Credenciais invalidas");
    }

    return this.createSession(user);
  }

  async refresh(input: RefreshInput) {
    const session = await this.repository.rotateRefreshToken(
      input.refreshToken,
    );
    if (!session) {
      throw new UnauthorizedException("Sessao invalida");
    }

    return {
      accessToken: await signAccessToken({
        roles: session.user.roles,
        sub: session.user.id,
      }),
      refreshToken: session.refreshToken,
      user: {
        displayName: session.user.displayName,
        id: session.user.id,
        roles: session.user.roles,
      },
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const code = verificationCode();
    await this.repository.createPasswordResetCode({
      identifierHash: stableHash(input.identifier),
      codeHash: await hash(code),
    });

    return {
      devResetCode: process.env.NODE_ENV === "production" ? undefined : code,
      resetRequired: true,
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const passwordReset = await this.repository.resetPassword({
      identifierHash: stableHash(input.identifier),
      code: input.code,
      passwordHash: await hash(input.newPassword),
    });

    if (!passwordReset) {
      throw new BadRequestException("Codigo invalido ou expirado");
    }

    return { passwordReset: true };
  }

  async me(user: AuthenticatedUser | undefined) {
    if (!user) {
      throw new UnauthorizedException("Utilizador nao autenticado");
    }

    const record = await this.repository.findById(user.id);
    if (!record) {
      throw new UnauthorizedException("Utilizador nao autenticado");
    }

    return record;
  }

  async logout(input: LogoutInput) {
    await this.repository.revokeRefreshToken(input.refreshToken);

    return { loggedOut: true };
  }

  private async createSession(user: {
    displayName: string | null;
    id: string;
    roles: string[];
  }) {
    return {
      accessToken: await signAccessToken({ roles: user.roles, sub: user.id }),
      refreshToken: await this.repository.createRefreshToken(user.id),
      user: {
        displayName: user.displayName,
        id: user.id,
        roles: user.roles,
      },
    };
  }
}
