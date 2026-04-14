import Link from "next/link";
import { ChevronRight, Phone } from "lucide-react";

import type { ClientRecord } from "@/types/database";

type ClientCardProps = {
  client: ClientRecord;
};

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link
      href={`/clientes/${client.id}`}
      className="flex items-center gap-3 rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--color-line-strong)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] font-display text-lg font-bold text-white shadow-[0_14px_26px_var(--color-brand-shadow)]">
        {client.name.slice(0, 1).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
          {client.name}
        </p>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted)]">
          <Phone className="h-3.5 w-3.5" />
          <span className="truncate">{client.phone}</span>
        </div>
        {client.rfc ? (
          <p className="mt-1 truncate text-xs text-[var(--color-soft-muted)]">
            RFC: {client.rfc}
          </p>
        ) : null}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-soft-muted)]" />
    </Link>
  );
}
