"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  getOrderStatusWriteCandidates,
  isOrderStatusCompatibilityError,
} from "@/features/orders/status";
import {
  COMMERCIAL_DOWN_PAYMENT_RATE,
  getCommercialDownPaymentAmount,
  getQuoteSummary,
  roundCurrency,
} from "@/features/quotes/calculations";
import type { QuoteFormState } from "@/features/quotes/form-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";

const quoteItemSchema = z.object({
  product_id: z.string().uuid("Selecciona un producto valido para cada item."),
  description: z.string().trim().min(1, "Selecciona un producto valido para cada item."),
  quantity: z
    .number()
    .int("La cantidad debe ser entera.")
    .positive("La cantidad debe ser mayor a cero."),
  unit_price_amount: z
    .number()
    .nonnegative("El precio unitario no puede ser negativo."),
  specifications: z.string().trim().optional(),
});

const quoteSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente valido."),
  sale_type: z.enum(["normal", "factura"]),
  notes: z.string().trim().optional(),
  items: z.array(quoteItemSchema).min(1, "Agrega al menos un item."),
});

function buildQuoteFolio(prefix: string) {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${parts}-${suffix}`;
}

function buildOrderFolio(prefix: string) {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `${prefix}-${parts}-${suffix}`;
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getQuoteActionHref(
  quoteId: string,
  message: string,
  detail?: string,
) {
  const params = new URLSearchParams({ message });

  if (detail) {
    params.set("detail", detail.slice(0, 180));
  }

  return `/cotizaciones/${quoteId}?${params.toString()}`;
}

function getQuotesListHref(message: string) {
  return `/cotizaciones?message=${message}`;
}

function parseItemsJson(formData: FormData) {
  const raw = getString(formData, "items_json");

  try {
    const parsed = JSON.parse(raw) as Array<{
      product_id?: string;
      description?: string;
      quantity?: number | string;
      unit_price_amount?: number | string;
      specifications?: string;
    }>;

    return parsed.map((item) => ({
      product_id: String(item.product_id ?? ""),
      description: String(item.description ?? ""),
      quantity: Number(item.quantity ?? 0),
      unit_price_amount: Number(item.unit_price_amount ?? 0),
      specifications: String(item.specifications ?? ""),
    }));
  } catch {
    return [];
  }
}

export async function createQuoteAction(
  _: QuoteFormState | void,
  formData: FormData,
) {
  const parsed = quoteSchema.safeParse({
    client_id: getString(formData, "client_id"),
    sale_type: getString(formData, "sale_type"),
    notes: getString(formData, "notes"),
    items: parseItemsJson(formData),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten();

    return {
      message: "Revisa los campos de la cotizacion.",
      fieldErrors: {
        client_id: flattened.fieldErrors.client_id,
        sale_type: flattened.fieldErrors.sale_type,
        notes: flattened.fieldErrors.notes,
        items: flattened.fieldErrors.items,
      },
    } satisfies QuoteFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    } satisfies QuoteFormState;
  }

  const settings = await getBusinessSettings();

  if (!settings) {
    return {
      message:
        "Falta configurar business_settings. Agrega vat_rate y prefijos para poder cotizar.",
    } satisfies QuoteFormState;
  }

  const summary = getQuoteSummary({
    items: parsed.data.items,
    saleType: parsed.data.sale_type,
    vatRate: Number(settings.vat_rate),
  });

  const productIds = [...new Set(parsed.data.items.map((item) => item.product_id))];
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, is_active")
    .in("id", productIds)
    .eq("is_active", true);

  if (productsError) {
    return {
      message: productsError.message || "No se pudo validar el catalogo de productos.",
    } satisfies QuoteFormState;
  }

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product]),
  );

  const missingProduct = parsed.data.items.find((item) => !productsById.has(item.product_id));

  if (missingProduct) {
    return {
      message: "Selecciona un producto activo y valido para cada item.",
    } satisfies QuoteFormState;
  }

  const folio = buildQuoteFolio(settings.quote_prefix);

  const quotePayload = {
    folio,
    client_id: parsed.data.client_id,
    sale_type: parsed.data.sale_type,
    status: "draft" as const,
    subtotal_amount: roundCurrency(summary.subtotal),
    vat_amount: roundCurrency(summary.vatAmount),
    total_amount: roundCurrency(summary.total),
    down_payment_rate: COMMERCIAL_DOWN_PAYMENT_RATE,
    suggested_down_payment_amount: roundCurrency(
      summary.suggestedDownPaymentAmount,
    ),
    notes: parsed.data.notes || null,
  };

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .insert(quotePayload)
    .select("id")
    .single();

  if (quoteError || !quote) {
    return {
      message: quoteError?.message || "No se pudo guardar la cotizacion.",
    } satisfies QuoteFormState;
  }

  const itemsPayload = parsed.data.items.map((item, index) => ({
    product_id: item.product_id,
    description: productsById.get(item.product_id)?.name ?? item.description,
    quote_id: quote.id,
    quantity: item.quantity,
    unit_price_amount: roundCurrency(item.unit_price_amount),
    line_subtotal_amount: roundCurrency(item.quantity * item.unit_price_amount),
    specifications: item.specifications || null,
    sort_order: index + 1,
  }));

  const { error: itemsError } = await supabase.from("quote_items").insert(itemsPayload);

  if (itemsError) {
    await supabase.from("quotes").delete().eq("id", quote.id);

    return {
      message:
        itemsError.message || "No se pudieron guardar los items de la cotizacion.",
    } satisfies QuoteFormState;
  }

  revalidatePath("/cotizaciones");
  redirect(`/cotizaciones/${quote.id}`);
}

export async function sendQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/cotizaciones/${quoteId}?message=config`);
  }

  const { error } = await supabase
    .from("quotes")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", quoteId)
    .eq("status", "draft");

  if (error) {
    redirect(`/cotizaciones/${quoteId}?message=send-error`);
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  redirect(`/cotizaciones/${quoteId}?message=sent`);
}

