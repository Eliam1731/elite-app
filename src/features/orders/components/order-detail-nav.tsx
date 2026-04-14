"use client";

import Link from "next/link";
import { CreditCard, ReceiptText, Ruler, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type OrderDetailNavItem = {
  href: string;
  label: string;
  icon: typeof ReceiptText;
};

const items: OrderDetailNavItem[] = [
  { href: "#resumen", label: "Resumen", icon: ReceiptText },
  { href: "#tallas", label: "Tallas", icon: Ruler },
  { href: "#pagos", label: "Pagos", icon: CreditCard },
  { href: "#costos", label: "Costos", icon: Wallet },
];

function getCurrentHash() {
  if (typeof window === "undefined") {
    return "#resumen";
  }

  return window.location.hash || "#resumen";
}

export function OrderDetailNav() {
  const [activeHash, setActiveHash] = useState("#resumen");

  useEffect(() => {
    const syncHash = () => {
      setActiveHash(getCurrentHash());
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  return (
    <nav className="sticky top-[4.6rem] z-30 -mx-1 overflow-x-auto px-1 md:top-[5.2rem]">
      <div className="flex min-w-max gap-2 rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-2 shadow-[var(--shadow-soft)]">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeHash === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                active
                  ? "bg-[linear-gradient(135deg,var(--color-brand-soft),var(--color-brand))] text-white shadow-[0_14px_28px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
                  : "bg-[var(--color-panel)] text-[var(--color-muted)]",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className={active ? "text-white" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
