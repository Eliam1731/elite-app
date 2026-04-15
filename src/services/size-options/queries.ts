import { cache } from "react";

import { DEFAULT_SIZE_OPTIONS } from "@/features/sizes/catalog";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SizeOptionRecord } from "@/types/database";

type SizeOptionsResult = {
  options: SizeOptionRecord[];
  available: boolean;
};

function mapDefaultSizeOptions(): SizeOptionRecord[] {
  const now = new Date(0).toISOString();

  return DEFAULT_SIZE_OPTIONS.map((option, index) => ({
    id: `default-${index + 1}`,
    label: option.label,
    sort_order: index + 1,
    is_active: true,
    created_at: now,
    updated_at: now,
  }));
}

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string };
  return candidate.code === "PGRST205";
}

export const getSizeOptionsResult = cache(async (): Promise<SizeOptionsResult> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      options: mapDefaultSizeOptions(),
      available: false,
    };
  }

  const { data, error } = await supabase
    .from("size_options")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    if (isMissingTableError(error)) {
      return {
        options: mapDefaultSizeOptions(),
        available: false,
      };
    }

    throw new Error(error.message);
  }

  return {
    options: (data ?? []) as SizeOptionRecord[],
    available: true,
  };
});

export const getSizeOptions = cache(async (): Promise<SizeOptionRecord[]> => {
  const result = await getSizeOptionsResult();
  return result.options;
});

export const getActiveSizeOptions = cache(async (): Promise<SizeOptionRecord[]> => {
  const result = await getSizeOptionsResult();
  return result.options.filter((option) => option.is_active);
});

export const getSizeOptionById = cache(
  async (sizeOptionId: string): Promise<SizeOptionRecord | null> => {
    const result = await getSizeOptionsResult();

    return result.options.find((option) => option.id === sizeOptionId) ?? null;
  },
);

export async function getAllowedSizeOptionsForSelection(
  _captureMode: "full" | "simple",
  currentValue?: string | null,
): Promise<SizeOptionRecord[]> {
  const options = await getActiveSizeOptions();
  const normalizedCurrentValue = currentValue?.trim() ?? "";

  if (
    !normalizedCurrentValue ||
    normalizedCurrentValue.toUpperCase() === "POR DEFINIR" ||
    options.some(
      (option) => option.label === normalizedCurrentValue,
    )
  ) {
    return options;
  }

  return [
    {
      id: `current-${normalizedCurrentValue}`,
      label: normalizedCurrentValue,
      is_active: false,
      created_at: "",
      updated_at: "",
    },
    ...options,
  ];
}
