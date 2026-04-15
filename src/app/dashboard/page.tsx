import Link from "next/link";
import {
  CreditCard,
  Gauge,
  Landmark,
  Package2,
  Ruler,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency } from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getDashboardSummary } from "@/services/dashboard/queries";

const summaryCards = [
  {
    key: "salesThisMonth",
    label: "Ventas del mes",
    href: "/dashboard/ventas",
    description: "Pedidos creados este mes, sin cancelados.",
    icon: ShoppingBag,
  },
  {
    key: "collectedThisMonth",
    label: "Ingresos del mes",
    href: "/dashboard/ingresos",
    description: "Pagos recibidos en el mes actual.",
    icon: Wallet,
  },
  {
    key: "pendingCollection",
    label: "Pendiente por cobrar",
    href: "/dashboard/pendientes",
    description: "Saldo real pendiente por pedido.",
    icon: CreditCard,
  },
  {
    key: "shippingExpensesThisMonth",
    label: "Gastos de envio del mes",
    href: "/dashboard/envios",
    description: "Registro mensual de envios y paqueteria.",
    icon: Landmark,
  },
] as const;

const quickAccessCards = [
  {
    href: "/tallas",
    label: "Tallas",
    description: "Administra el catalogo global y entra al flujo operativo por pedido.",
    icon: Ruler,
  },
  {
    href: "/productos",
    label: "Productos",
    description: "Consulta y ajusta el catalogo base para cotizar y producir.",
    icon: Package2,
  },
] as const;

export default async function DashboardPage() {
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Elite"
          title="Dashboard"
          description="Conecta Supabase para ver el resumen financiero del mes."
        />
        <SupabaseBanner />
      </div>
    );
  }

  const [settings, summary] = await Promise.all([
    getBusinessSettings(),
    getDashboardSummary(),
  ]);

  if (!settings) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Elite"
          title="Dashboard"
          description="Falta la configuracion general del negocio para mostrar importes."
        />
        <SettingsWarning />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Elite"
        title="Dashboard financiero"
        description={`Resumen de ${summary.monthLabel}. Toca una tarjeta para revisar el detalle del apartado.`}
      />

      <section className="rounded-[1.75rem] border border-blue-400/30 bg-gradient-to-r from-blue-700 to-blue-500 p-5 text-white shadow-[0_22px_40px_rgba(29,78,216,0.32)] [&_svg]:text-white [&_svg]:stroke-white">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-white shadow-[0_14px_26px_rgba(15,23,42,0.18)]">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">
              Dashboard
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-white">
              Corte mensual
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/86">
              La portada ya solo muestra los totales clave. Cada apartado tiene su
              propia vista para revisar detalle sin mezclar informacion.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];

          return (
            <Link
              key={card.key}
              href={card.href}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)]"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-ink)]">
                    {formatCurrency(value, settings.currency_code)}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    {card.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-soft-muted)]">
            Accesos rapidos
          </p>
          <h2 className="mt-2 text-xl font-bold text-[var(--color-ink)]">
            Catalogos operativos
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
            Entradas directas a modulos de apoyo que no van en la barra inferior.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {quickAccessCards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {card.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                      {card.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
