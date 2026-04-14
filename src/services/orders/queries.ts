import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderDetailRecord, OrderListRecord } from "@/types/database";

export const getOrders = cache(async (): Promise<OrderListRecord[]> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, clients(name, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrderListRecord[];
});

export const getOrderById = cache(
  async (orderId: string): Promise<OrderDetailRecord | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, clients(*), order_items(*, product:products(*)), quotes(*)",
      )
      .eq("id", orderId)
      .order("sort_order", {
        foreignTable: "order_items",
        ascending: true,
      })
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data as OrderDetailRecord | null;
  },
);

export const getOrderIdByQuoteId = cache(
  async (quoteId: string): Promise<string | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id")
      .eq("quote_id", quoteId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.id ?? null;
  },
);
