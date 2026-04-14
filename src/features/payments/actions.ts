"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { maybePromoteOrderToProduction } from "@/features/orders/status-rules";
import { roundCurrency } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const createPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("El monto debe ser mayor a cero.")
    .finite("El monto debe ser valido."),
  payment_method: z.enum(["efectivo", "transferencia"]),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPaymentHref(orderId: string, message: string) {
  return `/pedidos/${orderId}?message=${message}#pagos`;
}

function getPaymentType(
  previousPaymentsCount: number,
  amount: number,
  pendingAmount: number,
) {
  if (previousPaymentsCount === 0) {
    return "down_payment" as const;
  }

  if (amount >= pendingAmount) {
    return "final" as const;
  }

  return "partial" as const;
}

function getErrorDebug(error: unknown) {
  if (!error || typeof error !== "object") {
    return error;
  }

  const candidate = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };

  return {
    message: candidate.message,
    code: candidate.code,
    details: candidate.details,
    hint: candidate.hint,
  };
}

export async function createPaymentAction(orderId: string, formData: FormData) {
  const parsed = createPaymentSchema.safeParse({
    amount: getString(formData, "amount"),
    payment_method: getString(formData, "payment_method"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(getPaymentHref(orderId, "payment-invalid"));
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getPaymentHref(orderId, "config"));
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, client_id, total_amount")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Error loading order for payment", {
      orderId,
      error: getErrorDebug(orderError),
    });
    redirect(getPaymentHref(orderId, "payment-error"));
  }

  if (!order.client_id) {
    console.error("Order is missing client_id for payment", {
      orderId,
      order,
    });
    redirect(getPaymentHref(orderId, "payment-missing-client"));
  }

  const { data: existingPayments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("order_id", orderId);

  if (paymentsError) {
    console.error("Error loading existing payments", {
      orderId,
      error: getErrorDebug(paymentsError),
    });
    redirect(getPaymentHref(orderId, "payment-error"));
  }

  const totalPaid = roundCurrency(
    (existingPayments ?? []).reduce(
      (sum, payment) => sum + Number(payment.amount ?? 0),
      0,
    ),
  );
  const previousPaymentsCount = existingPayments?.length ?? 0;
  const pendingAmount = roundCurrency(order.total_amount - totalPaid);
  const amount = roundCurrency(parsed.data.amount);
  const paymentDate = new Date().toISOString().slice(0, 10);

  if (amount <= 0) {
    redirect(getPaymentHref(orderId, "payment-invalid"));
  }

  if (pendingAmount <= 0) {
    redirect(getPaymentHref(orderId, "payment-fully-paid"));
  }

  if (amount > pendingAmount) {
    redirect(getPaymentHref(orderId, "payment-exceeds-pending"));
  }

  const paymentType = getPaymentType(previousPaymentsCount, amount, pendingAmount);

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    client_id: order.client_id,
    payment_type: paymentType,
    amount,
    payment_date: paymentDate,
    payment_method: parsed.data.payment_method,
    notes: parsed.data.notes || null,
  });

  if (error) {
    console.error("Error creating payment", {
      orderId,
      amount,
      paymentDate,
      paymentType,
      paymentMethod: parsed.data.payment_method,
      error: getErrorDebug(error),
    });
    redirect(getPaymentHref(orderId, "payment-error"));
  }

  await maybePromoteOrderToProduction(orderId);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(getPaymentHref(orderId, "payment-created"));
}
