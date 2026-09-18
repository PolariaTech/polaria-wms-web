import { notFound, redirect } from "next/navigation";
import { CuentaCockpitModuloView } from "@/modules/configurator";
import {
  getCuentaGobiernoHref,
  isCuentaCockpitModalModulo,
  isCuentaCockpitModuloId,
} from "@/modules/configurator/cuentas/constants/cuenta-cockpit";

type PageProps = {
  params: Promise<{ codigoCuenta: string; modulo: string }>;
};

export default async function ConfiguradorCuentaModuloPage({
  params,
}: PageProps) {
  const { codigoCuenta: rawCodigo, modulo } = await params;
  const codigoCuenta = decodeURIComponent(rawCodigo ?? "").trim();

  if (!codigoCuenta || !isCuentaCockpitModuloId(modulo)) {
    notFound();
  }

  if (isCuentaCockpitModalModulo(modulo)) {
    redirect(getCuentaGobiernoHref(codigoCuenta));
  }

  return (
    <CuentaCockpitModuloView codigoCuenta={codigoCuenta} modulo={modulo} />
  );
}
