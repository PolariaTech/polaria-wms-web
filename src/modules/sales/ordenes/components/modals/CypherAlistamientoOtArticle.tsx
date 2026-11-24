import { Lock } from "lucide-react";
import { PolariaRemoteImage } from "@/components/shared/media/PolariaRemoteImage";
import { formatDateTime } from "@/components/shared/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { formatKgEs } from "@/lib/utils/decimal-es";
import { leerFolioFactura } from "../../surtido/folio-factura-captura";
import { filterLineasByOrdenTrabajoHija } from "../../utils/ot/filter-lineas-by-orden-trabajo";
import {
  normalizeIdOrdenTrabajo,
  type OrdenTrabajoHija,
} from "../../utils/origen/origen-correo-ordenes-trabajo";
import { resolveOrdenVentaLineaTitulo } from "../../utils/display/orden-venta-display";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";
import { notaCapturaForLinea } from "../../utils/pedido/build-orden-venta-captura-observaciones";
import {
  campoCaptura,
  formatElapsedSince,
  type CapturaApiRow,
} from "./cypher-alistamiento-captura";
import { CypherAlistamientoCheckMark } from "./CypherAlistamientoCheckMark";

export function CypherAlistamientoOtArticle({
  hija,
  index,
  orden,
  otsCount,
  capturaByOt,
  impresaAt,
  now,
  onVerFotosOt,
}: {
  hija: OrdenTrabajoHija;
  index: number;
  orden: OrdenVentaDetalleRow;
  otsCount: number;
  capturaByOt: Map<string, CapturaApiRow>;
  impresaAt: string | null;
  now: number;
  onVerFotosOt?: (idOrdenTrabajo: string) => void;
}) {
  const otKey = normalizeIdOrdenTrabajo(hija.id);
  const captura = capturaByOt.get(otKey) ?? capturaByOt.get("");
  const escaneada = Boolean(captura);
  const cocina =
    hija.almacen?.trim() ||
    hija.label.split("—").slice(1).join("—").trim() ||
    hija.label ||
    "Cocina";
  const lineasOt = filterLineasByOrdenTrabajoHija(
    orden.lineas ?? [],
    hija.renglones.length > 0 ? hija : null,
    { emptyFallback: hija.renglones.length === 0 ? "all" : "none" },
  );
  const payload = captura?.payload;
  const despachoNombre = campoCaptura(
    payload?.campos,
    "despachoNombre",
    "Despachó nombre",
    "Despachó",
  );
  const folio = leerFolioFactura(payload?.campos);
  const escaneoAt = captura?.updatedAt ?? null;
  const notasLineas = orden.notas_lineas?.trim() || "";

  return (
    <article
      key={hija.id || `ot-${index}`}
      className="overflow-hidden rounded-2xl border border-polaria-t-20 bg-polaria-t-08"
    >
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-polaria-w-08 px-3 py-3 sm:px-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="inline-flex shrink-0 items-center rounded-lg bg-polaria-teal px-2 py-1 text-xs font-bold leading-none"
            style={{ color: "#000000" }}
          >
            OT {index + 1}
          </span>
          <div className="min-w-0">
            <p className="polaria-text-body-sm font-semibold text-polaria-w">
              {cocina}
            </p>
            {orden.direccion_entrega?.trim() ? (
              <p className="mt-0.5 line-clamp-2 polaria-text-caption text-polaria-w-50">
                {orden.direccion_entrega.trim()}
              </p>
            ) : null}
          </div>
        </div>
        {escaneada ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-polaria-t-20 bg-polaria-bg/60 px-2.5 py-1 polaria-text-caption font-semibold text-polaria-teal">
            <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
            Escaneada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-lg border border-polaria-danger-border px-2.5 py-1 polaria-text-caption font-semibold text-polaria-danger">
            Impresa, sin escanear
          </span>
        )}
      </header>

      {escaneada ? (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_11.5rem]">
          <div className="min-w-0 overflow-x-auto overscroll-x-contain">
            <table className="w-max min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-polaria-w-08">
                  <th className="whitespace-nowrap px-3 py-2 polaria-text-caption font-bold tracking-wide text-polaria-w-20 sm:px-4">
                    PRODUCTO
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-right polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                    PEDIDA
                  </th>
                  <th className="whitespace-nowrap px-3 py-2 polaria-text-caption font-bold tracking-wide text-polaria-w-20 sm:px-4">
                    ESPECIFICACIÓN
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-center polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                    ALISTÓ
                  </th>
                  <th className="whitespace-nowrap px-2 py-2 text-center polaria-text-caption font-bold tracking-wide text-polaria-w-20">
                    REVISÓ
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineasOt.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="whitespace-nowrap px-3 py-4 polaria-text-caption text-polaria-w-50 sm:px-4"
                    >
                      Sin productos en esta OT.
                    </td>
                  </tr>
                ) : (
                  lineasOt.map((linea, lineaIndex) => {
                    const nombre = resolveOrdenVentaLineaTitulo(linea);
                    const capturaLinea = payload?.lineas?.find(
                      (row) => row.indice === lineaIndex + 1,
                    );
                    const comentario =
                      notaCapturaForLinea(notasLineas, {
                        nombre,
                        cantidad: linea.cantidad_pedida,
                        otId: hija.id || null,
                        idProducto: linea.id_producto,
                        allowUnscoped: otsCount <= 1,
                      }) || "—";
                    return (
                      <tr
                        key={linea.id_linea_orden_venta}
                        className="border-b border-polaria-w-08 last:border-b-0"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 polaria-text-body-sm text-polaria-w sm:px-4">
                          {nombre}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-right polaria-text-body-sm tabular-nums text-polaria-w">
                          {formatKgEs(linea.cantidad_pedida)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 polaria-text-caption text-polaria-w-50 sm:px-4">
                          {comentario}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-center">
                          <CypherAlistamientoCheckMark ok={capturaLinea?.alisto === true} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 text-center">
                          <CypherAlistamientoCheckMark ok={capturaLinea?.reviso === true} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <aside className="flex flex-col gap-3 border-t border-polaria-w-08 px-3 py-3 lg:border-l lg:border-t-0 sm:px-4">
            <div className="relative overflow-hidden rounded-xl border border-polaria-t-20 bg-polaria-bg">
              {captura?.urlFoto ? (
                <PolariaRemoteImage
                  src={captura.urlFoto}
                  alt="Hoja escaneada"
                  width={480}
                  height={96}
                  className="h-24 w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-24 items-center justify-center px-2 text-center polaria-text-caption text-polaria-w-50">
                  {despachoNombre || "Sin vista de firma"}
                </div>
              )}
              {captura?.urlFoto && onVerFotosOt && otKey ? (
                <button
                  type="button"
                  onClick={() => onVerFotosOt(otKey)}
                  className="absolute bottom-1.5 right-1.5 rounded-md bg-polaria-bg/90 px-2 py-0.5 polaria-text-caption font-bold text-polaria-teal"
                >
                  VER
                </button>
              ) : null}
            </div>

            <div>
              <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                FOLIO
              </p>
              <p className="mt-1 whitespace-nowrap polaria-text-body-sm font-semibold text-polaria-w">
                {folio || "—"}
              </p>
              <p className="mt-0.5 whitespace-nowrap polaria-text-caption text-polaria-w-50">
                Folio manuscrito en la OV
              </p>
            </div>

            <div>
              <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                DESPACHÓ
              </p>
              <p
                className={cn(
                  "mt-1 text-polaria-w",
                  despachoNombre
                    ? "font-serif text-lg italic leading-tight"
                    : "polaria-text-caption text-polaria-w-50",
                )}
              >
                {despachoNombre || "Sin nombre en la hoja"}
              </p>
              <p className="mt-0.5 polaria-text-caption text-polaria-w-50">
                Nombre manuscrito, digitalizado
              </p>
            </div>

            <div>
              <p className="polaria-text-caption font-bold tracking-[0.12em] text-polaria-w-20">
                ESCANEO
              </p>
              <p className="mt-1 polaria-text-caption text-polaria-w">
                {escaneoAt ? formatDateTime(escaneoAt) : "—"}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <p className="polaria-text-caption text-polaria-w-50">
            Impresa {impresaAt ? formatDateTime(impresaAt) : "—"}
          </p>
          <p className="inline-flex items-center gap-1.5 polaria-text-caption font-semibold text-polaria-danger">
            <span
              className="h-1.5 w-1.5 rounded-full bg-polaria-danger"
              aria-hidden
            />
            Sin escanear {formatElapsedSince(impresaAt, now)}
          </p>
        </div>
      )}
    </article>
  );
}