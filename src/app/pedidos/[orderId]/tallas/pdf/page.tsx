import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import {
  PdfPrintButton,
  PdfPrintTrigger,
} from "@/components/shared/pdf-print-controls";
import { PageIntro } from "@/components/shared/page-intro";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import {
  buildDocumentFilename,
  formatDate,
} from "@/features/quotes/calculations";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import {
  getCaptureModeForSizeRow,
  isPendingValue,
} from "@/features/sizes/product-config";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getOrderById } from "@/services/orders/queries";
import { getSizeTableByOrderId } from "@/services/sizes/queries";
import type { SizeTableRowRecord } from "@/types/database";

type OrderSizesPdfPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams?: Promise<{ download?: string }>;
};

type ProductSizeGroup = {
  key: string;
  title: string;
  captureMode: "full" | "simple";
  rows: SizeTableRowRecord[];
};

function formatCell(value: string | null | undefined) {
  return isPendingValue(value) ? "Pendiente" : value;
}

function formatBooleanCell(value: boolean | null) {
  if (value === null) {
    return "Pendiente";
  }

  return value ? "Si" : "No";
}

function buildSizeGroups(rows: SizeTableRowRecord[]) {
  const groups = new Map<string, ProductSizeGroup>();

  rows.forEach((row) => {
    const captureMode = getCaptureModeForSizeRow(row);

    if (!captureMode) {
      return;
    }

    const key = `${row.order_item_id ?? row.product_name ?? "general"}-${captureMode}`;
    const existing = groups.get(key);

    if (existing) {
      existing.rows.push(row);
      return;
    }

    groups.set(key, {
      key,
      title: row.product_name || "Producto sin nombre",
      captureMode,
      rows: [row],
    });
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    rows: group.rows.sort((a, b) => {
      const pieceDiff = (a.piece_index ?? Number.MAX_SAFE_INTEGER) -
        (b.piece_index ?? Number.MAX_SAFE_INTEGER);

      if (pieceDiff !== 0) {
        return pieceDiff;
      }

      return a.sort_order - b.sort_order;
    }),
  }));
}

export async function generateMetadata({
  params,
}: OrderSizesPdfPageProps): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getOrderById(orderId);

  if (!order) {
    return {
      title: "tallas.pdf",
    };
  }

  return {
    title: buildDocumentFilename({
      clientName: order.clients?.name || "cliente",
      date: order.created_at,
      documentType: "tallas",
    }),
  };
}

