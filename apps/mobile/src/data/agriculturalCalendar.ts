export type AgriculturalMonthId =
  | "sep"
  | "oct"
  | "nov"
  | "dec"
  | "jan"
  | "feb"
  | "mar"
  | "apr"
  | "may"
  | "jun"
  | "jul"
  | "aug";

export interface AgriculturalMonth {
  id: AgriculturalMonthId;
  label: string;
  shortLabel: string;
  season: "rain" | "dry";
}

export type AgriculturalPhaseTone =
  "soil" | "planting" | "care" | "harvest" | "postHarvest" | "pending";

export interface AgriculturalPhase {
  id: string;
  label: string;
  months: AgriculturalMonthId[];
  tone: AgriculturalPhaseTone;
}

export interface AgriculturalCropGroup {
  id: string;
  title: string;
  crops: string[];
  sourceLabel: string;
  status: "complete" | "partial";
  notes: string;
  phases: AgriculturalPhase[];
}

export const agriculturalMonths: AgriculturalMonth[] = [
  { id: "sep", label: "Setembro", shortLabel: "Set", season: "rain" },
  { id: "oct", label: "Outubro", shortLabel: "Out", season: "rain" },
  { id: "nov", label: "Novembro", shortLabel: "Nov", season: "dry" },
  { id: "dec", label: "Dezembro", shortLabel: "Dez", season: "dry" },
  { id: "jan", label: "Janeiro", shortLabel: "Jan", season: "dry" },
  { id: "feb", label: "Fevereiro", shortLabel: "Fev", season: "dry" },
  { id: "mar", label: "Março", shortLabel: "Mar", season: "dry" },
  { id: "apr", label: "Abril", shortLabel: "Abr", season: "dry" },
  { id: "may", label: "Maio", shortLabel: "Mai", season: "rain" },
  { id: "jun", label: "Junho", shortLabel: "Jun", season: "rain" },
  { id: "jul", label: "Julho", shortLabel: "Jul", season: "rain" },
  { id: "aug", label: "Agosto", shortLabel: "Ago", season: "rain" },
];

export const agriculturalCropGroups: AgriculturalCropGroup[] = [
  {
    id: "cereais-sequeiro",
    title: "Cereais de sequeiro",
    crops: ["Sorgo", "Milho", "Arroz de sequeiro", "Niebé"],
    sourceLabel: "Cultivos de Cereais",
    status: "complete",
    notes:
      "Grupo indicado no calendário agrícola original para culturas de sequeiro.",
    phases: [
      {
        id: "preparacao",
        label: "Preparação da terra",
        months: ["mar", "apr", "may"],
        tone: "soil",
      },
      {
        id: "plantacao",
        label: "Plantação",
        months: ["jun", "jul"],
        tone: "planting",
      },
      {
        id: "capinacao",
        label: "Capinação",
        months: ["jun", "jul", "aug", "sep"],
        tone: "care",
      },
      {
        id: "colheita",
        label: "Colheita",
        months: ["nov", "dec"],
        tone: "harvest",
      },
      {
        id: "debulha",
        label: "Debulha",
        months: ["dec", "jan"],
        tone: "postHarvest",
      },
    ],
  },
  {
    id: "arroz-terras-baixas",
    title: "Arroz nas terras baixas",
    crops: ["Arroz de bolanha", "Arroz de terras baixas"],
    sourceLabel: "Cultivo de Arroz nas terras baixas",
    status: "complete",
    notes:
      "Calendário específico para zonas baixas. Confirmar água, drenagem e pH antes de recomendar.",
    phases: [
      {
        id: "preparacao",
        label: "Preparação da terra",
        months: ["mar", "apr", "may"],
        tone: "soil",
      },
      {
        id: "plantacao",
        label: "Plantação",
        months: ["sep", "oct"],
        tone: "planting",
      },
      {
        id: "capinacao",
        label: "Capinação",
        months: ["jul", "aug", "oct"],
        tone: "care",
      },
      {
        id: "colheita",
        label: "Colheita",
        months: ["dec", "jan"],
        tone: "harvest",
      },
      {
        id: "debulha",
        label: "Debulha",
        months: ["dec", "jan"],
        tone: "postHarvest",
      },
    ],
  },
  {
    id: "amendoim",
    title: "Amendoim",
    crops: ["Amendoim"],
    sourceLabel: "Cultivo de Amendoin",
    status: "partial",
    notes:
      "A folha marca preparação, plantação, capinação e colheita. Debulha ficou sem mês marcado.",
    phases: [
      {
        id: "preparacao",
        label: "Preparação da terra",
        months: ["mar", "apr", "may"],
        tone: "soil",
      },
      {
        id: "plantacao",
        label: "Plantação",
        months: ["jun", "jul"],
        tone: "planting",
      },
      {
        id: "capinacao",
        label: "Capinação",
        months: ["jun", "jul", "aug", "sep"],
        tone: "care",
      },
      {
        id: "colheita",
        label: "Colheita",
        months: ["nov", "dec"],
        tone: "harvest",
      },
      {
        id: "debulha",
        label: "Debulha",
        months: [],
        tone: "pending",
      },
    ],
  },
  {
    id: "tuberculos",
    title: "Tubérculos",
    crops: ["Mandioca", "Batata doce", "Inhame", "Manfafa", "Batata inglesa"],
    sourceLabel: "Cultivo Tuberculos",
    status: "complete",
    notes:
      "Grupo indicado para culturas de raiz. A app mostra o período comum do grupo.",
    phases: [
      {
        id: "preparacao",
        label: "Preparação da terra",
        months: ["nov"],
        tone: "soil",
      },
      {
        id: "plantacao",
        label: "Plantação",
        months: ["nov"],
        tone: "planting",
      },
      {
        id: "capinacao",
        label: "Capinação",
        months: ["dec", "jan", "feb", "mar", "apr"],
        tone: "care",
      },
      {
        id: "colheita",
        label: "Colheita",
        months: ["may", "jun"],
        tone: "harvest",
      },
    ],
  },
  {
    id: "legumes",
    title: "Legumes",
    crops: ["Pepino"],
    sourceLabel: "Cultivo Legumes",
    status: "partial",
    notes:
      "O grupo existe na folha, mas não tem meses marcados. Deve ser completado antes de virar recomendação.",
    phases: [
      {
        id: "preparacao",
        label: "Preparação da terra",
        months: [],
        tone: "pending",
      },
      {
        id: "plantacao",
        label: "Plantação",
        months: [],
        tone: "pending",
      },
      {
        id: "capinacao",
        label: "Capinação",
        months: [],
        tone: "pending",
      },
      {
        id: "colheita",
        label: "Colheita",
        months: [],
        tone: "pending",
      },
    ],
  },
];

export function getCurrentAgriculturalMonthId(date = new Date()) {
  const calendarMonth = date.getMonth();
  const ids: AgriculturalMonthId[] = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];

  return ids[calendarMonth];
}
