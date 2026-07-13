import { Controller, Get, Module } from "@nestjs/common";

import { AssistantController } from "./modules/assistant/assistant.controller.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ConsultationsController } from "./modules/consultations/consultations.controller.js";
import { CropsController } from "./modules/crops/crops.controller.js";
import { EntitlementsController } from "./modules/entitlements/entitlements.controller.js";
import { EntitlementsRepository } from "./modules/entitlements/entitlements.repository.js";
import { EntitlementsService } from "./modules/entitlements/entitlements.service.js";
import { RegionsController } from "./modules/regions/regions.controller.js";
import { SyncController } from "./modules/sync/sync.controller.js";
import { UssdPreviewController } from "./modules/ussd-preview/ussd-preview.controller.js";
import { DatabaseModule } from "./modules/database/database.module.js";
import { AssistantService } from "./services/assistant.service.js";
import { PilotDataService } from "./services/pilot-data.service.js";

@Controller()
class StatusController {
  @Get()
  getRoot() {
    return {
      status: "ok",
      service: "@ndjar/api",
      mode: "fixture-backed",
      routes: [
        "/health",
        "/regions",
        "/crops",
        "/consultations",
        "/assistant/ask",
        "/auth/register",
        "/entitlements/me",
        "/sync",
        "/ussd-preview",
      ],
    };
  }

  @Get("health")
  getHealth() {
    return {
      status: "ok",
      service: "@ndjar/api",
      mode: "fixture-backed",
    };
  }
}

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    StatusController,
    RegionsController,
    CropsController,
    ConsultationsController,
    AssistantController,
    SyncController,
    UssdPreviewController,
    EntitlementsController,
  ],
  providers: [
    PilotDataService,
    AssistantService,
    EntitlementsRepository,
    EntitlementsService,
  ],
})
export class AppModule {}
