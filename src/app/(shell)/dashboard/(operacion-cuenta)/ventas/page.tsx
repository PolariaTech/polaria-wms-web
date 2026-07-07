"use client";

import { WMS_MODULE } from "@/constants/wms/permissions";
import { WmsRol } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { VentasOperadorHub, VentasPageContent } from "@/modules/sales";
import { useAuthStore } from "@/stores/auth.store";

export default function DashboardVentasPage() {
  const idRol = useAuthStore((state) => state.session?.idRol);
  const isOperadorCuenta = idRol === WmsRol.operador_cuenta;

  return (
    <OperationalModuleShell
      title="Ventas"
      description={
        isOperadorCuenta
          ? "Selecciona un flujo operativo de ventas."
          : "Órdenes de venta de la cuenta activa."
      }
      gate={{ module: WMS_MODULE.SALES }}
    >
      {isOperadorCuenta ? <VentasOperadorHub /> : <VentasPageContent />}
    </OperationalModuleShell>
  );
}
