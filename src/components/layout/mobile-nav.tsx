"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Gauge,
  ShoppingBag,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Gauge },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/cotizaciones", label: "Cotizar", icon: ClipboardList },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
];

export function MobileNav() {
  const pathname = usePathname();
  const items = primaryItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 md:px-6 md:pb-6">
      <div className="mx-auto w-full max-w-6xl rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-elevated)] p-3 shadow-[var(--shadow-strong)] backdrop-blur-xl">
        <ul className="grid grid-cols-4 gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition duration-200",
                    active
                      ? "bg-[linear-gradient(135deg,var(--color-brand),var(--color-brand-strong))] text-white shadow-[0_18px_35px_var(--color-brand-shadow)] [&_svg]:text-white [&_svg]:stroke-white"
                      : "bg-[var(--color-panel)] text-[var(--color-muted)] hover:bg-[var(--color-panel-strong)]",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-white stroke-white" : "",
                    )}
                    strokeWidth={2.2}
                  />
                  <span className={cn(active ? "text-white" : "")}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
