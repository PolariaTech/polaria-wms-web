import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { JefeBodegaEstadoPageContent } from "@/modules/jefe-bodega";

export default function JefeBodegaEstadoPage() {
  return (
    <RoleGate
      idRol={WmsRol.jefe_bodega}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso al estado de bodega.
        </p>
      }
    >
      <JefeBodegaEstadoPageContent />
    </RoleGate>
  );
}
