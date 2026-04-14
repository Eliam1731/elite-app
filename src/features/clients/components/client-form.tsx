"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import type { ClientFormState, ClientFormValues } from "@/features/clients/form-state";
import { initialClientFormState } from "@/features/clients/form-state";

type ClientFormProps = {
  action: (
    state: ClientFormState | void,
    formData: FormData,
  ) => Promise<ClientFormState | void>;
  defaultValues?: ClientFormValues;
  submitLabel: string;
  returnTo?: string;
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

export function ClientForm({
  action,
  defaultValues,
  submitLabel,
  returnTo,
}: ClientFormProps) {
  const [state, formAction] = useActionState(action, initialClientFormState);
  const formState = state ?? initialClientFormState;

  return (
    <form action={formAction} className="space-y-4">
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} readOnly /> : null}

      <div className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Nombre
          </label>
          <input
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="Ej. Club Halcones"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.name} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Telefono
          </label>
          <input
            name="phone"
            defaultValue={defaultValues?.phone}
            placeholder="Ej. 5551234567"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.phone} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Email
          </label>
          <input
            name="email"
            type="email"
            defaultValue={defaultValues?.email}
            placeholder="cliente@equipo.com"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
          <FieldError message={formState.fieldErrors?.email} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            RFC
          </label>
          <input
            name="rfc"
            defaultValue={defaultValues?.rfc}
            placeholder="Opcional"
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm uppercase text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Direccion
          </label>
          <textarea
            name="address"
            defaultValue={defaultValues?.address}
            rows={3}
            placeholder="Calle, colonia, ciudad..."
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Notas
          </label>
          <textarea
            name="notes"
            defaultValue={defaultValues?.notes}
            rows={4}
            placeholder="Detalles utiles para futuras cotizaciones"
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)] focus:bg-[var(--color-panel-strong)]"
          />
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
