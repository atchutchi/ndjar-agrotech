import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetsAt: number;
}

export const AUTH_RATE_LIMIT_KEY = "ndjar:auth-rate-limit";

export const AuthRateLimit = (config: RateLimitConfig) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, config);

@Injectable()
export class AuthRateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();

  consume(key: string, config: RateLimitConfig, now = Date.now()) {
    const current = this.buckets.get(key);
    if (!current || current.resetsAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetsAt: now + config.windowMs,
      });
      return true;
    }

    current.count += 1;
    return current.count <= config.limit;
  }
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthRateLimitStore) private readonly store: AuthRateLimitStore,
  ) {}

  canActivate(context: ExecutionContext) {
    const config = this.reflector.get<RateLimitConfig>(
      AUTH_RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!config) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ ip?: string }>();
    const operation = context.getHandler().name || "unknown";
    const key = `${operation}:${request.ip ?? "unknown"}`;
    if (!this.store.consume(key, config)) {
      throw new HttpException(
        "Demasiados pedidos. Tente novamente mais tarde.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
