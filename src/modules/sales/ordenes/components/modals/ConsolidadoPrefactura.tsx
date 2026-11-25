"use client";

import { useEffect, useState } from "react";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { blobPrefacturaDeOt } from "../../print-batch/blob-prefactura-ot";
import {
  TIPO_PREFACTURA_IMPRESA,
  filasPrefactura,
  otAprobada,
  otImpresa,
  type FilaPrefactura,
} from "../../print-batch/prefactura-seguimiento";
import { fetchOrdenVentaLog, postOrdenVentaLog } from "../../services/orden-venta-log.client";

const INTERVALO_BITACORA_PREFACTURA_MS = 3000;

function payloadsDe(entradas: { payloadTipo?: string | null; idOrdenTrabajo: string | null }[]) {
  return entradas.map((entrada) => ({
    tipo: entrada.payloadTipo ?? "",
    idOrdenTrabajo: entrada.idOrdenTrabajo ?? "",
  }));
}

function nombreVisible(fila: FilaPrefactura): string {
  return fila.centro.trim() || fila.numero;
}

function TablaPrefactura({
  filas,
  payloads,
}: {
  filas: FilaPrefactura[];
  payloads: Record<string, unknown>[];
}) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="polaria-text-label text-polaria-w-50">
          <th className="border-b border-polaria-t-20 px-2 py-2 font-medium">Centro</th>
          <th className="border-b border-polaria-t-20 px-2 py-2 font-medium">Impreso</th>
          <th className="border-b border-polaria-t-20 px-2 py-2 font-medium">Aprobado</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => (
          <tr key={fila.id}>
            <td className="border-b border-polaria-w-08 px-2 py-2 text-polaria-w">{nombreVisible(fila)}</td>
            <td className="border-b border-polaria-w-08 px-2 py-2 text-polaria-w">
              {otImpresa(payloads, fila.id) ? "Sí" : "No"}
            </td>
            <td className="border-b border-polaria-w-08 px-2 py-2 text-polaria-w">
              {otAprobada(payloads, fila.id) ? "Sí" : "No"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IconosPrefactura({
  filas,
  onAbrir,
}: {
  filas: FilaPrefactura[];
  onAbrir: (fila: FilaPrefactura) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {filas.map((fila) => (
        <button
          key={fila.id}
          type="button"
          className="flex flex-col items-center gap-1 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 text-polaria-teal"
          aria-label={`PDF ${nombreVisible(fila)}`}
          onClick={() => onAbrir(fila)}
        >
          <IconoPdf />
          <span className="polaria-text-label max-w-36 text-center text-polaria-w">{nombreVisible(fila)}</span>
        </button>
      ))}
    </div>
  );
}

function IconoPdf() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
      <path
        d="M7 3h7l5 5v13H7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function claveDePayload(payload: Record<string, unknown>): string {
  const tipo = typeof payload.tipo === "string" ? payload.tipo.trim() : "";
  const idOrdenTrabajo =
    typeof payload.idOrdenTrabajo === "string" ? payload.idOrdenTrabajo.trim() : "";
  return `${tipo}|${idOrdenTrabajo}`;
}

/** La bitácora manda. Lo que aún no llegó al servidor (una impresión recién hecha) se conserva. */
function unirBitacora(
  locales: readonly Record<string, unknown>[],
  remotos: readonly Record<string, unknown>[],
): Record<string, unknown>[] {
  const yaLlegaron = new Set(remotos.map(claveDePayload));
  const soloLocales = locales.filter((payload) => !yaLlegaron.has(claveDePayload(payload)));
  return [...remotos, ...soloLocales];
}

function aplicarBitacora(
  entradas: { payloadTipo?: string | null; idOrdenTrabajo: string | null }[],
  setPayloads: (valor: (actuales: Record<string, unknown>[]) => Record<string, unknown>[]) => void,
) {
  setPayloads((actuales) => unirBitacora(actuales, payloadsDe(entradas)));
}

function leerBitacoraPrefactura(
  idOrdenVenta: string,
  cuenta: string,
  sigueVigente: () => boolean,
  setPayloads: (valor: (actuales: Record<string, unknown>[]) => Record<string, unknown>[]) => void,
) {
  void fetchOrdenVentaLog({ idOrdenVenta, codigoCuenta: cuenta })
    .then((entradas) => {
      if (!sigueVigente()) return;
      aplicarBitacora(entradas, setPayloads);
    })
    .catch((causa: unknown) => {
      if (!sigueVigente()) return;
      // La siguiente lectura reintenta. La columna conserva la última bitácora válida.
      void (causa instanceof Error ? causa.message : "No se pudo leer la bitácora.");
    });
}

function useBitacoraPrefactura(orden: OrdenVentaDetalleRow) {
  const [payloads, setPayloads] = useState<Record<string, unknown>[]>([]);
  useEffect(() => {
    const cuenta = orden.codigo_cuenta?.trim();
    const idOrdenVenta = orden.id_orden_venta;
    if (!cuenta) return;
    let vigente = true;
    const sigueVigente = () => vigente;
    const leer = () => leerBitacoraPrefactura(idOrdenVenta, cuenta, sigueVigente, setPayloads);
    const leerSiVisible = () => {
      if (document.visibilityState === "visible") leer();
    };

    leer();
    const reloj = window.setInterval(leer, INTERVALO_BITACORA_PREFACTURA_MS);
    window.addEventListener("focus", leer);
    window.addEventListener("pageshow", leer);
    document.addEventListener("visibilitychange", leerSiVisible);
    return () => {
      vigente = false;
      window.clearInterval(reloj);
      window.removeEventListener("focus", leer);
      window.removeEventListener("pageshow", leer);
      document.removeEventListener("visibilitychange", leerSiVisible);
    };
  }, [orden.codigo_cuenta, orden.id_orden_venta]);
  return { payloads, setPayloads };
}

async function abrirPrefactura(input: {
  orden: OrdenVentaDetalleRow;
  codigoEmpresa: string;
  fila: FilaPrefactura;
  setUrl: (valor: string | null | ((anterior: string | null) => string | null)) => void;
  setPayloads: (valor: (actuales: Record<string, unknown>[]) => Record<string, unknown>[]) => void;
}): Promise<void> {
  const blob = await blobPrefacturaDeOt(input.orden, input.codigoEmpresa, input.fila.id);
  const siguiente = URL.createObjectURL(blob);
  input.setUrl((anterior) => {
    if (anterior) URL.revokeObjectURL(anterior);
    return siguiente;
  });
  input.setPayloads((actuales) => [
    ...actuales,
    { tipo: TIPO_PREFACTURA_IMPRESA, idOrdenTrabajo: input.fila.id },
  ]);
  const cuenta = input.orden.codigo_cuenta?.trim();
  if (!cuenta) return;
  void postOrdenVentaLog({
    idOrdenVenta: input.orden.id_orden_venta,
    codigoCuenta: cuenta,
    accion: "actualizacion",
    mensaje: `Prefactura ${nombreVisible(input.fila)} impresa.`,
    idOrdenTrabajo: input.fila.id,
    idBodega: input.orden.id_bodega,
    payloadExtra: { tipo: TIPO_PREFACTURA_IMPRESA },
  });
}

export function ConsolidadoPrefactura({
  orden,
  codigoEmpresa,
}: {
  orden: OrdenVentaDetalleRow;
  codigoEmpresa: string;
}) {
  const filas = filasPrefactura(
    orden.origen_correo,
    orden.orden_compra_hotel || orden.codigo,
    orden.centro_consumo ?? "",
  );
  const { payloads, setPayloads } = useBitacoraPrefactura(orden);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  async function abrir(fila: FilaPrefactura) {
    setError(null);
    try {
      await abrirPrefactura({ orden, codigoEmpresa, fila, setUrl, setPayloads });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : "No se pudo armar la prefactura.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <TablaPrefactura filas={filas} payloads={payloads} />
      <IconosPrefactura filas={filas} onAbrir={(fila) => void abrir(fila)} />
      {error ? <p className="polaria-text-body-sm text-polaria-w">{error}</p> : null}
      {url ? (
        <iframe
          title="Prefactura"
          src={url}
          className="h-[32rem] w-full rounded-xl border border-polaria-w-08 bg-polaria-bg"
        />
      ) : null}
    </div>
  );
}
