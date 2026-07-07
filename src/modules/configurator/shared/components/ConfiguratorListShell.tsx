import type { ReactNode } from "react";
import { CONFIGURATOR_PANEL_TITLE } from "@/modules/configurator/shared/constants/configurator-actions";
import {
  CONFIGURATOR_LIST_HINT,
  CONFIGURATOR_SECTION_LABEL,
} from "@/modules/configurator/shared/constants/configurator-list";

interface ConfiguratorListShellProps {
  children: ReactNode;
}

export function ConfiguratorListShell({ children }: ConfiguratorListShellProps) {
  return (
    <main className="flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14 lg:gap-12 lg:pt-16 lg:pb-20">
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <p className="polaria-text-label text-polaria-teal">
          {CONFIGURATOR_SECTION_LABEL}
        </p>
        <h1 className="polaria-text-display mt-2">{CONFIGURATOR_PANEL_TITLE}</h1>
        <p className="polaria-text-subtitle mt-3">{CONFIGURATOR_LIST_HINT}</p>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
    </main>
  );
}
