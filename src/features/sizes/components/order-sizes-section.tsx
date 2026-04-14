import Link from "next/link";
import {
  CirclePlus,
  Download,
  PencilLine,
  Ruler,
  Shirt,
  Trash2,
} from "lucide-react";

import {
  deleteSizeRowAction,
  generateSizeRowsForItemAction,
  updateSizeRowAction,
} from "@/features/sizes/actions";
import {
  getCaptureModeForOrderItem,
  getMissingPieceIndexes,
  getRowsForOrderItem,
  isPendingValue,
  isSupportedSizeOrderItem,
  isSizeRowComplete,
} from "@/features/sizes/product-config";
import type {
  OrderDetailRecord,
  OrderItemWithProductRecord,
  SizeTableRecord,
  SizeTableRowRecord,
} from "@/types/database";

type OrderSizesSectionProps = {
  order: OrderDetailRecord;
  sizeTable: SizeTableRecord | null;
  editRowId?: string;
  message?: string;
};

function yesNoField(
  name: "has_sleeves" | "has_cuffs",
  label: string,
  value: boolean | null,
) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </label>
      <select
        name={name}
        defaultValue={value === null ? "" : value ? "true" : "false"}
        className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
      >
        <option value="">Selecciona una opción</option>
        <option value="true">Sí</option>
        <option value="false">No</option>
      </select>
    </div>
  );
}

function SizeRowForm({
  orderId,
  row,
}: {
  orderId: string;
  row: SizeTableRowRecord;
}) {
  const action = updateSizeRowAction.bind(null, orderId, row.id);
  const isSimple = row.capture_mode === "simple";

  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Talla
          </label>
          <input
            name="size"
            defaultValue={isPendingValue(row.size) ? "" : row.size}
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
            Número
          </label>
          <input
            name="number"
            defaultValue={isPendingValue(row.number) ? "" : row.number}
            className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
          />
        </div>
      </div>

      {!isSimple ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Nombre
              </label>
              <input
                name="player_name"
                defaultValue={row.player_name ?? ""}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Silueta
              </label>
              <input
                name="silhouette"
                defaultValue={row.silhouette ?? ""}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
                Tipo de cuello
              </label>
              <input
                name="neck_type"
                defaultValue={row.neck_type ?? ""}
                className="h-12 w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-ink)] outline-none"
              />
            </div>
            {yesNoField("has_sleeves", "Mangas", row.has_sleeves)}
            {yesNoField("has_cuffs", "Puños", row.has_cuffs)}
          </div>
        </>
      ) : null}

      <div>
        <label className="mb-2 block text-sm font-semibold text-[var(--color-ink)]">
          Especificaciones
        </label>
        <textarea
          name="specifications"
          rows={3}
          defaultValue={row.specifications ?? ""}
          className="w-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-input)] px-4 py-3 text-sm text-[var(--color-ink)] outline-none"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
        >
          <span className="text-white">Guardar talla</span>
        </button>
        <Link
          href={`/pedidos/${orderId}#tallas`}
          className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] px-4 text-sm font-semibold text-[var(--color-ink)]"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}

