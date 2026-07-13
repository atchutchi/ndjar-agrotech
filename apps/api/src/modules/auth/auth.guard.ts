import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";

import { verifyAccessToken } from "./auth.tokens.js";
import { AuthRepository } from "./auth.repository.js";

import type { AuthenticatedUser } from "./auth.service.js";

interface AuthenticatedRequest {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
}

function bearerToken(authorization: string | string[] | undefined) {
  if (typeof authorization !== "string") {
    return null;
  }

  const [scheme, token, extra] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || extra) {
    return null;
  }

  return token;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AuthRepository) private readonly repository: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = bearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Sessão obrigatória");
    }

    let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException("Sessão obrigatória");
    }
    if (!payload.sub) {
      throw new UnauthorizedException("Sessão obrigatória");
    }

    let currentUser: Awaited<ReturnType<AuthRepository["findById"]>>;
    try {
      currentUser = await this.repository.findById(payload.sub);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        "Nao foi possivel validar a sessao na base de dados.",
      );
    }
    if (!currentUser) {
      throw new UnauthorizedException("Sessão obrigatória");
    }

    request.user = {
      id: currentUser.id,
      roles: currentUser.roles,
    };

    return true;
  }
}
