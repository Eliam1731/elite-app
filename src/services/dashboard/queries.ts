import { cache } from "react";

import { roundCurrency, sumMoney } from "@/features/quotes/calculations";
import { normalizeOrderStatus } from "@/features/orders/status";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardOrderAmountItem = {
  orderId: string;
  folio: string;
  clientName: string;
  amount: number;
  status: string;
};

type DashboardShippingExpenseItem = {
  id: string;
  orderId: string | null;
  folio: string | null;
  clientName: string | null;
  amount: number;
  expenseDate: string;
  notes: string | null;
};

type MonthlyDashboardSummary = {
  salesThisMonth: number;
  collectedThisMonth: number;
  pendingCollection: number;
  incomeOrders: DashboardOrderAmountItem[];
  pendingOrders: DashboardOrderAmountItem[];
  shippingExpensesThisMonth: number;
  shippingExpenses: DashboardShippingExpenseItem[];
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

function getOrderClientName(
  order:
    | {
        clients?:
          | { name?: string | null }
          | Array<{ name?: string | null }>
          | null;
      }
    | null
    | undefined,
) {
  const client = Array.isArray(order?.clients)
    ? order.clients[0]
    : order?.clients;

  return client?.name?.trim() || "Cliente sin nombre";
}

export const getMonthlyDashboardSummary = cache(
  async (): Promise<MonthlyDashboardSummary> => {
    const supabase = createServerSupabaseClient();

    if (!supabase) {
      return {
        salesThisMonth: 0,
        collectedThisMonth: 0,
        pendingCollection: 0,
        incomeOrders: [],
        pendingOrders: [],
        shippingExpensesThisMonth: 0,
        shippingExpenses: [],
        monthLabel: getMonthBounds().monthLabel,
      };
    }

    const { monthStart, nextMonthStart, monthLabel } = getMonthBounds();

    const [ordersThisMonthResult, paymentsThisMonthResult, allOrdersResult, allPaymentsResult] =
      await Promise.all([
      supabase
        .from("orders")
        .select("id, folio, total_amount, status, created_at, clients(name)")
        .gte("created_at", `${monthStart}T00:00:00Z`)
        .lt("created_at", `${nextMonthStart}T00:00:00Z`),
      supabase
        .from("payments")
        .select("order_id, amount, payment_date")
        .gte("payment_date", monthStart)
        .lt("payment_date", nextMonthStart),
      supabase
        .from("orders")
        .select("id, folio, total_amount, status, clients(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("order_id, amount"),
    ]);

    const [shippingExpensesResult] = await Promise.all([
      supabase
        .from("shipping_expenses")
        .select("id, order_id, amount, expense_date, notes")
        .gte("expense_date", monthStart)
        .lt("expense_date", nextMonthStart)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (ordersThisMonthResult.error) {
      throw new Error(
        ordersThisMonthResult.error?.message || "No se pudieron consultar los pedidos.",
      );
    }

    if (paymentsThisMonthResult.error) {
      throw new Error(
        paymentsThisMonthResult.error?.message || "No se pudieron consultar los pagos.",
      );
    }

    if (allOrdersResult.error) {
      throw new Error(
        allOrdersResult.error?.message || "No se pudieron consultar los pedidos.",
      );
    }

    if (allPaymentsResult.error) {
      throw new Error(
        allPaymentsResult.error?.message || "No se pudieron consultar los pagos.",
      );
    }

    if (shippingExpensesResult.error) {
      throw new Error(
        shippingExpensesResult.error?.message ||
          "No se pudieron consultar los gastos de envio.",
      );
    }

    const salesThisMonth = sumByAmount(
      ordersThisMonthResult.data ?? [],
      (order) => Number(order.total_amount ?? 0),
    );
    const collectedThisMonth = sumByAmount(
      paymentsThisMonthResult.data ?? [],
      (payment) => Number(payment.amount ?? 0),
    );
    const allOrders = allOrdersResult.data ?? [];
    const allPayments = allPaymentsResult.data ?? [];
    const paymentsThisMonth = paymentsThisMonthResult.data ?? [];
    const shippingExpensesRaw = shippingExpensesResult.data ?? [];
    const orderMap = new Map(allOrders.map((order) => [order.id, order]));

    const incomeByOrderId = new Map<string, number>();
    paymentsThisMonth.forEach((payment) => {
      const current = incomeByOrderId.get(payment.order_id) ?? 0;
      incomeByOrderId.set(
        payment.order_id,
        roundCurrency(current + Number(payment.amount ?? 0)),
      );
    });

    const incomeOrders = Array.from(incomeByOrderId.entries())
      .map(([orderId, amount]) => {
        const order = orderMap.get(orderId);

        return {
          orderId,
          folio: order?.folio ?? "Pedido sin folio",
          clientName: getOrderClientName(order),
          amount,
          status: normalizeOrderStatus(order?.status ?? "borrador"),
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const paidByOrderId = new Map<string, number>();
    allPayments.forEach((payment) => {
      const current = paidByOrderId.get(payment.order_id) ?? 0;
      paidByOrderId.set(
        payment.order_id,
        roundCurrency(current + Number(payment.amount ?? 0)),
      );
    });

    const pendingOrders = allOrders
      .map((order) => {
        const totalAmount = Number(order.total_amount ?? 0);
        const paidAmount = paidByOrderId.get(order.id) ?? 0;
        const pendingAmount = roundCurrency(Math.max(totalAmount - paidAmount, 0));

        return {
          orderId: order.id,
          folio: order.folio,
          clientName: getOrderClientName(order),
          amount: pendingAmount,
          status: normalizeOrderStatus(order.status),
        };
      })
      .filter((order) => order.amount > 0 && order.status !== "cancelado")
      .sort((a, b) => b.amount - a.amount);

    const pendingCollection = sumByAmount(pendingOrders, (order) => order.amount);
    const shippingExpensesThisMonth = sumByAmount(
      shippingExpensesRaw,
      (expense) => Number(expense.amount ?? 0),
    );
    const shippingExpenses = shippingExpensesRaw.map((expense) => {
      const order = expense.order_id ? orderMap.get(expense.order_id) : null;

      return {
        id: expense.id,
        orderId: expense.order_id,
        folio: order?.folio ?? null,
        clientName: order ? getOrderClientName(order) : null,
        amount: Number(expense.amount ?? 0),
        expenseDate: expense.expense_date,
        notes: expense.notes ?? null,
      };
    });

    return {
      salesThisMonth,
      collectedThisMonth,
      pendingCollection,
      incomeOrders,
      pendingOrders,
      shippingExpensesThisMonth,
      shippingExpenses,
      monthLabel,
    };
  },
);
