"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { roundCurrency } from "@/features/quotes/calculations";
import type { ProductFormState } from "@/features/products/form-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  base_price_amount: z.coerce
    .number()
    .nonnegative("El precio base no puede ser negativo."),
  capture_mode: z.enum(["simple", "full"]),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapProductPayload(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: getString(formData, "name"),
    base_price_amount: getString(formData, "base_price_amount"),
    capture_mode: getString(formData, "capture_mode"),
    notes: getString(formData, "notes"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const values = parsed.data;

  return {
    success: true as const,
    data: {
      name: values.name,
      base_price_amount: roundCurrency(values.base_price_amount),
      capture_mode: values.capture_mode,
      notes: values.notes || null,
    },
  };
}

function getSafeReturnTo(formData: FormData) {
  const returnTo = getString(formData, "return_to").trim();

  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

function withCreatedProductParam(path: string, productId: string) {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString ?? "");
  params.set("createdProductId", productId);
  params.set("productCreated", "1");
  const nextQuery = params.toString();

  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function getProductFormErrorMessage(error: {
  message?: string;
  code?: string;
} | null) {
  if (error?.code === "23505") {
    return "Ya existe un producto con ese nombre.";
  }

  return error?.message || "No se pudo guardar el producto.";
}

export async function createProductAction(
  _: ProductFormState | void,
  formData: FormData,
) {
  const parsed = mapProductPayload(formData);
  const returnTo = getSafeReturnTo(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies ProductFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    } satisfies ProductFormState;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      ...parsed.data,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      message: getProductFormErrorMessage(error),
    } satisfies ProductFormState;
  }

  revalidatePath("/productos");
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/dashboard");
  redirect(returnTo ? withCreatedProductParam(returnTo, data.id) : `/productos/${data.id}`);
}

export async function updateProductAction(
  productId: string,
  _: ProductFormState | void,
  formData: FormData,
) {
  const parsed = mapProductPayload(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies ProductFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    } satisfies ProductFormState;
  }

  const { error } = await supabase
    .from("products")
    .update({
      ...parsed.data,
    })
    .eq("id", productId);

  if (error) {
    return {
      message: getProductFormErrorMessage(error),
    } satisfies ProductFormState;
  }

  revalidatePath("/productos");
  revalidatePath(`/productos/${productId}`);
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/dashboard");
  redirect(`/productos/${productId}`);
}

export async function toggleProductActiveAction(
  productId: string,
  nextActive: boolean,
  redirectPath = `/productos/${productId}`,
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(redirectPath);
  }

  const { error } = await supabase
    .from("products")
    .update({ is_active: nextActive })
    .eq("id", productId);

  if (error) {
    console.error("Error toggling product status", {
      productId,
      nextActive,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  revalidatePath("/productos");
  revalidatePath(`/productos/${productId}`);
  revalidatePath(`/productos/${productId}/editar`);
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/dashboard");
  redirect(redirectPath);
}
