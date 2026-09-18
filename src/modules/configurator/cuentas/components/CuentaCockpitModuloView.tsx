"use client";

import { useCallback } from "react";
import { CatalogoListView } from "@/modules/admin-panel/catalogo/components/CatalogoListView";
import { CamionesListView } from "@/modules/admin-panel/camiones/components/CamionesListView";
import { ClientesListView } from "@/modules/admin-panel/clientes/components/ClientesListView";
import { CompradoresListView } from "@/modules/admin-panel/compradores/components/CompradoresListView";
import { InventarioMercanciaReportView } from "@/modules/admin-panel/inventario-mercancia/components/InventarioMercanciaReportView";
import { ListaPrecioListView } from "@/modules/admin-panel/lista-precio/components/ListaPrecioListView";
import { PlantasListView } from "@/modules/admin-panel/plantas/components/PlantasListView";
import { ProveedoresListView } from "@/modules/admin-panel/proveedores/components/ProveedoresListView";
import { useAsyncQuery } from "@/hooks/shared/useAsyncQuery";
import { CuentaCockpitHeader } from "@/modules/configurator/cuentas/components/CuentaCockpitHeader";
import { CuentaCockpitLoadingCard } from "@/modules/configurator/cuentas/components/CuentaCockpitLoadingCard";
import {
  CUENTA_COCKPIT_MODULO_COPY,
  type CuentaCockpitModuloId,
} from "@/modules/configurator/cuentas/constants/cuenta-cockpit";
import { getCuentaGobiernoConfigurator } from "@/modules/configurator/cuentas/services/cuentas.service";
import { UsuariosListView } from "@/modules/configurator/usuarios/components/UsuariosListView";
import { ComprasPageContent } from "@/modules/purchases";
import { OperadorOrdenesVentaPageContent } from "@/modules/sales";
import { TransportePageContent } from "@/modules/transport";

interface CuentaCockpitModuloViewProps {
  codigoCuenta: string;
  modulo: CuentaCockpitModuloId;
}

export function CuentaCockpitModuloView({
  codigoCuenta,
  modulo,
}: CuentaCockpitModuloViewProps) {
  if (modulo === "usuarios") {
    return <UsuariosListView codigoCuenta={codigoCuenta} />;
  }

  if (modulo === "catalogo") {
    return <CatalogoListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "lista-precio") {
    return <ListaPrecioListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "proveedores") {
    return <ProveedoresListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "clientes") {
    return <ClientesListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "compradores") {
    return <CompradoresListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "camiones") {
    return <CamionesListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "plantas") {
    return <PlantasListView codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "compras") {
    return <ComprasPageContent codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "ventas") {
    return (
      <OperadorOrdenesVentaPageContent
        codigoCuenta={codigoCuenta}
        mode="inspect"
      />
    );
  }

  if (modulo === "transporte") {
    return <TransportePageContent codigoCuenta={codigoCuenta} mode="inspect" />;
  }

  if (modulo === "reportes") {
    return (
      <InventarioMercanciaReportView
        codigoCuenta={codigoCuenta}
        mode="inspect"
      />
    );
  }

  return <CuentaCockpitModuloPlaceholder codigoCuenta={codigoCuenta} modulo={modulo} />;
}

function CuentaCockpitModuloPlaceholder({
  codigoCuenta,
  modulo,
}: CuentaCockpitModuloViewProps) {
  const copy = CUENTA_COCKPIT_MODULO_COPY[modulo];
  const fetchCuenta = useCallback(
    () => getCuentaGobiernoConfigurator(codigoCuenta),
    [codigoCuenta],
  );
  const { data: cuenta, isLoading, error } = useAsyncQuery(fetchCuenta);

  return (
    <main
      className={
        isLoading
          ? "flex flex-1 flex-col"
          : "flex flex-1 flex-col justify-start gap-8 pt-8 pb-10 sm:gap-10 sm:pt-12 sm:pb-14"
      }
    >
      {isLoading ? <CuentaCockpitLoadingCard /> : null}

      {error ? (
        <p
          role="alert"
          className="mx-auto max-w-xl rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 text-center polaria-text-body-sm text-polaria-danger"
        >
          {error}
        </p>
      ) : null}

      {cuenta ? <CuentaCockpitHeader cuenta={cuenta} /> : null}

      {!isLoading && !error && !cuenta ? (
        <p className="polaria-text-subtitle mx-auto px-4 text-center">
          No se encontró la cuenta.
        </p>
      ) : null}

      {cuenta ? (
        <section className="mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="rounded-2xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-6 sm:px-6">
            <h2 className="polaria-text-card-title">{copy.title}</h2>
            <p className="polaria-text-subtitle mt-2">{copy.description}</p>
            <ul className="mt-5 space-y-2">
              {copy.futureActions.map((action) => (
                <li
                  key={action}
                  className="polaria-text-body-sm text-polaria-w-50"
                >
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