export async function approveQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/cotizaciones/${quoteId}?message=config`);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("quotes")
    .update({
      status: "approved",
      approved_at: now,
    })
    .eq("id", quoteId)
    .eq("status", "sent");

  if (error) {
    redirect(`/cotizaciones/${quoteId}?message=approve-error`);
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  redirect(`/cotizaciones/${quoteId}?message=approved`);
}

export async function rejectQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/cotizaciones/${quoteId}?message=config`);
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("quotes")
    .update({
      status: "rejected",
      rejected_at: now,
    })
    .eq("id", quoteId)
    .eq("status", "sent");

  if (error) {
    redirect(`/cotizaciones/${quoteId}?message=reject-error`);
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  redirect(`/cotizaciones/${quoteId}?message=rejected`);
}

export async function createOrderFromQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(`/cotizaciones/${quoteId}?message=config`);
  }

  const settings = await getBusinessSettings();

  if (!settings) {
    redirect(getQuoteActionHref(quoteId, "settings-missing"));
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*, quote_items(*)")
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError || !quote) {
    console.error("Error loading quote for order creation", {
      quoteId,
      error: quoteError,
    });
    redirect(getQuoteActionHref(quoteId, "quote-missing", quoteError?.message));
  }

  if (quote.status !== "approved") {
    redirect(getQuoteActionHref(quoteId, "not-approved"));
  }

  const existingOrder = await supabase
    .from("orders")
    .select("id")
    .eq("quote_id", quoteId)
    .maybeSingle();

  if (existingOrder.data?.id) {
    redirect(`/pedidos/${existingOrder.data.id}?message=already-created`);
  }

  const orderFolio = buildOrderFolio(settings.order_prefix);
  const orderBasePayload = {
    folio: orderFolio,
    quote_id: quote.id,
    client_id: quote.client_id,
    sale_type: quote.sale_type,
    subtotal_amount: quote.subtotal_amount,
    vat_amount: quote.vat_amount,
    total_amount: quote.total_amount,
    down_payment_rate: COMMERCIAL_DOWN_PAYMENT_RATE,
    expected_down_payment_amount: getCommercialDownPaymentAmount(quote.total_amount),
    production_notes: quote.notes,
    due_date: null,
  };

  let order:
    | {
        id: string;
      }
    | null = null;
  let orderInsertError: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null = null;

  for (const candidate of getOrderStatusWriteCandidates("aprobado")) {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        ...orderBasePayload,
        status: candidate,
      })
      .select("id")
      .single();

    if (!error && data) {
      order = data;
      break;
    }

    orderInsertError = {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    };

    if (!isOrderStatusCompatibilityError(error)) {
      break;
    }
  }

  if (!order) {
    console.error("Error creating order from quote", {
      quoteId,
      quoteStatus: quote.status,
      orderPayload: orderBasePayload,
      error: orderInsertError,
    });
    redirect(getQuoteActionHref(quoteId, "order-error", orderInsertError?.message));
  }

  const itemsPayload =
    quote.quote_items?.map(
      (
        item: {
          product_id: string | null;
          description: string;
          quantity: number;
          unit_price_amount: number;
          line_subtotal_amount: number;
          specifications: string | null;
          sort_order: number;
        },
      ) => ({
        order_id: order.id,
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit_price_amount: item.unit_price_amount,
        line_subtotal_amount: item.line_subtotal_amount,
        specifications: item.specifications,
        sort_order: item.sort_order,
      }),
    ) ?? [];

  if (itemsPayload.length > 0) {
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsPayload);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      console.error("Error creating order_items from quote", {
        quoteId,
        orderId: order.id,
        itemsPayload,
        error: {
          message: itemsError.message,
          code: itemsError.code,
          details: itemsError.details,
          hint: itemsError.hint,
        },
      });
      redirect(getQuoteActionHref(quoteId, "order-items-error", itemsError.message));
    }
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  revalidatePath("/pedidos");
  redirect(`/pedidos/${order.id}?message=created`);
}

