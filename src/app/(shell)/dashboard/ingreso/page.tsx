"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROLES_INGRESO_BODEGA, WmsRol } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { CUSTODIO_HOME_ROUTE } from "@/modules/custodio";
import { OPERARIO_HOME_ROUTE } from "@/modules/operario";
import { IngresoPageContent } from "@/modules/purchases";

export default function DashboardIngresoPage() {
  const router = useRouter();
  const { idRol } = usePermissions();

  useEffect(() => {
    if (idRol === WmsRol.custodio) {
      router.replace(CUSTODIO_HOME_ROUTE);
      return;
    }

    if (idRol === WmsRol.operario) {
      router.replace(OPERARIO_HOME_ROUTE);
    }
  }, [idRol, router]);

  if (idRol === WmsRol.custodio || idRol === WmsRol.operario) {
    return null;
  }

  return (
    <OperationalModuleShell
      title="Ingreso"
      description="Recepciones de mercancía contra órdenes de compra."
      gate={{ roles: ROLES_INGRESO_BODEGA }}
    >
      <IngresoPageContent />
    </OperationalModuleShell>
  );
}
