"use client";

import { ROLES_MAPA_BODEGA } from "@/constants/wms/roles";
import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { MapaInventarioPageContent } from "@/modules/inventory";

export default function DashboardMapaPage() {
  return (
    <OperationalModuleShell
      title="Mapa de inventario"
      description="Estado en tiempo real por ubicación en la bodega activa."
      gate={{ roles: ROLES_MAPA_BODEGA }}
      accessDeniedMessage="No tienes permiso para consultar el inventario de esta bodega."
    >
      <MapaInventarioPageContent />
    </OperationalModuleShell>
  );
}