export async function deleteQuoteAction(quoteId: string) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(getQuoteActionHref(quoteId, "config"));
  }

  const [{ data: quote, error: quoteError }, { data: existingOrder, error: existingOrderError }] =
    await Promise.all([
      supabase
        .from("quotes")
        .select("id, status")
        .eq("id", quoteId)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id")
        .eq("quote_id", quoteId)
        .maybeSingle(),
    ]);

  if (quoteError || !quote) {
    console.error("Error loading quote for deletion", {
      quoteId,
      error: quoteError,
    });
    redirect(getQuoteActionHref(quoteId, "delete-error"));
  }

  if (existingOrderError) {
    console.error("Error checking existing order for quote deletion", {
      quoteId,
      error: existingOrderError,
    });
    redirect(getQuoteActionHref(quoteId, "delete-error"));
  }

  if (existingOrder?.id) {
    redirect(getQuoteActionHref(quoteId, "delete-blocked-order"));
  }

  const { error: itemsError } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", quoteId);

  if (itemsError) {
    console.error("Error deleting quote items", {
      quoteId,
      error: itemsError,
    });
    redirect(getQuoteActionHref(quoteId, "delete-error"));
  }

  const { error: deleteQuoteError } = await supabase
    .from("quotes")
    .delete()
    .eq("id", quoteId);

  if (deleteQuoteError) {
    console.error("Error deleting quote", {
      quoteId,
      error: deleteQuoteError,
    });
    redirect(getQuoteActionHref(quoteId, "delete-error"));
  }

  revalidatePath("/cotizaciones");
  revalidatePath(`/cotizaciones/${quoteId}`);
  revalidatePath("/dashboard");
  redirect(getQuotesListHref("quote-deleted"));
}
