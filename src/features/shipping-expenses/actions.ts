"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { roundCurrency } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const shippingExpenseSchema = z.object({
  amount: z.coerce
    .number()
    .positive("El gasto debe ser mayor a cero.")
    .finite("El gasto debe ser valido."),
  order_id: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getDashboardHref(message: string) {
  return `/dashboard/envios?message=${message}`;
}

export async function createShippingExpenseAction(formData: FormData) {
  const parsed = shippingExpenseSchema.safeParse({
    amount: getString(formData, "amount"),
    order_id: getString(formData, "order_id"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(getDashboardHref("shipping-expense-invalid"));
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getDashboardHref("config"));
  }

  const orderId = parsed.data.order_id?.trim() ? parsed.data.order_id.trim() : null;

  if (orderId) {
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error("Error validating order for shipping expense", {
        orderId,
        error: orderError,
      });
      redirect(getDashboardHref("shipping-expense-error"));
    }
  }

  const { error } = await supabase.from("shipping_expenses").insert({
    order_id: orderId,
    amount: roundCurrency(parsed.data.amount),
    expense_date: new Date().toISOString().slice(0, 10),
    notes: parsed.data.notes || null,
  });

  if (error) {
    console.error("Error creating shipping expense", {
      orderId,
      amount: parsed.data.amount,
      error,
    });
    redirect(getDashboardHref("shipping-expense-error"));
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/envios");
  redirect(getDashboardHref("shipping-expense-created"));
}
