import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ZodError, type ZodType } from "zod";

import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifySchema,
} from "./auth.schemas.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthRateLimit, AuthRateLimitGuard } from "./auth-rate-limit.guard.js";
import { AuthService } from "./auth.service.js";

import type { AuthenticatedUser } from "./auth.service.js";

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new BadRequestException("Pedido invalido");
    }

    throw error;
  }
}

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("register")
  @AuthRateLimit({ limit: 5, windowMs: 60 * 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  register(@Body() body: unknown) {
    return this.authService.register(parseBody(registerSchema, body));
  }

  @Post("verify")
  @AuthRateLimit({ limit: 10, windowMs: 15 * 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  verify(@Body() body: unknown) {
    return this.authService.verify(parseBody(verifySchema, body));
  }

  @Post("login")
  @AuthRateLimit({ limit: 5, windowMs: 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  login(@Body() body: unknown) {
    return this.authService.login(parseBody(loginSchema, body));
  }

  @Post("refresh")
  @AuthRateLimit({ limit: 30, windowMs: 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  refresh(@Body() body: unknown) {
    return this.authService.refresh(parseBody(refreshSchema, body));
  }

  @Post("forgot-password")
  @AuthRateLimit({ limit: 3, windowMs: 15 * 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  forgotPassword(@Body() body: unknown) {
    return this.authService.forgotPassword(
      parseBody(forgotPasswordSchema, body),
    );
  }

  @Post("reset-password")
  @AuthRateLimit({ limit: 5, windowMs: 15 * 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(parseBody(resetPasswordSchema, body));
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user);
  }

  @Post("logout")
  @AuthRateLimit({ limit: 30, windowMs: 60 * 1000 })
  @UseGuards(AuthRateLimitGuard)
  logout(@Body() body: unknown) {
    return this.authService.logout(parseBody(logoutSchema, body));
  }
}
