"use client";

import type { ReactNode } from "react";
import type { CustodioTabId } from "../constants/custodio-routes";
import { CustodioOperacionTabs } from "./CustodioOperacionTabs";

interface CustodioTabPageShellProps {
  activeTab: CustodioTabId;
  subtitle: string;
  children: ReactNode;
}

export function CustodioTabPageShell({
  activeTab,
  subtitle,
  children,
}: CustodioTabPageShellProps) {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="polaria-text-display">Estado de bodega</h1>
        <p className="polaria-text-subtitle mt-2 text-polaria-w-50">{subtitle}</p>
      </header>

      <CustodioOperacionTabs activeTab={activeTab} />

      {children}
    </main>
  );
}
