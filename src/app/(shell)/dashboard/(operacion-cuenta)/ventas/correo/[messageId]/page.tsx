import { CorreoCompletoPantalla } from "@/modules/sales/correos/components/CorreoCompletoVista";

export default async function DashboardVentasCorreoPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
  return <CorreoCompletoPantalla messageId={messageId} />;
}
