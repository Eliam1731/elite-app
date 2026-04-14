import { cache } from "react";

import { sumMoney } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PaymentRecord } from "@/types/database";

export const getPaymentsByOrderId = cache(
  async (orderId: string): Promise<PaymentRecord[]> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PaymentRecord[];
  },
);

export function getTotalPaid(payments: PaymentRecord[]) {
  return sumMoney(payments.map((payment) => payment.amount));
}
