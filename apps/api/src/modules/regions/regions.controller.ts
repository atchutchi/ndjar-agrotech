import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from "@nestjs/common";

import { PilotDataService } from "../../services/pilot-data.service.js";

@Controller("regions")
export class RegionsController {
  constructor(
    @Inject(PilotDataService) private readonly pilotData: PilotDataService,
  ) {}

  @Get()
  listRegions() {
    return {
      data: this.pilotData.getRegions(),
      meta: {
        source: "fixtures",
        count: this.pilotData.getRegions().length,
      },
    };
  }

  @Get(":regionId")
  getRegion(@Param("regionId") regionId: string) {
    const region = this.pilotData.getRegion(regionId);

    if (!region) {
      throw new NotFoundException({
        message: "Region not found",
        regionId,
      });
    }

    return {
      data: region,
      meta: {
        source: "fixtures",
      },
    };
  }
}
