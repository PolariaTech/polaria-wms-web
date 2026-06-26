"use client";

import { PERMISSION } from "@/constants/permissions";
import { OperationalModuleShell } from "@/components/shared/OperationalModuleShell";
import { MapaInventarioPageContent } from "@/modules/inventory";

export default function DashboardMapaPage() {
  return (
    <OperationalModuleShell
      title="Mapa de inventario"
      description="Estado en tiempo real por ubicación en la bodega activa."
      gate={{ permission: PERMISSION.INVENTORY_READ }}
      accessDeniedMessage="No tienes permiso para consultar el inventario de esta bodega."
    >
      <MapaInventarioPageContent />
    </OperationalModuleShell>
  );
}
