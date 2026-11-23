"use client";

import dynamic from "next/dynamic";
import { TenantScopeGuard } from "@/components/auth/guards/TenantScopeGuard";
import { ModuleRoleGate } from "@/components/shared/module/ModuleRoleGate";
import { WMS_MODULE } from "@/constants/wms/permissions";

const InventarioMercanciaReportView = dynamic(
  () =>
    import("@/modules/admin-panel").then((m) => ({
      default: m.InventarioMercanciaReportView,
    })),
  { loading: () => null, ssr: false },
);

export default function DashboardReporteriaPage() {
  return (
    <TenantScopeGuard>
      <ModuleRoleGate
        module={WMS_MODULE.AUDIT}
        fallback={
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
            <p className="polaria-text-subtitle text-center text-polaria-w-50">
              No tienes permiso para acceder a reportería operativa.
            </p>
          </div>
        }
      >
        <InventarioMercanciaReportView />
      </ModuleRoleGate>
    </TenantScopeGuard>
  );
}
