import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import type { AuthenticatedUser } from "./auth.service.js";

const insufficientPermissionMessage = "Permissão insuficiente";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: Pick<AuthenticatedUser, "roles">;
    }>();
    const allowed = request.user?.roles.some((role) => required.includes(role));

    if (!allowed) {
      throw new ForbiddenException(insufficientPermissionMessage);
    }

    return true;
  }
}
