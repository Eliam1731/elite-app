import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  backHref,
  actionHref,
  actionLabel,
}: PageIntroProps) {
  return (
    <header className="mb-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-elevated)] text-[var(--color-ink)] shadow-[var(--shadow-soft)]"
              aria-label="Volver"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <div />
          )}
        </div>

        <div className="flex items-center gap-3">
          {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-5 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
          >
            <span className="text-white">{actionLabel}</span>
          </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-brand)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
