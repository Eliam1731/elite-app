import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  icon,
}: EmptyStateProps) {
  return (
    <section className="rounded-[2rem] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-panel)] px-5 py-8 text-center shadow-[var(--shadow-soft)]">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_16px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
        {description}
      </p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
        >
          <span className="text-white">{actionLabel}</span>
        </Link>
      ) : null}
    </section>
  );
}
