import { CuentaCockpitView } from "@/modules/configurator";

type PageProps = {
  params: Promise<{ codigoCuenta: string }>;
};

export default async function ConfiguradorCuentaCockpitPage({
  params,
}: PageProps) {
  const { codigoCuenta: rawCodigo } = await params;
  const codigoCuenta = decodeURIComponent(rawCodigo ?? "").trim();

  return <CuentaCockpitView codigoCuenta={codigoCuenta} />;
}
