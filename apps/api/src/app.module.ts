import { Controller, Get, Module } from "@nestjs/common";

import { AssistantController } from "./modules/assistant/assistant.controller.js";
import { ConsultationsController } from "./modules/consultations/consultations.controller.js";
import { CropsController } from "./modules/crops/crops.controller.js";
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
  imports: [DatabaseModule],
  controllers: [
    StatusController,
    RegionsController,
    CropsController,
    ConsultationsController,
    AssistantController,
    SyncController,
    UssdPreviewController,
  ],
  providers: [PilotDataService, AssistantService],
})
export class AppModule {}
