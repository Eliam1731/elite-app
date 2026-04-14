"use client";

import { useMemo } from "react";
import { useActionState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { CirclePlus, LoaderCircle, Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { formatCurrency, getLineSubtotal, getQuoteSummary } from "@/features/quotes/calculations";
import { initialQuoteFormState, type QuoteFormState } from "@/features/quotes/form-state";
import type {
  BusinessSettingsRecord,
  ClientRecord,
  ProductRecord,
} from "@/types/database";

type QuoteFormClientValues = {
  client_id: string;
  sale_type: "normal" | "factura";
  notes: string;
  items: Array<{
    product_id: string;
    description: string;
    quantity: number;
    unit_price_amount: number;
    specifications: string;
  }>;
};

type QuoteFormProps = {
  action: (
    state: QuoteFormState | void,
    formData: FormData,
  ) => Promise<QuoteFormState | void>;
  clients: ClientRecord[];
  settings: BusinessSettingsRecord;
  products: ProductRecord[];
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-5 text-sm font-semibold text-white shadow-[0_16px_30px_var(--color-brand-shadow)] disabled:opacity-70 [&_svg]:text-white [&_svg]:stroke-white"
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      <span className="text-white">
        {pending ? "Guardando..." : "Guardar cotizacion"}
      </span>
    </button>
  );
}

function FieldError({ message }: { message?: string[] }) {
  if (!message?.length) return null;

  return <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">{message[0]}</p>;
}

export function QuoteForm({ action, clients, settings, products }: QuoteFormProps) {
  const [state, formAction] = useActionState(action, initialQuoteFormState);
  const formState = state ?? initialQuoteFormState;

  const { control, register, setValue } = useForm<QuoteFormClientValues>({
    defaultValues: {
      client_id: "",
      sale_type: "normal",
      notes: "",
      items: [
        {
          product_id: "",
          description: "",
          quantity: 1,
          unit_price_amount: 0,
          specifications: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });
  const saleType = useWatch({ control, name: "sale_type" }) ?? "normal";

  const productsById = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [products],
  );

  const normalizedItems = useMemo(
    () =>
      (watchedItems ?? []).map((item) => ({
        product_id: item?.product_id ?? "",
        description: item?.description ?? "",
        quantity: Number(item?.quantity ?? 0),
        unit_price_amount: Number(item?.unit_price_amount ?? 0),
        specifications: item?.specifications ?? "",
      })),
    [watchedItems],
  );

  const summary = useMemo(
    () =>
      getQuoteSummary({
        items: normalizedItems,
        saleType,
        vatRate: Number(settings.vat_rate),
        downPaymentRate: Number(settings.default_down_payment_rate),
      }),
    [normalizedItems, saleType, settings.default_down_payment_rate, settings.vat_rate],
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(normalizedItems)}
        readOnly
      />

      <section className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Cliente
          </label>
          <select
            {...register("client_id")}
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
          >
            <option value="">Selecciona un cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FieldError message={formState.fieldErrors?.client_id} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Tipo de venta
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="radio" value="normal" {...register("sale_type")} />
              <span>Normal</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)]">
              <input type="radio" value="factura" {...register("sale_type")} />
              <span>Factura</span>
            </label>
          </div>
          <FieldError message={formState.fieldErrors?.sale_type} />
        </div>
      </section>

      <section className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink)]">
              Items de la cotizacion
            </h2>
            <p className="text-sm text-[var(--color-muted)]">
              Agrega los conceptos necesarios y el sistema calcula importes.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              append({
                product_id: "",
                description: "",
                quantity: 1,
                unit_price_amount: 0,
                specifications: "",
              })
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white [&_svg]:text-white [&_svg]:stroke-white"
          >
            <CirclePlus className="h-4 w-4" />
            <span className="text-white">Agregar</span>
          </button>
        </div>

        <FieldError message={formState.fieldErrors?.items} />

        <div className="space-y-4">
          {fields.map((field, index) => {
            const lineSubtotal = getLineSubtotal(
              Number(normalizedItems[index]?.quantity ?? 0),
              Number(normalizedItems[index]?.unit_price_amount ?? 0),
            );

            return (
              <article
                key={field.id}
                className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Item {index + 1}
                  </p>
                  {fields.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-danger)]"
                      aria-label={`Eliminar item ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                      Producto
                    </label>
                    <select
                      {...register(`items.${index}.product_id`, {
                        onChange: (event) => {
                          const productId = String(event.target.value ?? "");
                          const selectedProduct = productsById.get(productId);

                          setValue(
                            `items.${index}.description`,
                            selectedProduct?.name ?? "",
                            { shouldDirty: true },
                          );
                          setValue(
                            `items.${index}.unit_price_amount`,
                            selectedProduct?.base_price_amount ?? 0,
                            { shouldDirty: true },
                          );
                        },
                      })}
                      className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
                    >
                      <option value="">Selecciona un producto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input type="hidden" {...register(`items.${index}.description`)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        {...register(`items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                        className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                        Precio unitario
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        {...register(`items.${index}.unit_price_amount`, {
                          valueAsNumber: true,
                        })}
                        className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-brand)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                      Especificaciones u observaciones
                    </label>
                    <textarea
                      {...register(`items.${index}.specifications`)}
                      rows={3}
                      placeholder="Detalles opcionales del producto..."
                      className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)]"
                    />
                  </div>

                  <div className="rounded-2xl bg-[var(--color-elevated)] px-4 py-3 text-sm text-[var(--color-muted)]">
                    Subtotal de linea:{" "}
                    <span className="font-semibold text-[var(--color-ink)]">
                      {formatCurrency(lineSubtotal, settings.currency_code)}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-[2rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-5 shadow-[var(--shadow-soft)]">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          Resumen
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
            <span>Subtotal</span>
            <span className="font-semibold text-[var(--color-ink)]">
              {formatCurrency(summary.subtotal, settings.currency_code)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
            <span>IVA</span>
            <span className="font-semibold text-[var(--color-ink)]">
              {formatCurrency(summary.vatAmount, settings.currency_code)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[var(--color-muted)]">
            <span>Total</span>
            <span className="font-semibold text-[var(--color-ink)]">
              {formatCurrency(summary.total, settings.currency_code)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3">
            <span className="text-[var(--color-muted)]">Anticipo sugerido</span>
            <span className="font-semibold text-[var(--color-ink)]">
              {formatCurrency(
                summary.suggestedDownPaymentAmount,
                settings.currency_code,
              )}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Notas
          </label>
          <textarea
            {...register("notes")}
            rows={4}
            placeholder="Condiciones, detalles de fabricacion o comentarios..."
            className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-soft-muted)] focus:border-[var(--color-brand)]"
          />
        </div>
      </section>

      {formState.message ? (
        <p className="rounded-2xl border border-[var(--color-danger-soft)] bg-[var(--color-danger-bg)] px-4 py-3 text-sm text-[var(--color-danger)]">
          {formState.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
