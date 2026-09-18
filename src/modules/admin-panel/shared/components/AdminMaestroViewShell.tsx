import type { ReactNode } from "react";
import { AdminCatalogListShell } from "@/modules/admin-panel/shared/components/AdminCatalogListShell";
import { ConfiguratorListShell } from "@/modules/configurator/shared/components/ConfiguratorListShell";

interface AdminMaestroViewShellProps {
  inspect: boolean;
  sectionLabel: string;
  title: string;
  hint: string;
  children: ReactNode;
}

export function AdminMaestroViewShell({
  inspect,
  sectionLabel,
  title,
  hint,
  children,
}: AdminMaestroViewShellProps) {
  if (inspect) {
    return <ConfiguratorListShell>{children}</ConfiguratorListShell>;
  }

  return (
    <AdminCatalogListShell
      sectionLabel={sectionLabel}
      title={title}
      hint={hint}
    >
      {children}
    </AdminCatalogListShell>
  );
}
