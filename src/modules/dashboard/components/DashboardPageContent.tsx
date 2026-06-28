"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { WmsRol } from "@/constants/roles";
import { usePermissions } from "@/hooks/usePermissions";
import {
  AdminPanelConnected,
  getAdminPanelActionHref,
  type AdminPanelActionId,
} from "@/modules/admin-panel";
import { DashboardHome } from "./DashboardHome";
import { OperadorCuentaHub } from "./OperadorCuentaHub";

export function DashboardPageContent() {
  const router = useRouter();
  const { idRol } = usePermissions();

  const handleAdminActionClick = useCallback(
    (actionId: AdminPanelActionId) => {
      router.push(getAdminPanelActionHref(actionId));
    },
    [router],
  );

  if (idRol === WmsRol.operador_cuenta) {
    return <OperadorCuentaHub />;
  }

  if (idRol === WmsRol.administrador_cuenta) {
    return <AdminPanelConnected onActionClick={handleAdminActionClick} />;
  }

  return <DashboardHome />;
}
