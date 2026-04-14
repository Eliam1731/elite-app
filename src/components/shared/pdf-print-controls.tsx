"use client";

import { useEffect } from "react";

type PdfPrintTriggerProps = {
  autoPrint: boolean;
};

export function PdfPrintTrigger({ autoPrint }: PdfPrintTriggerProps) {
  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint]);

  return null;
}

export function PdfPrintButton({ label }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--color-brand-shadow)]"
    >
      <span className="text-white">{label ?? "Guardar o descargar PDF"}</span>
    </button>
  );
}
