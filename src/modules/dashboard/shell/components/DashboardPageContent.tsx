"use client";

import { WmsRol } from "@/constants/wms/roles";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { usePermissions } from "@/hooks/auth/usePermissions";
import {
  AdminPanelConnected,
  getAdminPanelActionHref,
  type AdminPanelActionId,
} from "@/modules/admin-panel";
import { ADMINISTRADOR_BODEGA_HOME_ROUTE } from "@/modules/administrador-bodega";
import { CUSTODIO_HOME_ROUTE } from "@/modules/custodio";
import { JEFE_BODEGA_HOME_ROUTE } from "@/modules/jefe-bodega";
import { OPERARIO_HOME_ROUTE } from "@/modules/operario";
import { PROCESADOR_HOME_ROUTE } from "@/modules/procesador";
import { DashboardHome } from "../../home/components/DashboardHome";
import { OperadorCuentaHub } from "../../operador-cuenta/components/OperadorCuentaHub";

export function DashboardPageContent() {
  const router = useRouter();
  const { idRol } = usePermissions();

  const handleAdminActionClick = useCallback(
    (actionId: AdminPanelActionId) => {
      router.push(getAdminPanelActionHref(actionId));
    },
    [router],
  );

  const isAdministradorBodega = idRol === WmsRol.administrador_bodega;
  const isJefeBodega = idRol === WmsRol.jefe_bodega;
  const isCustodio = idRol === WmsRol.custodio;
  const isOperario = idRol === WmsRol.operario;
  const isProcesador = idRol === WmsRol.procesador;

  useEffect(() => {
    if (isAdministradorBodega) {
      router.replace(ADMINISTRADOR_BODEGA_HOME_ROUTE);
      return;
    }

    if (isJefeBodega) {
      router.replace(JEFE_BODEGA_HOME_ROUTE);
      return;
    }

    if (isCustodio) {
      router.replace(CUSTODIO_HOME_ROUTE);
      return;
    }

    if (isOperario) {
      router.replace(OPERARIO_HOME_ROUTE);
      return;
    }

    if (isProcesador) {
      router.replace(PROCESADOR_HOME_ROUTE);
    }
  }, [
    isAdministradorBodega,
    isCustodio,
    isJefeBodega,
    isOperario,
    isProcesador,
    router,
  ]);

  if (
    isAdministradorBodega ||
    isJefeBodega ||
    isCustodio ||
    isOperario ||
    isProcesador
  ) {
    return null;
  }

  if (idRol === WmsRol.operador_cuenta) {
    return <OperadorCuentaHub />;
  }

  if (idRol === WmsRol.administrador_cuenta) {
    return <AdminPanelConnected onActionClick={handleAdminActionClick} />;
  }

  return <DashboardHome />;
}
