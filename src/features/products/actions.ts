"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { roundCurrency } from "@/features/quotes/calculations";
import type { ProductFormState } from "@/features/products/form-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const productSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  base_price_amount: z
    .number()
    .nonnegative("El precio base no puede ser negativo."),
  is_active: z.boolean(),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapProductPayload(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: getString(formData, "name"),
    base_price_amount: Number(getString(formData, "base_price_amount")),
    is_active: getString(formData, "is_active") === "true",
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
      is_active: values.is_active,
      notes: values.notes || null,
    },
  };
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

  const { data: existingProduct, error: existingProductError } = await supabase
    .from("products")
    .select("capture_mode")
    .eq("id", productId)
    .maybeSingle();

  if (existingProductError || !existingProduct) {
    return {
      message:
        existingProductError?.message || "No se pudo cargar el producto actual.",
    } satisfies ProductFormState;
  }

  const { error } = await supabase
    .from("products")
    .update({
      ...parsed.data,
      capture_mode: existingProduct.capture_mode,
    })
    .eq("id", productId);

  if (error) {
    return {
      message: error.message || "No se pudo actualizar el producto.",
    } satisfies ProductFormState;
  }

  revalidatePath("/productos");
  revalidatePath(`/productos/${productId}`);
  revalidatePath("/cotizaciones/nueva");
  revalidatePath("/dashboard");
  redirect(`/productos/${productId}`);
}
