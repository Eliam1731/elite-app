"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getTodayForDateInput,
  isValidDateInputValue,
} from "@/features/orders/due-date";
import { maybePromoteOrderToProduction } from "@/features/orders/status-rules";
import { roundCurrency } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPaymentsByOrderId, getTotalPaid } from "@/services/payments/queries";

const createPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("El monto debe ser mayor a cero.")
    .finite("El monto debe ser valido."),
  payment_date: z.string().trim().min(1, "La fecha es obligatoria."),
  payment_method: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPaymentHref(orderId: string, message: string) {
  return `/pedidos/${orderId}?message=${message}#pagos`;
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
    payment_date: getString(formData, "payment_date"),
    payment_method: getString(formData, "payment_method"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(getPaymentHref(orderId, "payment-invalid"));
  }

  if (!isValidDateInputValue(parsed.data.payment_date)) {
    redirect(getPaymentHref(orderId, "payment-date-invalid"));
  }

  const today = getTodayForDateInput();

  if (parsed.data.payment_date > today) {
    redirect(getPaymentHref(orderId, "payment-date-invalid"));
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getPaymentHref(orderId, "config"));
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, total_amount")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("Error loading order for payment", {
      orderId,
      error: getErrorDebug(orderError),
    });
    redirect(getPaymentHref(orderId, "payment-error"));
  }

  const currentPayments = await getPaymentsByOrderId(orderId);
  const totalPaid = getTotalPaid(currentPayments);
  const pendingAmount = roundCurrency(order.total_amount - totalPaid);
  const amount = roundCurrency(parsed.data.amount);

  if (amount <= 0) {
    redirect(getPaymentHref(orderId, "payment-invalid"));
  }

  if (pendingAmount <= 0) {
    redirect(getPaymentHref(orderId, "payment-fully-paid"));
  }

  if (amount > pendingAmount) {
    redirect(getPaymentHref(orderId, "payment-exceeds-pending"));
  }

  const { error } = await supabase.from("payments").insert({
    order_id: orderId,
    amount,
    payment_date: parsed.data.payment_date,
    payment_method: parsed.data.payment_method || null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    console.error("Error creating payment", {
      orderId,
      amount,
      paymentDate: parsed.data.payment_date,
      paymentMethod: parsed.data.payment_method || null,
      error: getErrorDebug(error),
    });
    redirect(getPaymentHref(orderId, "payment-error"));
  }

  await maybePromoteOrderToProduction(orderId);

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(getPaymentHref(orderId, "payment-created"));
}
