import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
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
  register(@Body() body: unknown) {
    return this.authService.register(parseBody(registerSchema, body));
  }

  @Post("verify")
  verify(@Body() body: unknown) {
    return this.authService.verify(parseBody(verifySchema, body));
  }

  @Post("login")
  login(@Body() body: unknown) {
    return this.authService.login(parseBody(loginSchema, body));
  }

  @Post("refresh")
  refresh(@Body() body: unknown) {
    return this.authService.refresh(parseBody(refreshSchema, body));
  }

  @Post("forgot-password")
  forgotPassword(@Body() body: unknown) {
    return this.authService.forgotPassword(
      parseBody(forgotPasswordSchema, body),
    );
  }

  @Post("reset-password")
  resetPassword(@Body() body: unknown) {
    return this.authService.resetPassword(parseBody(resetPasswordSchema, body));
  }

  @Get("me")
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.me(request.user);
  }

  @Post("logout")
  logout(@Body() body: unknown) {
    return this.authService.logout(parseBody(logoutSchema, body));
  }
}
