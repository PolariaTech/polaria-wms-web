import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { AdministradorBodegaReportesPageContent } from "@/modules/administrador-bodega";

export default function AdministradorBodegaReportesPage() {
  return (
    <RoleGate
      idRol={WmsRol.administrador_bodega}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a los reportes de bodega.
        </p>
      }
    >
      <AdministradorBodegaReportesPageContent />
    </RoleGate>
  );
}
