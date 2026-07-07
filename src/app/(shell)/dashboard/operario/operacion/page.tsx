import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { OperarioOperacionPageContent } from "@/modules/operario";

export default function DashboardOperarioOperacionPage() {
  return (
    <RoleGate
      idRol={WmsRol.operario}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a la operación de bodega.
        </p>
      }
    >
      <OperarioOperacionPageContent />
    </RoleGate>
  );
}
