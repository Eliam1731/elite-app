"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  initialSizeOptionFormState,
  type SizeOptionFormState,
  type SizeOptionFormValues,
} from "@/features/sizes/form-state";

type SizeOptionFormProps = {
  action: (
    state: SizeOptionFormState | void,
    formData: FormData,
  ) => Promise<SizeOptionFormState | void>;
  defaultValues?: Partial<SizeOptionFormValues>;
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

export function SizeOptionForm({
  action,
  defaultValues,
  submitLabel,
}: SizeOptionFormProps) {
  const [state, formAction] = useActionState(action, initialSizeOptionFormState);
  const formState = state ?? initialSizeOptionFormState;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Talla visible
          </label>
          <input
            name="label"
            defaultValue={defaultValues?.label}
            placeholder="Ej. M o 12"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.label} />
        </div>

        <div>
          <p className="rounded-2xl bg-[var(--color-panel)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
            La talla quedara disponible globalmente para la captura dentro del pedido
            cuando este activa.
          </p>
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
