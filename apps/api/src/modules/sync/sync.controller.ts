import { Controller, Get, Inject } from "@nestjs/common";

import { PilotDataService } from "../../services/pilot-data.service.js";

@Controller("sync")
export class SyncController {
  constructor(
    @Inject(PilotDataService) private readonly pilotData: PilotDataService,
  ) {}

  @Get()
  getOfflineSnapshot() {
    return {
      mode: "offline-bootstrap",
      generatedAt: new Date().toISOString(),
      versions: this.pilotData.getOfflineVersions(),
      data: {
        regions: this.pilotData.getRegions(),
        crops: this.pilotData.getCrops(),
        calendar: this.pilotData.getCalendarTasks(),
      },
      seedSummary: this.pilotData.getSeedSummary(),
    };
  }
}
