import { cache } from "react";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRecord } from "@/types/database";

export const getProducts = cache(async (): Promise<ProductRecord[]> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductRecord[];
});

export const getActiveProducts = cache(async (): Promise<ProductRecord[]> => {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductRecord[];
});

export const getProductById = cache(
  async (productId: string): Promise<ProductRecord | null> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as ProductRecord | null) ?? null;
  },
);
