import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from "@nestjs/common";

import { PilotDataService } from "../../services/pilot-data.service.js";

@Controller("crops")
export class CropsController {
  constructor(
    @Inject(PilotDataService) private readonly pilotData: PilotDataService,
  ) {}

  @Get()
  listCrops() {
    return {
      data: this.pilotData.getCrops(),
      meta: {
        source: "fixtures",
        count: this.pilotData.getCrops().length,
      },
    };
  }

  @Get(":cropId")
  getCrop(@Param("cropId") cropId: string) {
    const crop = this.pilotData.getCrop(cropId);

    if (!crop) {
      throw new NotFoundException({
        message: "Crop not found",
        cropId,
      });
    }

    return {
      data: crop,
      meta: {
        source: "fixtures",
      },
    };
  }
}
