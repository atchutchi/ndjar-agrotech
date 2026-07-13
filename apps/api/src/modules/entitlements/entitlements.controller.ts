import {
  Controller,
  Get,
  Inject,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";

import { AuthGuard } from "../auth/auth.guard.js";
import { EntitlementsService } from "./entitlements.service.js";

import type { AuthenticatedUser } from "../auth/auth.service.js";

interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}

@Controller("entitlements")
export class EntitlementsController {
  constructor(
    @Inject(EntitlementsService)
    private readonly service: EntitlementsService,
  ) {}

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    if (!request.user) {
      throw new UnauthorizedException("Utilizador não autenticado");
    }

    return this.service.getCurrentUserEntitlements(request.user.id);
  }
}
