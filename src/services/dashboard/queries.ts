import { cache } from "react";

import { roundCurrency, sumMoney } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type MonthlyDashboardSummary = {
  salesThisMonth: number;
  collectedThisMonth: number;
  pendingCollection: number;
  monthLabel: string;
};

const BUSINESS_TIME_ZONE = "America/Mexico_City";

function getCurrentMonthParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "1");

  return { year, month };
}

function getMonthBounds(now = new Date()) {
  const { year, month } = getCurrentMonthParts(now);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextMonthStart = `${nextMonthYear}-${String(nextMonth).padStart(2, "0")}-01`;
  const monthLabel = new Intl.DateTimeFormat("es-MX", {
    timeZone: BUSINESS_TIME_ZONE,
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthStart}T12:00:00Z`));

  return { monthStart, nextMonthStart, monthLabel };
}

function sumByAmount<T>(items: T[], getAmount: (item: T) => number) {
  return sumMoney(items.map((item) => getAmount(item)));
}

export const getMonthlyDashboardSummary = cache(
  async (): Promise<MonthlyDashboardSummary> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return {
        salesThisMonth: 0,
        collectedThisMonth: 0,
        pendingCollection: 0,
        monthLabel: getMonthBounds().monthLabel,
      };
    }

    const { monthStart, nextMonthStart, monthLabel } = getMonthBounds();

    const [ordersResult, paymentsResult] = await Promise.all([
      supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte("created_at", `${monthStart}T00:00:00Z`)
        .lt("created_at", `${nextMonthStart}T00:00:00Z`),
      supabase
        .from("payments")
        .select("amount, payment_date")
        .gte("payment_date", monthStart)
        .lt("payment_date", nextMonthStart),
    ]);

    if (ordersResult.error) {
      throw new Error(ordersResult.error?.message || "No se pudieron consultar los pedidos.");
    }

    if (paymentsResult.error) {
      throw new Error(paymentsResult.error?.message || "No se pudieron consultar los pagos.");
    }

    const salesThisMonth = sumByAmount(
      ordersResult.data ?? [],
      (order) => Number(order.total_amount ?? 0),
    );
    const collectedThisMonth = sumByAmount(
      paymentsResult.data ?? [],
      (payment) => Number(payment.amount ?? 0),
    );
    const pendingCollection = roundCurrency(
      Math.max(salesThisMonth - collectedThisMonth, 0),
    );

    return {
      salesThisMonth,
      collectedThisMonth,
      pendingCollection,
      monthLabel,
    };
  },
);
