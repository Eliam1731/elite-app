"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ClientFormState } from "@/features/clients/form-state";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const clientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  phone: z.string().trim().min(1, "El telefono es obligatorio."),
  email: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || "")
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Ingresa un correo valido.",
    }),
  address: z.string().trim().optional(),
  rfc: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapClientPayload(formData: FormData) {
  const parsed = clientSchema.safeParse({
    name: getString(formData, "name"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    address: getString(formData, "address"),
    rfc: getString(formData, "rfc"),
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
      phone: values.phone,
      email: values.email || null,
      address: values.address || null,
      rfc: values.rfc || null,
      notes: values.notes || null,
    },
  };
}

export async function createClientAction(
  _: ClientFormState | void,
  formData: FormData,
) {
  const parsed = mapClientPayload(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies ClientFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    } satisfies ClientFormState;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return {
      message: error?.message || "No se pudo crear el cliente.",
    } satisfies ClientFormState;
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateClientAction(
  clientId: string,
  _: ClientFormState | void,
  formData: FormData,
) {
  const parsed = mapClientPayload(formData);

  if (!parsed.success) {
    return {
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.errors,
    } satisfies ClientFormState;
  }

  const supabase = createServerSupabaseClient();

  if (!supabase) {
    return {
      message:
        "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
    } satisfies ClientFormState;
  }

  const { error } = await supabase
    .from("clients")
    .update(parsed.data)
    .eq("id", clientId);

  if (error) {
    return {
      message: error.message || "No se pudo actualizar el cliente.",
    } satisfies ClientFormState;
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/clientes/${clientId}`);
}
