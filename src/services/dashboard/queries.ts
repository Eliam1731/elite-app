import { cache } from "react";

import { roundCurrency, sumMoney } from "@/features/quotes/calculations";
import { getOrderStatusLabel, normalizeOrderStatus } from "@/features/orders/status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CanonicalOrderStatus, OrderStatusRecord } from "@/types/database";

type DashboardOrderBase = {
  id: string;
  folio: string;
  total_amount: number | null;
  status: OrderStatusRecord;
  created_at?: string | null;
  clients?:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

type DashboardPaymentBase = {
  id: string;
  order_id: string;
  amount: number | null;
  payment_date: string;
  payment_type: "down_payment" | "partial" | "final" | null;
  payment_method: string | null;
  notes: string | null;
};

type DashboardShippingExpenseBase = {
  id: string;
  order_id: string | null;
  amount: number | null;
  expense_date: string;
  notes: string | null;
};

export type DashboardSummary = {
  salesThisMonth: number;
  collectedThisMonth: number;
  pendingCollection: number;
  shippingExpensesThisMonth: number;
  monthLabel: string;
};

export type DashboardSalesItem =
  | {
      id: string;
      kind: "income";
      amount: number;
      signedAmount: number;
      eventDate: string;
      orderId: string;
      folio: string;
      clientName: string;
      paymentType: "down_payment" | "partial" | "final";
      paymentTypeLabel: string;
      notes: string | null;
    }
  | {
      id: string;
      kind: "expense";
      amount: number;
      signedAmount: number;
      eventDate: string;
      orderId: string | null;
      folio: string | null;
      clientName: string | null;
      notes: string | null;
    };

export type DashboardIncomeItem = {
  paymentId: string;
  orderId: string;
  folio: string;
  clientName: string;
  amount: number;
  paymentDate: string;
  paymentType: "down_payment" | "partial" | "final";
  paymentTypeLabel: string;
  paymentMethod: string | null;
  notes: string | null;
  orderStatus: CanonicalOrderStatus;
};

export type DashboardPendingItem = {
  orderId: string;
  folio: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: CanonicalOrderStatus;
  statusLabel: string;
};

export type DashboardShippingExpenseItem = {
  id: string;
  orderId: string | null;
  folio: string | null;
  clientName: string | null;
  amount: number;
  expenseDate: string;
  notes: string | null;
};

export type MonthlySalesDetail = {
  total: number;
  monthLabel: string;
  items: DashboardSalesItem[];
};

export type MonthlyIncomeDetail = {
  total: number;
  monthLabel: string;
  items: DashboardIncomeItem[];
};

export type PendingCollectionDetail = {
  total: number;
  items: DashboardPendingItem[];
};

export type MonthlyShippingExpensesDetail = {
  total: number;
  monthLabel: string;
  items: DashboardShippingExpenseItem[];
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

function getOrderClientName(order: DashboardOrderBase | null | undefined) {
  const client = Array.isArray(order?.clients) ? order.clients[0] : order?.clients;
  return client?.name?.trim() || "Cliente sin nombre";
}

function getPaymentTypeLabel(paymentType: DashboardIncomeItem["paymentType"]) {
  switch (paymentType) {
    case "down_payment":
      return "Anticipo";
    case "partial":
      return "Pago parcial";
    case "final":
      return "Liquidado";
    default:
      return "Pago";
  }
}

function getPendingStatusPriority(status: CanonicalOrderStatus) {
  switch (status) {
    case "en_produccion":
      return 0;
    case "aprobado":
      return 1;
    case "entregado":
      return 2;
    case "listo":
      return 3;
    case "borrador":
      return 4;
    default:
      return 5;
  }
}

async function getDashboardBaseData() {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { monthStart, nextMonthStart, monthLabel } = getMonthBounds();

  const [
    ordersResult,
    paymentsResult,
    monthlyPaymentsResult,
    monthlyShippingExpensesResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id, folio, total_amount, status, created_at, clients(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, order_id, amount, payment_date, payment_type, payment_method, notes")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, order_id, amount, payment_date, payment_type, payment_method, notes")
      .gte("payment_date", monthStart)
      .lt("payment_date", nextMonthStart)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("shipping_expenses")
      .select("id, order_id, amount, expense_date, notes")
      .gte("expense_date", monthStart)
      .lt("expense_date", nextMonthStart)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (ordersResult.error) {
    throw new Error(ordersResult.error.message || "No se pudieron consultar los pedidos.");
  }

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message || "No se pudieron consultar los pagos.");
  }

  if (monthlyPaymentsResult.error) {
    throw new Error(
      monthlyPaymentsResult.error.message || "No se pudieron consultar los ingresos del mes.",
    );
  }

  if (monthlyShippingExpensesResult.error) {
    throw new Error(
      monthlyShippingExpensesResult.error.message ||
        "No se pudieron consultar los gastos de envio.",
    );
  }

  return {
    monthLabel,
    allOrders: (ordersResult.data ?? []) as DashboardOrderBase[],
    allPayments: (paymentsResult.data ?? []) as DashboardPaymentBase[],
    monthlyPayments: (monthlyPaymentsResult.data ?? []) as DashboardPaymentBase[],
    monthlyShippingExpenses: (monthlyShippingExpensesResult.data ??
      []) as DashboardShippingExpenseBase[],
  };
}

function buildOrderMap(orders: DashboardOrderBase[]) {
  return new Map(orders.map((order) => [order.id, order]));
}

function buildMonthlySalesDetail(
  monthlyPayments: DashboardPaymentBase[],
  monthlyShippingExpenses: DashboardShippingExpenseBase[],
  orderMap: Map<string, DashboardOrderBase>,
  monthLabel: string,
): MonthlySalesDetail {
  const incomeItems: DashboardSalesItem[] = monthlyPayments.map((payment) => {
    const order = orderMap.get(payment.order_id);
    const paymentType = (payment.payment_type ?? "partial") as DashboardIncomeItem["paymentType"];
    const amount = Number(payment.amount ?? 0);

    return {
      id: payment.id,
      kind: "income",
      amount,
      signedAmount: amount,
      eventDate: payment.payment_date,
      orderId: payment.order_id,
      folio: order?.folio ?? "Pedido sin folio",
      clientName: getOrderClientName(order),
      paymentType,
      paymentTypeLabel: getPaymentTypeLabel(paymentType),
      notes: payment.notes,
    };
  });

  const expenseItems: DashboardSalesItem[] = monthlyShippingExpenses.map((expense) => {
    const order = expense.order_id ? orderMap.get(expense.order_id) : null;
    const amount = Number(expense.amount ?? 0);

    return {
      id: expense.id,
      kind: "expense",
      amount,
      signedAmount: roundCurrency(amount * -1),
      eventDate: expense.expense_date,
      orderId: expense.order_id,
      folio: order?.folio ?? null,
      clientName: order ? getOrderClientName(order) : null,
      notes: expense.notes ?? null,
    };
  });

  const items = [...incomeItems, ...expenseItems].sort((a, b) => {
    if (a.eventDate === b.eventDate) {
      return b.amount - a.amount;
    }

    return a.eventDate < b.eventDate ? 1 : -1;
  });

  return {
    total: roundCurrency(sumByAmount(items, (item) => item.signedAmount)),
    monthLabel,
    items,
  };
}

function buildMonthlyIncomeDetail(
  monthlyPayments: DashboardPaymentBase[],
  orderMap: Map<string, DashboardOrderBase>,
  monthLabel: string,
): MonthlyIncomeDetail {
  const items = monthlyPayments
    .map((payment) => {
      const order = orderMap.get(payment.order_id);
      const paymentType = (payment.payment_type ?? "partial") as DashboardIncomeItem["paymentType"];

      return {
        paymentId: payment.id,
        orderId: payment.order_id,
        folio: order?.folio ?? "Pedido sin folio",
        clientName: getOrderClientName(order),
        amount: Number(payment.amount ?? 0),
        paymentDate: payment.payment_date,
        paymentType,
        paymentTypeLabel: getPaymentTypeLabel(paymentType),
        paymentMethod: payment.payment_method,
        notes: payment.notes,
        orderStatus: normalizeOrderStatus(order?.status ?? "borrador"),
      };
    })
    .sort((a, b) => {
      if (a.paymentDate === b.paymentDate) {
        return b.amount - a.amount;
      }

      return a.paymentDate < b.paymentDate ? 1 : -1;
    });

  return {
    total: sumByAmount(items, (item) => item.amount),
    monthLabel,
    items,
  };
}

function buildPendingCollectionDetail(
  allOrders: DashboardOrderBase[],
  allPayments: DashboardPaymentBase[],
): PendingCollectionDetail {
  const paidByOrderId = new Map<string, number>();

  allPayments.forEach((payment) => {
    const current = paidByOrderId.get(payment.order_id) ?? 0;
    paidByOrderId.set(
      payment.order_id,
      roundCurrency(current + Number(payment.amount ?? 0)),
    );
  });

  const items = allOrders
    .map((order) => {
      const totalAmount = Number(order.total_amount ?? 0);
      const paidAmount = paidByOrderId.get(order.id) ?? 0;
      const pendingAmount = roundCurrency(Math.max(totalAmount - paidAmount, 0));
      const status = normalizeOrderStatus(order.status);

      return {
        orderId: order.id,
        folio: order.folio,
        clientName: getOrderClientName(order),
        totalAmount,
        paidAmount,
        pendingAmount,
        status,
        statusLabel: getOrderStatusLabel(status),
      };
    })
    .filter((item) => item.status !== "cancelado" && item.pendingAmount > 0)
    .sort((a, b) => {
      const priorityDiff =
        getPendingStatusPriority(a.status) - getPendingStatusPriority(b.status);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return b.pendingAmount - a.pendingAmount;
    });

  return {
    total: sumByAmount(items, (item) => item.pendingAmount),
    items,
  };
}

function buildMonthlyShippingExpensesDetail(
  expenses: DashboardShippingExpenseBase[],
  orderMap: Map<string, DashboardOrderBase>,
  monthLabel: string,
): MonthlyShippingExpensesDetail {
  const items = expenses.map((expense) => {
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
    total: sumByAmount(items, (item) => item.amount),
    monthLabel,
    items,
  };
}

export const getDashboardSummary = cache(async (): Promise<DashboardSummary> => {
  const baseData = await getDashboardBaseData();

  if (!baseData) {
    return {
      salesThisMonth: 0,
      collectedThisMonth: 0,
      pendingCollection: 0,
      shippingExpensesThisMonth: 0,
      monthLabel: getMonthBounds().monthLabel,
    };
  }

  const orderMap = buildOrderMap(baseData.allOrders);
  const salesDetail = buildMonthlySalesDetail(
    baseData.monthlyPayments,
    baseData.monthlyShippingExpenses,
    orderMap,
    baseData.monthLabel,
  );
  const incomeDetail = buildMonthlyIncomeDetail(
    baseData.monthlyPayments,
    orderMap,
    baseData.monthLabel,
  );
  const pendingDetail = buildPendingCollectionDetail(
    baseData.allOrders,
    baseData.allPayments,
  );
  const shippingDetail = buildMonthlyShippingExpensesDetail(
    baseData.monthlyShippingExpenses,
    orderMap,
    baseData.monthLabel,
  );

  return {
    salesThisMonth: salesDetail.total,
    collectedThisMonth: incomeDetail.total,
    pendingCollection: pendingDetail.total,
    shippingExpensesThisMonth: shippingDetail.total,
    monthLabel: baseData.monthLabel,
  };
});

export const getMonthlySalesDetail = cache(async (): Promise<MonthlySalesDetail> => {
  const baseData = await getDashboardBaseData();

  if (!baseData) {
    return {
      total: 0,
      monthLabel: getMonthBounds().monthLabel,
      items: [],
    };
  }

  return buildMonthlySalesDetail(
    baseData.monthlyPayments,
    baseData.monthlyShippingExpenses,
    buildOrderMap(baseData.allOrders),
    baseData.monthLabel,
  );
});

export const getMonthlyIncomeDetail = cache(async (): Promise<MonthlyIncomeDetail> => {
  const baseData = await getDashboardBaseData();

  if (!baseData) {
    return {
      total: 0,
      monthLabel: getMonthBounds().monthLabel,
      items: [],
    };
  }

  return buildMonthlyIncomeDetail(
    baseData.monthlyPayments,
    buildOrderMap(baseData.allOrders),
    baseData.monthLabel,
  );
});

export const getPendingCollectionDetail = cache(
  async (): Promise<PendingCollectionDetail> => {
    const baseData = await getDashboardBaseData();

    if (!baseData) {
      return {
        total: 0,
        items: [],
      };
    }

    return buildPendingCollectionDetail(baseData.allOrders, baseData.allPayments);
  },
);

export const getMonthlyShippingExpensesDetail = cache(
  async (): Promise<MonthlyShippingExpensesDetail> => {
    const baseData = await getDashboardBaseData();

    if (!baseData) {
      return {
        total: 0,
        monthLabel: getMonthBounds().monthLabel,
        items: [],
      };
    }

    return buildMonthlyShippingExpensesDetail(
      baseData.monthlyShippingExpenses,
      buildOrderMap(baseData.allOrders),
      baseData.monthLabel,
    );
  },
);
