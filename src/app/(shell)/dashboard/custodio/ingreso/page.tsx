import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { CustodioIngresoPageContent } from "@/modules/custodio";

export default function CustodioIngresoPage() {
  return (
    <RoleGate
      idRol={WmsRol.custodio}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a la vista de custodio.
        </p>
      }
    >
      <CustodioIngresoPageContent />
    </RoleGate>
  );
}
