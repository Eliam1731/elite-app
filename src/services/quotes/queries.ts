import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { QuoteDetailRecord, QuoteListRecord } from "@/types/database";

export const getQuotes = cache(async (): Promise<QuoteListRecord[]> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("quotes")
    .select("*, clients(name, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as QuoteListRecord[];
});

export const getQuoteById = cache(
  async (quoteId: string): Promise<QuoteDetailRecord | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("quotes")
      .select("*, clients(*), quote_items(*)")
      .eq("id", quoteId)
      .order("sort_order", {
        foreignTable: "quote_items",
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as QuoteDetailRecord | null;
  },
);
