import { WmsRol } from "@/constants/wms/roles";
import { RoleGate } from "@/components/auth/guards/RoleGate";
import { CustodioOrdenCompraPageContent } from "@/modules/custodio";

export default function CustodioOrdenCompraPage() {
  return (
    <RoleGate
      idRol={WmsRol.custodio}
      fallback={
        <p className="px-4 py-8 polaria-text-body-sm text-polaria-w-50">
          No tienes acceso a la vista de custodio.
        </p>
      }
    >
      <CustodioOrdenCompraPageContent />
    </RoleGate>
  );
}
