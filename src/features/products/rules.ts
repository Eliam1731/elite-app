import type { ProductRecord } from "@/types/database";

export const SIMPLE_CAPTURE_PRODUCT_NAMES = ["short", "licra", "pants"] as const;

export function normalizeProductName(value: string) {
  return value.trim().toLowerCase();
}

export function getCaptureModeFromProductName(
  name: string,
): ProductRecord["capture_mode"] {
  const normalized = normalizeProductName(name);
  return SIMPLE_CAPTURE_PRODUCT_NAMES.includes(
    normalized as (typeof SIMPLE_CAPTURE_PRODUCT_NAMES)[number],
  )
    ? "simple"
    : "full";
}
