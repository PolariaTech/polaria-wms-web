"use client";

import type { CustodioTabId } from "../constants/custodio-routes";
import { CustodioOperacionTabs } from "./CustodioOperacionTabs";

interface CustodioPlaceholderPageContentProps {
  activeTab: Exclude<CustodioTabId, "ingreso">;
  title: string;
}

export function CustodioPlaceholderPageContent({
  activeTab,
  title,
}: CustodioPlaceholderPageContentProps) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="polaria-text-display">Estado de bodega</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">
          Mapa operativo de slots por zona
        </p>
      </header>

      <CustodioOperacionTabs activeTab={activeTab} />

      <section className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 p-8 text-center polaria-card-glow">
        <h2 className="polaria-text-body font-semibold text-polaria-w">
          {title}
        </h2>
        <p className="mt-2 polaria-text-body-sm text-polaria-w-50">
          Esta vista estará disponible próximamente.
        </p>
      </section>
    </main>
  );
}
