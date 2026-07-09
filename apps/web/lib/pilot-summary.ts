import {
  pilotCalendarTasks,
  pilotCrops,
  pilotSouthRegions,
} from "@ndjar/fixtures";

export interface PilotOverview {
  locationLabel: string;
  regionName: string;
  sectorName: string;
  communityCount: number;
  cropCount: number;
  sampleCount: number;
  calendarTaskCount: number;
  totalAreaHectares: number;
  communities: string[];
  cropLabels: string[];
  phExample: {
    value: number;
    status: string;
    className: string;
  };
}

export function buildPilotOverview(): PilotOverview {
  const [pilotRegion] = pilotSouthRegions;

  if (!pilotRegion) {
    throw new Error("Pilot South fixtures must include one region.");
  }

  const [phSample] = pilotRegion.phSamples;

  if (!phSample) {
    throw new Error("Pilot South fixtures must include one pH sample.");
  }

  return {
    locationLabel: `${pilotRegion.regionName} / ${pilotRegion.sectorName}`,
    regionName: pilotRegion.regionName,
    sectorName: pilotRegion.sectorName,
    communityCount: pilotRegion.communities.length,
    cropCount: pilotCrops.length,
    sampleCount: pilotRegion.phSamples.length,
    calendarTaskCount: pilotCalendarTasks.length,
    totalAreaHectares: pilotRegion.communities.reduce(
      (sum, community) => sum + community.areaHectares,
      0,
    ),
    communities: pilotRegion.communities.map((community) => community.name),
    cropLabels: pilotCrops.map((crop) => crop.label),
    phExample: {
      value: phSample.ph,
      status: phSample.status,
      className: phSample.phClass,
    },
  };
}
