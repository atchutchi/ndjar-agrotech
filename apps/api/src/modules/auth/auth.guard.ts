import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  Inject,
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

    try {
      const payload = await verifyAccessToken(token);
      if (!payload.sub) {
        throw new UnauthorizedException("Sessão obrigatória");
      }

      const currentUser = await this.repository.findById(payload.sub);
      if (!currentUser) {
        throw new UnauthorizedException("Sessão obrigatória");
      }

      request.user = {
        id: currentUser.id,
        roles: currentUser.roles,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Sessão obrigatória");
    }
  }
}
