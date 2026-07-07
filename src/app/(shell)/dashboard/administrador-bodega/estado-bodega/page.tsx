import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { AdministradorBodegaEstadoPageContent } from "@/modules/administrador-bodega";

export default function AdministradorBodegaEstadoPage() {
  return (
    <RoleGate
      idRol={WmsRol.administrador_bodega}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso al estado de bodega.
        </p>
      }
    >
      <AdministradorBodegaEstadoPageContent />
    </RoleGate>
  );
}
