import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { ProcesadorOperacionPageContent } from "@/modules/procesador";

export default function DashboardProcesadorOperacionPage() {
  return (
    <RoleGate
      idRol={WmsRol.procesador}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a la operación de bodega.
        </p>
      }
    >
      <ProcesadorOperacionPageContent />
    </RoleGate>
  );
}
