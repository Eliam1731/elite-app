import type { OrderCostType } from "@/types/database";

export const COST_TYPE_OPTIONS = [
  "materiales",
  "mano_de_obra",
  "impresion",
  "bordado",
  "envio",
  "extras",
  "otro",
] as const satisfies readonly OrderCostType[];
