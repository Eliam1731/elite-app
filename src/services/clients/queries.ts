import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ClientRecord } from "@/types/database";

export const getClients = cache(async (): Promise<ClientRecord[]> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
});

export const getClientById = cache(
  async (clientId: string): Promise<ClientRecord | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
);
