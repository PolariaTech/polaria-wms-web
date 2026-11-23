"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/routes";
import { WMS_MODULE } from "@/constants/wms/permissions";
import { WmsRol } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { useAuthStore } from "@/stores/auth.store";

const VentasPageContent = dynamic(
  () =>
    import("@/modules/sales").then((m) => ({
      default: m.VentasPageContent,
    })),
  { loading: () => null, ssr: false },
);

export default function DashboardVentasPage() {
  const router = useRouter();
  const idRol = useAuthStore((state) => state.session?.idRol);
  const isOperadorCuenta = idRol === WmsRol.operador_cuenta;

  useEffect(() => {
    if (isOperadorCuenta) {
      router.replace(ROUTES.dashboardVentasOrdenes);
    }
  }, [isOperadorCuenta, router]);

  if (isOperadorCuenta) {
    return null;
  }

  return (
    <OperationalModuleShell
      title="Ventas"
      description="Órdenes de venta de la cuenta activa."
      gate={{ module: WMS_MODULE.SALES }}
    >
      <VentasPageContent />
    </OperationalModuleShell>
  );
}
