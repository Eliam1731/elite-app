import type { SizeOptionRecord } from "@/types/database";

export function getSizeSelectOptions(
  options: SizeOptionRecord[],
  currentValue?: string | null,
) {
  const normalizedCurrentValue = currentValue?.trim() ?? "";

  return options.map((option) => {
    const isCurrentLegacy =
      normalizedCurrentValue !== "" && option.label === normalizedCurrentValue && !option.is_active;

    return {
      value: option.label,
      label: isCurrentLegacy ? `${option.label} (actual)` : option.label,
    };
  });
}

export function isAllowedSizeSelection(
  value: string,
  options: SizeOptionRecord[],
  currentValue?: string | null,
) {
  const normalizedValue = value.trim();
  const normalizedCurrentValue = currentValue?.trim() ?? "";

  return (
    options.some((option) => option.label === normalizedValue) ||
    normalizedValue === normalizedCurrentValue
  );
}
