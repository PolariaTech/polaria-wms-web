import { OperationalModuleShell } from "@/components/shared/module/OperationalModuleShell";
import { ROLES_NIVEL_CUENTA } from "@/constants/wms/roles";
import { CorreoCompletoVista } from "@/modules/sales/correos/components/CorreoCompletoVista";

export default async function DashboardVentasCorreoPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  return (
    <OperationalModuleShell
      title="Correo completo"
      description="El correo tal como llegó, con su mensaje y sus adjuntos."
      gate={{ roles: ROLES_NIVEL_CUENTA }}
    >
      <CorreoCompletoVista messageId={messageId} />
    </OperationalModuleShell>
  );
}
