"use client";

import type { ReactNode } from "react";

interface PolariaRequestPageLayoutProps {
  title: string;
  hint: string;
  children: ReactNode;
}

/** Misma estructura de página que Integración (configurador) y Operación (operario). */
export function PolariaRequestPageLayout({
  title,
  hint,
  children,
}: PolariaRequestPageLayoutProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h1 className="polaria-text-display">{title}</h1>
        <p className="polaria-text-subtitle mt-3 text-polaria-w-50">{hint}</p>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </main>
  );
}
