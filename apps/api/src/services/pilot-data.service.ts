import { Injectable } from "@nestjs/common";
import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
} from "@ndjar/fixtures";
import { pilotSeedData } from "@ndjar/database/seed";

@Injectable()
export class PilotDataService {
  getRegions() {
    return pilotSouthRegions;
  }

  getRegion(regionId: string) {
    return pilotSouthRegions.find((region) => region.id === regionId) ?? null;
  }

  getCrops() {
    return pilotCrops;
  }

  getCrop(cropId: string) {
    return pilotCrops.find((crop) => crop.id === cropId) ?? null;
  }

  getCalendarTasks() {
    return pilotCalendarTasks;
  }

  getOfflineVersions() {
    return {
      regions: "pilot-south-regions-v1",
      crops: "pilot-crops-v1",
      calendar: "pilot-calendar-v1",
      databaseSeed: "pilot-seed-v1",
    };
  }

  getSeedSummary() {
    return {
      regions: pilotSeedData.regions.length,
      communities: pilotSeedData.communities.length,
      crops: pilotSeedData.crops.length,
      cropPresence: pilotSeedData.cropPresence.length,
      calendarTasks: pilotSeedData.calendarTasks.length,
    };
  }
}
