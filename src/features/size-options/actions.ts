"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  initialSizeOptionFormState,
  type SizeOptionFormState,
} from "@/features/sizes/form-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const sizeOptionSchema = z.object({
  label: z.string().trim().min(1, "La talla visible es obligatoria."),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapSizeOptionPayload(formData: FormData) {
  const parsed = sizeOptionSchema.safeParse({
    label: getString(formData, "label"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function getSizeOptionFormErrorMessage(error: {
  message?: string;
  code?: string;
} | null) {
  if (error?.code === "23505") {
    return "La talla ya existe en el catalogo.";
  }

  return error?.message || "No se pudo guardar la talla.";
}

export async function createSizeOptionAction(
  _: SizeOptionFormState | void,
  formData: FormData,
) {
  const parsed = mapSizeOptionPayload(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies SizeOptionFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      ...initialSizeOptionFormState,
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    };
  }

  const { data, error } = await supabase
    .from("size_options")
    .insert({
      ...parsed.data,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      message: getSizeOptionFormErrorMessage(error),
    } satisfies SizeOptionFormState;
  }

  revalidatePath("/tallas");
  revalidatePath("/dashboard");
  redirect(`/tallas/${data.id}/editar`);
}

export async function updateSizeOptionAction(
  sizeOptionId: string,
  _: SizeOptionFormState | void,
  formData: FormData,
) {
  const parsed = mapSizeOptionPayload(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies SizeOptionFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      ...initialSizeOptionFormState,
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    };
  }

  const { error } = await supabase
    .from("size_options")
    .update(parsed.data)
    .eq("id", sizeOptionId);

  if (error) {
    return {
      message: getSizeOptionFormErrorMessage(error),
    } satisfies SizeOptionFormState;
  }

  revalidatePath("/tallas");
  revalidatePath(`/tallas/${sizeOptionId}/editar`);
  revalidatePath("/dashboard");
  redirect("/tallas");
}

export async function toggleSizeOptionActiveAction(
  sizeOptionId: string,
  nextActive: boolean,
  redirectPath = "/tallas",
) {
  const supabase = createServerSupabaseClient();

  if (!supabase) {
    redirect(redirectPath);
  }

  const { error } = await supabase
    .from("size_options")
    .update({ is_active: nextActive })
    .eq("id", sizeOptionId);

  if (error) {
    console.error("Error toggling size option status", {
      sizeOptionId,
      nextActive,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  revalidatePath("/tallas");
  revalidatePath(`/tallas/${sizeOptionId}/editar`);
  revalidatePath("/dashboard");
  redirect(redirectPath);
}
