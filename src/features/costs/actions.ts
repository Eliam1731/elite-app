"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getTodayForDateInput,
  isValidDateInputValue,
} from "@/features/orders/due-date";
import { roundCurrency } from "@/features/quotes/calculations";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderCostType } from "@/types/database";

const COST_TYPE_OPTIONS = [
  "materiales",
  "mano_de_obra",
  "impresion",
  "bordado",
  "envio",
  "extras",
  "otro",
] as const satisfies readonly OrderCostType[];

const createCostSchema = z.object({
  cost_type: z.enum(COST_TYPE_OPTIONS),
  description: z.string().trim().min(1, "La descripcion es obligatoria."),
  amount: z.coerce
    .number()
    .positive("El monto debe ser mayor a cero.")
    .finite("El monto debe ser valido."),
  cost_date: z.string().trim().min(1, "La fecha es obligatoria."),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getCostHref(orderId: string, message: string) {
  return `/pedidos/${orderId}?message=${message}#costos`;
}

function getErrorDebug(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
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
  } as const;
}

export async function createOrderCostAction(orderId: string, formData: FormData) {
  const parsed = createCostSchema.safeParse({
    cost_type: getString(formData, "cost_type"),
    description: getString(formData, "description"),
    amount: getString(formData, "amount"),
    cost_date: getString(formData, "cost_date"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    redirect(getCostHref(orderId, "cost-invalid"));
  }

  if (!isValidDateInputValue(parsed.data.cost_date)) {
    redirect(getCostHref(orderId, "cost-date-invalid"));
  }

  const today = getTodayForDateInput();

  if (parsed.data.cost_date > today) {
    redirect(getCostHref(orderId, "cost-date-invalid"));
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getCostHref(orderId, "config"));
  }

  const amount = roundCurrency(parsed.data.amount);

  const { error } = await supabase.from("order_costs").insert({
    order_id: orderId,
    cost_type: parsed.data.cost_type,
    description: parsed.data.description,
    amount,
    cost_date: parsed.data.cost_date,
    notes: parsed.data.notes || null,
  });

  if (error) {
    console.error("Error creating order cost", {
      orderId,
      payload: {
        cost_type: parsed.data.cost_type,
        description: parsed.data.description,
        amount,
        cost_date: parsed.data.cost_date,
        notes: parsed.data.notes || null,
      },
      error: getErrorDebug(error),
    });

    const debugError = getErrorDebug(error);

    if (debugError?.code === "PGRST205") {
      redirect(getCostHref(orderId, "costs-unavailable"));
    }

    redirect(getCostHref(orderId, "cost-error"));
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(getCostHref(orderId, "cost-created"));
}

export { COST_TYPE_OPTIONS };
