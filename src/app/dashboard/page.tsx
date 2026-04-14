import Link from "next/link";
import {
  ClipboardList,
  CreditCard,
  DollarSign,
  Gauge,
  Package2,
  Ruler,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageIntro } from "@/components/shared/page-intro";
import { formatCurrency } from "@/features/quotes/calculations";
import { SupabaseBanner } from "@/features/clients/components/supabase-banner";
import { SettingsWarning } from "@/features/quotes/components/settings-warning";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getBusinessSettings } from "@/services/business-settings/queries";
import { getMonthlyDashboardSummary } from "@/services/dashboard/queries";

const modules = [
  {
    href: "/clientes",
    label: "Clientes",
    description: "Alta, consulta y edicion rapida.",
    icon: Users,
  },
  {
    href: "/cotizaciones",
    label: "Cotizaciones",
    description: "Preparado para el siguiente bloque.",
    icon: ClipboardList,
  },
  {
    href: "/pedidos",
    label: "Pedidos",
    description: "Seguimiento de produccion y entrega.",
    icon: ShoppingBag,
  },
  {
    href: "/tallas",
    label: "Tallas",
    description: "Catalogo global y captura operativa por pedido.",
    icon: Ruler,
  },
  {
    href: "/pagos",
    label: "Pagos",
    description: "Registro dentro del detalle del pedido.",
    icon: CreditCard,
  },
  {
    href: "/productos",
    label: "Productos",
    description: "Catalogo base para cotizar y producir.",
    icon: Package2,
  },
];

const summaryCards = [
  {
    key: "salesThisMonth",
    label: "Ventas del mes",
    icon: DollarSign,
  },
  {
    key: "collectedThisMonth",
    label: "Ingresos del mes",
    icon: Wallet,
  },
  {
    key: "pendingCollection",
    label: "Pendiente por cobrar",
    icon: CreditCard,
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
    getMonthlyDashboardSummary(),
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
        description={`Resumen de ${summary.monthLabel} para revisar ventas, ingresos y pendiente por cobrar desde el celular.`}
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
              Vista simple de rendimiento para seguir el mes actual sin graficas
              complejas ni ruido visual.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];

          return (
            <article
              key={card.key}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
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
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    Mes actual: {summary.monthLabel}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;

          return (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_26px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {module.label}
                  </p>
                  <p className="text-xs leading-5 text-[var(--color-muted)]">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <EmptyState
        title="Operacion del mes a un toque"
        description="Desde aqui puedes saltar a pedidos, pagos y tallas para capturar informacion del mes sin perder el contexto financiero."
        actionHref="/pedidos"
        actionLabel="Abrir pedidos"
        icon={<ShoppingBag className="h-6 w-6" />}
      />
    </div>
  );
}
