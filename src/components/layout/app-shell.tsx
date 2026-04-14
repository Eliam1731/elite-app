import type { ReactNode } from "react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-app)] text-[var(--color-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col">
        <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color:var(--color-app-header)] backdrop-blur print:hidden">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-6 lg:px-8">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-brand)]">
                Elite
              </p>
              <h1 className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">
                Uniformes deportivos
              </h1>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 print:px-0 print:pb-0 print:pt-0 md:px-6 md:pb-32 md:pt-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <div className="print:hidden">
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
