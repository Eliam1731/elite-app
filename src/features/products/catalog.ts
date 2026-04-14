export const PRODUCT_OPTIONS = [
  "Playera manga corta",
  "Playera sin mangas",
  "Playera manga larga",
  "Playera tipo playa",
  "Short",
  "Licra",
  "Chamarra",
  "Pants",
] as const;

export type ProductOption = (typeof PRODUCT_OPTIONS)[number];
