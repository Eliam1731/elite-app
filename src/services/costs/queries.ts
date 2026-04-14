import { cache } from "react";

import { sumMoney } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderCostRecord } from "@/types/database";

type OrderCostsResult = {
  available: boolean;
  costs: OrderCostRecord[];
};

function isMissingTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as { code?: string };
  return candidate.code === "PGRST205";
}

export const getOrderCostsByOrderId = cache(
  async (orderId: string): Promise<OrderCostsResult> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return { available: false, costs: [] };
    }

    const { data, error } = await supabase
      .from("order_costs")
      .select("*")
      .eq("order_id", orderId)
      .order("cost_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      if (isMissingTableError(error)) {
        return { available: false, costs: [] };
      }

      throw new Error(error?.message || "No se pudieron consultar los costos.");
    }

    return {
      available: true,
      costs: (data ?? []) as OrderCostRecord[],
    };
  },
);

export function getTotalOrderCosts(costs: OrderCostRecord[]) {
  return sumMoney(costs.map((cost) => cost.amount));
}
