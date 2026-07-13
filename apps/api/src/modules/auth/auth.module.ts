import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller.js";
import { AuthGuard } from "./auth.guard.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { RolesGuard } from "./roles.guard.js";

@Module({
  controllers: [AuthController],
  exports: [AuthGuard, AuthRepository, RolesGuard],
  providers: [AuthRepository, AuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}
