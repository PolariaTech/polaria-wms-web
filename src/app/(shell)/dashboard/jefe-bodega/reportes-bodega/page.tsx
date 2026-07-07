import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { JefeBodegaEstadoRedirect } from "@/modules/jefe-bodega/components/JefeBodegaEstadoRedirect";

export default function JefeBodegaReportesPage() {
  return (
    <RoleGate
      idRol={WmsRol.jefe_bodega}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a esta sección.
        </p>
      }
    >
      <JefeBodegaEstadoRedirect />
    </RoleGate>
  );
}