export default async function OrderSizesPdfPage({
  params,
  searchParams,
}: OrderSizesPdfPageProps) {
  const { orderId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Tallas"
          title="PDF de tallas"
          description="Conecta Supabase para generar la hoja de produccion."
          backHref={`/pedidos/${orderId}#tallas`}
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, order, sizeTable] = await Promise.all([
    getBusinessSettings(),
    getOrderById(orderId),
    getSizeTableByOrderId(orderId),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Tallas"
          title="PDF de tallas"
          description="Falta la configuracion general del negocio."
          backHref={`/pedidos/${orderId}#tallas`}
        />
        <SettingsWarning />
      </div>
    );
  }

  if (!order) {
    notFound();
  }

  const allRows = sizeTable?.size_table_rows ?? [];
  const sizeGroups = buildSizeGroups(allRows);
  const autoPrint = resolvedSearchParams?.download === "1";
  const filename = buildDocumentFilename({
    clientName: order.clients?.name || "cliente",
    date: order.created_at,
    documentType: "tallas",
  });

  return (
    <div className="space-y-6 print:space-y-0">
      <PdfPrintTrigger autoPrint={autoPrint} />

      <div className="print:hidden">
        <PageIntro
          eyebrow="Tallas"
          title="Vista PDF de tallas"
          description="Hoja simple para produccion, lista para guardar como PDF o compartir manualmente."
          backHref={`/pedidos/${order.id}#tallas`}
        />
      </div>

      <section className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/pedidos/${order.id}#tallas`}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a tallas
          </Link>
          <div className="flex-1">
            <PdfPrintButton label="Guardar o descargar PDF" />
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
          Nombre sugerido del archivo:{" "}
          <span className="font-semibold text-[var(--color-ink)]">{filename}</span>
        </p>
      </section>

      <article className="mx-auto w-full max-w-6xl overflow-hidden rounded-[1.2rem] border border-[#D6DFEC] bg-white text-[#111827] shadow-[0_18px_38px_rgba(15,23,42,0.12)] print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        <header className="border-b border-[#D6DFEC] bg-[#EFF6FF] px-4 py-3 print:px-3 print:py-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">
                Elite
              </p>
              <h1 className="mt-1 text-xl font-bold text-[#111827] print:text-lg">
                Tabla de tallas
              </h1>
              <p className="mt-1 text-xs text-[#4B5563] print:text-[11px]">
                Cliente: {order.clients?.name || "Cliente sin nombre"}
              </p>
            </div>
            <div className="rounded-xl border border-[#D6DFEC] bg-white px-3 py-2 text-xs text-[#374151] print:px-2 print:py-1.5 print:text-[11px]">
              <p>
                <span className="font-semibold text-[#111827]">Pedido:</span>{" "}
                {order.folio || "Sin folio"}
              </p>
              <p className="mt-0.5">
                <span className="font-semibold text-[#111827]">Fecha:</span>{" "}
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-4 px-4 py-4 print:space-y-3 print:px-3 print:py-3">
          {sizeGroups.length > 0 ? (
            sizeGroups.map((group) => (
              <section
                key={group.key}
                className="space-y-2 break-inside-avoid-page print:space-y-1.5"
              >
                <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F8FAFC] px-3 py-2 print:px-2 print:py-1.5">
                  <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[#111827] print:text-[12px]">
                    {group.title}
                  </h2>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#475569] print:text-[10px]">
                    {group.rows.length} pieza{group.rows.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="overflow-hidden rounded-[0.8rem] border border-[#D6DFEC]">
                  {group.captureMode === "simple" ? (
                    <table className="w-full border-collapse text-left text-[12px] print:text-[10px]">
                      <thead className="bg-[#F8FAFC] text-[#111827]">
                        <tr>
                          <th className="px-2 py-2 font-semibold print:px-1.5 print:py-1.5">Numero</th>
                          <th className="px-2 py-2 font-semibold print:px-1.5 print:py-1.5">Talla</th>
                          <th className="px-2 py-2 font-semibold print:px-1.5 print:py-1.5">Especificaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, index) => (
                          <tr
                            key={row.id}
                            className={
                              index % 2 === 0
                                ? "border-t border-[#E5E7EB] bg-white"
                                : "border-t border-[#E5E7EB] bg-[#FCFCFD]"
                            }
                          >
                            <td className="px-2 py-1.5 print:px-1.5 print:py-1">
                              {formatCell(row.number)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1.5 print:py-1">
                              {formatCell(row.size)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1.5 print:py-1">
                              {formatCell(row.specifications)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full border-collapse text-left text-[12px] print:text-[9.5px]">
                      <thead className="bg-[#F8FAFC] text-[#111827]">
                        <tr>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Nombre</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Numero</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Talla</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Silueta</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Tipo de cuello</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Mangas</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Punos</th>
                          <th className="px-2 py-2 font-semibold print:px-1 print:py-1">Especificaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row, index) => (
                          <tr
                            key={row.id}
                            className={
                              index % 2 === 0
                                ? "border-t border-[#E5E7EB] bg-white"
                                : "border-t border-[#E5E7EB] bg-[#FCFCFD]"
                            }
                          >
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.player_name)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.number)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.size)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.silhouette)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.neck_type)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatBooleanCell(row.has_sleeves)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatBooleanCell(row.has_cuffs)}
                            </td>
                            <td className="px-2 py-1.5 print:px-1 print:py-0.5">
                              {formatCell(row.specifications)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>
            ))
          ) : (
            <section className="rounded-[1rem] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-center">
              <h2 className="text-base font-semibold text-[#111827]">
                Aun no hay tallas capturadas
              </h2>
              <p className="mt-2 text-sm leading-5 text-[#6B7280]">
                Genera y captura las filas de tallas en el pedido para poder imprimir la
                hoja de produccion.
              </p>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
