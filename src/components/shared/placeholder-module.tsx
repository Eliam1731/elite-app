import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { PageIntro } from "@/components/shared/page-intro";

type PlaceholderModuleProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  helperText?: string;
};

export function PlaceholderModule({
  title,
  description,
  actionHref = "/clientes",
  actionLabel = "Seguir con Clientes",
  helperText = "Este modulo todavia no esta implementado. La base visual y la navegacion ya quedaron listas para continuar con el siguiente bloque del MVP.",
}: PlaceholderModuleProps) {
  return (
    <div className="space-y-6">
      <PageIntro eyebrow="Elite MVP" title={title} description={description} />

      <section className="rounded-[2rem] bg-[var(--color-panel)] p-5">
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          {helperText}
        </p>

        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-brand)]"
        >
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
