import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { BusinessSettingsRecord } from "@/types/database";

export const getBusinessSettings = cache(
  async (): Promise<BusinessSettingsRecord | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
);
