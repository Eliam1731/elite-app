"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import type {
  ProductFormState,
  ProductFormValues,
} from "@/features/products/form-state";
import { initialProductFormState } from "@/features/products/form-state";

type ProductFormProps = {
  action: (
    state: ProductFormState | void,
    formData: FormData,
  ) => Promise<ProductFormState | void>;
  defaultValues?: ProductFormValues;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_var(--color-brand-shadow)] disabled:opacity-70 [&_svg]:text-white [&_svg]:stroke-white"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      <span className="text-white">{pending ? "Guardando..." : label}</span>
    </button>
  );
}

function FieldError({ message }: { message?: string[] }) {
  if (!message?.length) return null;

  return <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{message[0]}</p>;
}

export function ProductForm({
  action,
  defaultValues,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction] = useActionState(action, initialProductFormState);
  const formState = state ?? initialProductFormState;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Nombre
          </label>
          <input
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="Ej. Playera manga corta"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.name} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Precio base
          </label>
          <input
            name="base_price_amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            defaultValue={defaultValues?.base_price_amount}
            placeholder="0.00"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.base_price_amount} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Estatus
          </label>
          <select
            name="is_active"
            defaultValue={defaultValues?.is_active ?? "true"}
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
          <FieldError message={formState.fieldErrors?.is_active} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Notas
          </label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={defaultValues?.notes}
            placeholder="Uso, aclaraciones o variantes del producto"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.notes} />
        </div>
      </div>

      {formState.message ? (
        <p className="rounded-2xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {formState.message}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