function SizeRowCard({
  orderId,
  row,
  editing,
}: {
  orderId: string;
  row: SizeTableRowRecord;
  editing: boolean;
}) {
  const deleteAction = deleteSizeRowAction.bind(null, orderId, row.id);
  const complete = isSizeRowComplete(row);

  if (editing) {
    return (
      <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <PencilLine className="h-4 w-4 text-[var(--color-brand)]" />
          Editar pieza {row.piece_index ?? "-"}
        </div>
        <SizeRowForm orderId={orderId} row={row} />
      </article>
    );
  }

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Pieza {row.piece_index ?? "-"}
            </p>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                complete
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
              }`}
            >
              {complete ? "Capturada" : "Pendiente"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Talla: {isPendingValue(row.size) ? "Pendiente" : row.size} · Número:{" "}
            {isPendingValue(row.number) ? "Pendiente" : row.number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/pedidos/${orderId}?editRow=${row.id}#tallas`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-ink)]"
            aria-label={`Editar pieza ${row.piece_index ?? ""}`}
          >
            <PencilLine className="h-4 w-4" />
          </Link>
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700"
              aria-label={`Eliminar pieza ${row.piece_index ?? ""}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {row.capture_mode === "full" ? (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--color-muted)] md:grid-cols-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Nombre
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {row.player_name || "Sin dato"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Silueta
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {row.silhouette || "Sin dato"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Cuello
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {row.neck_type || "Sin dato"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
              Mangas / Puños
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink)]">
              {(row.has_sleeves === null ? "?" : row.has_sleeves ? "Sí" : "No") +
                " / " +
                (row.has_cuffs === null ? "?" : row.has_cuffs ? "Sí" : "No")}
            </p>
          </div>
        </div>
      ) : null}

      {row.specifications ? (
        <div className="mt-3 rounded-xl bg-[var(--color-elevated)] px-3 py-2 text-xs leading-5 text-[var(--color-muted)]">
          <span className="font-semibold text-[var(--color-ink)]">Especificaciones:</span>{" "}
          {row.specifications}
        </div>
      ) : null}
    </article>
  );
}

function ProductCaptureCard({
  orderId,
  clientId,
  item,
  rows,
  editRowId,
}: {
  orderId: string;
  clientId: string;
  item: OrderItemWithProductRecord;
  rows: SizeTableRowRecord[];
  editRowId?: string;
}) {
  const captureMode = getCaptureModeForOrderItem(item);

  if (!captureMode) {
    return (
      <article className="rounded-[1.6rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <Shirt className="h-4 w-4 text-[var(--color-brand)]" />
          {item.description}
        </div>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          Este producto no esta configurado para captura automatica de tallas.
        </p>
      </article>
    );
  }

  const completedRows = rows.filter(isSizeRowComplete).length;
  const missingPieceIndexes = getMissingPieceIndexes(item.quantity, rows);
  const pendingRows = Math.max(item.quantity - completedRows, 0);
  const generateAction = generateSizeRowsForItemAction.bind(
    null,
    orderId,
    clientId,
    item.id,
  );

  return (
    <article className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-panel)] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
            <Shirt className="h-4 w-4 text-[var(--color-brand)]" />
            {item.description}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Captura {captureMode === "simple" ? "simple" : "completa"} para{" "}
            {item.quantity} pieza{item.quantity === 1 ? "" : "s"}.
          </p>
        </div>

        {missingPieceIndexes.length > 0 ? (
          <form action={generateAction}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
            >
              <CirclePlus className="h-4 w-4" />
              <span className="text-white">
                {rows.length === 0
                  ? `Generar ${item.quantity} filas`
                  : `Generar ${missingPieceIndexes.length} pendientes`}
              </span>
            </button>
          </form>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-[var(--color-elevated)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Esperadas
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{item.quantity}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-elevated)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Capturadas
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{completedRows}</p>
        </div>
        <div className="rounded-2xl bg-[var(--color-elevated)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Pendientes
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{pendingRows}</p>
        </div>
      </div>

      {rows.length ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <SizeRowCard
              key={row.id}
              orderId={orderId}
              row={row}
              editing={editRowId === row.id}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.4rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-elevated)] px-4 py-4 text-sm leading-6 text-[var(--color-muted)]">
          Aun no has generado filas de captura para este producto.
        </div>
      )}
    </article>
  );
}

export function OrderSizesSection({
  order,
  sizeTable,
  editRowId,
  message,
}: OrderSizesSectionProps) {
  const allRows = sizeTable?.size_table_rows ?? [];
  const supportedItems = order.order_items.filter(isSupportedSizeOrderItem);
  const expectedRows = supportedItems.reduce((sum, item) => sum + item.quantity, 0);
  const completedRows = allRows.filter(isSizeRowComplete).length;
  const pendingRows = Math.max(expectedRows - completedRows, 0);

  return (
    <section
      id="tallas"
      className="scroll-mt-32 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
        <Ruler className="h-4 w-4 text-[var(--color-brand)]" />
        Tallas
      </div>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        La captura se organiza por producto del pedido. Cada item genera tantas piezas
        como indique su cantidad y se llena segun su modo de captura.
      </p>
      <Link
        href={`/pedidos/${order.id}/tallas/pdf`}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
      >
        <Download className="h-4 w-4" />
        PDF de tallas
      </Link>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Productos
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {supportedItems.length}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Capturadas
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">
            {completedRows} / {expectedRows}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--color-panel)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-soft-muted)]">
            Pendientes
          </p>
          <p className="mt-1 text-lg font-semibold text-[var(--color-ink)]">{pendingRows}</p>
        </div>
      </div>

      {message === "size-rows-generated" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Se generaron las filas base de captura para el producto.
        </div>
      ) : null}
      {message === "size-rows-current" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Este producto ya tiene todas sus filas base generadas.
        </div>
      ) : null}
      {message === "size-row-updated" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          La talla se actualizo correctamente.
        </div>
      ) : null}
      {message === "size-row-deleted" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          La fila de talla se elimino correctamente.
        </div>
      ) : null}
      {message === "size-item-unsupported" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          El producto seleccionado no tiene una regla de tallas configurada.
        </div>
      ) : null}
      {message === "size-row-invalid" ||
      message === "size-row-error" ||
      message === "size-item-error" ||
      message === "size-table-error" ||
      message === "config" ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          No se pudo completar la accion de tallas. Revisa los datos e intenta de nuevo.
        </div>
      ) : null}

      {supportedItems.length ? (
        <div className="mt-4 space-y-4">
          {supportedItems.map((item) => (
            <ProductCaptureCard
              key={item.id}
              orderId={order.id}
              clientId={order.client_id}
              item={item}
              rows={getRowsForOrderItem(item, allRows)}
              editRowId={editRowId}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1.6rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] p-4">
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            Este pedido no tiene productos configurados para captura de tallas.
          </p>
        </div>
      )}
    </section>
  );
}
