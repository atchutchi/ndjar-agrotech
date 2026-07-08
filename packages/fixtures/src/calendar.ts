import type { AgronomicSourceStatus } from "@ndjar/domain";

export interface PilotCalendarTask {
  id: string;
  month:
    | "September"
    | "October"
    | "November"
    | "December"
    | "January"
    | "February"
    | "March"
    | "April"
    | "May"
    | "June"
    | "July"
    | "August";
  season: "rainy" | "dry";
  taskType: "preparation" | "planting" | "weeding" | "harvest" | "threshing";
  summary: string;
  sourceStatus: AgronomicSourceStatus;
}

export const pilotCalendarTasks: PilotCalendarTask[] = [
  {
    id: "sep-preparation",
    month: "September",
    season: "rainy",
    taskType: "preparation",
    summary: "Prepare plots and organise inputs for the first rains.",
    sourceStatus: "estimated",
  },
  {
    id: "oct-planting",
    month: "October",
    season: "rainy",
    taskType: "planting",
    summary: "Start planting for crops that follow the main rainy cycle.",
    sourceStatus: "estimated",
  },
  {
    id: "nov-weeding",
    month: "November",
    season: "rainy",
    taskType: "weeding",
    summary: "Carry out early weeding and field cleaning while crops establish.",
    sourceStatus: "estimated",
  },
  {
    id: "dec-weeding",
    month: "December",
    season: "dry",
    taskType: "weeding",
    summary: "Maintain parcels and control regrowth where moisture remains.",
    sourceStatus: "estimated",
  },
  {
    id: "jan-harvest",
    month: "January",
    season: "dry",
    taskType: "harvest",
    summary: "Harvest early-maturing crops and store produce for household use.",
    sourceStatus: "estimated",
  },
  {
    id: "feb-threshing",
    month: "February",
    season: "dry",
    taskType: "threshing",
    summary: "Dry and thresh harvested grain where applicable.",
    sourceStatus: "estimated",
  },
  {
    id: "mar-preparation",
    month: "March",
    season: "dry",
    taskType: "preparation",
    summary: "Repair bunds, tools and access paths before the next campaign.",
    sourceStatus: "estimated",
  },
  {
    id: "apr-preparation",
    month: "April",
    season: "dry",
    taskType: "preparation",
    summary: "Clear plots and prepare seed reserves for the coming season.",
    sourceStatus: "estimated",
  },
  {
    id: "may-planting",
    month: "May",
    season: "rainy",
    taskType: "planting",
    summary: "Begin planting when rains become more regular.",
    sourceStatus: "estimated",
  },
  {
    id: "jun-weeding",
    month: "June",
    season: "rainy",
    taskType: "weeding",
    summary: "Weed actively growing plots and monitor crop development.",
    sourceStatus: "estimated",
  },
  {
    id: "jul-harvest",
    month: "July",
    season: "rainy",
    taskType: "harvest",
    summary: "Harvest crops ready within the rainy-season window.",
    sourceStatus: "estimated",
  },
  {
    id: "aug-threshing",
    month: "August",
    season: "rainy",
    taskType: "threshing",
    summary: "Finish threshing and post-harvest handling before storage or sale.",
    sourceStatus: "estimated",
  },
];
