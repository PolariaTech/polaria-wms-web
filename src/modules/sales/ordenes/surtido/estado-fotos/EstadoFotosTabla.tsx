"use client";

import { Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatearRecibido } from "@/modules/sales/correos/utils/correos-formato";
import {
  formatearDuracion,
  partesDeOt,
  type DatosOt,
  type EstadoFoto,
} from "./estado-fotos.logic";
import type { FilaFoto } from "./estado-fotos.service";

const ETIQUETA_ESTADO: Record<EstadoFoto, string> = {
  recibida: "Recibida",
  procesando: "Procesando",
  lista: "Lista",
  fallo: "Falló",
};

/** Estado de una fila: «Colgada» manda sobre «Recibida» y «Procesando». */
function insignia(fila: FilaFoto): { texto: string; clases: string } {
  if (fila.colgada) {
    return {
      texto: "Colgada",
      clases:
        "border-polaria-warning-border bg-polaria-warning-bg text-polaria-warning",
    };
  }
  if (fila.estado === "lista") {
    return {
      texto: ETIQUETA_ESTADO.lista,
      clases: "border-polaria-t-20 bg-polaria-t-08 text-polaria-teal",
    };
  }
  if (fila.estado === "fallo") {
    return {
      texto: ETIQUETA_ESTADO.fallo,
      clases:
        "border-polaria-danger-border bg-polaria-danger-bg text-polaria-danger",
    };
  }
  return {
    texto: ETIQUETA_ESTADO[fila.estado],
    clases: "border-polaria-w-20 text-polaria-w",
  };
}

/** Lo que lee el lector de pantalla en «Ver foto» para saber de qué OT es: su posición y su centro de consumo. */
function nombreOtParaLector(fila: FilaFoto): string {
  const centro = fila.ot?.almacen || partesDeOt(fila.idOrdenTrabajo)?.almacen || "";
  return fila.ot && centro ? `OT ${fila.ot.numero} de ${fila.ot.total}, ${centro}` : centro;
}

/**
 * Mismo criterio que `TABLA_COMPACTA_PANTALLA_BAJA` de las tablas de Ventas: en pantallas bajas
 * (menos de 50 rem de alto, típico de un portátil de 14″) las celdas se ajustan para que quepan
 * más filas sin desplazar. En pantallas altas no cambia nada.
 */
const CELDA = "px-3 py-2.5 align-top [@media(max-height:50rem)]:py-1.5";

/**
 * Columna «OT»: la posición de la OT en su OV («3/9», la misma de la hoja impresa). Si la OV ya no
 * tiene esa OT no se inventa un número.
 */
function CeldaPosicionOt({ ot }: { ot: DatosOt | null }) {
  if (!ot) return <span className="text-polaria-w-50">—</span>;
  return (
    <span className="font-medium tabular-nums text-polaria-w">
      {ot.numero}/{ot.total}
      <span className="sr-only"> Orden de trabajo {ot.numero} de {ot.total}</span>
    </span>
  );
}

/**
 * Columna «Centro de consumo»: el almacén de la OT, que es lo que el operador reconoce. El número de
 * pedido solo se agrega cuando cambia de una OT a otra dentro de la OV; si es el mismo en todas,
 * repetirlo en cada fila sobra.
 */
function CeldaCentroConsumo({ clave, ot }: { clave: string; ot: DatosOt | null }) {
  const partes = partesDeOt(clave);
  if (!ot && !partes) return <span className="text-polaria-w-50">Toda la orden</span>;

  const centro = (ot ? ot.almacen : partes?.almacen) || null;
  const pedido = (ot ? ot.pedido : partes?.pedido) || null;
  const mostrarPedido = Boolean(pedido) && (!centro || (ot?.pedidoVaria ?? false));
  if (!centro && !mostrarPedido) return <span className="text-polaria-w-50">—</span>;

  return (
    <>
      {centro ? <p className="font-medium text-polaria-w">{centro}</p> : null}
      {mostrarPedido ? (
        <p className={cn("tabular-nums", centro ? "text-polaria-w-50" : "text-polaria-w")}>
          Pedido {pedido}
        </p>
      ) : null}
    </>
  );
}

export function EstadoFotosTabla({ filas }: { filas: readonly FilaFoto[] }) {
  return (
    <table className="polaria-text-body-sm w-full min-w-[54rem] border-collapse text-left">
      <caption className="sr-only">
        Intentos de captura de fotos, del más reciente al más antiguo
      </caption>
      <thead className="sticky top-0 bg-polaria-bg text-polaria-w-50">
        <tr className="border-b border-polaria-w-08">
          {/* Sin salto de línea: el título y el código de la OV (ej. OV-00000011) caben en una fila. */}
          <th scope="col" className={cn(CELDA, "whitespace-nowrap font-medium")}>Orden de venta</th>
          <th scope="col" className={cn(CELDA, "whitespace-nowrap font-medium")}>
            OT<span className="sr-only"> (orden de trabajo)</span>
          </th>
          <th scope="col" className={cn(CELDA, "font-medium")}>Centro de consumo</th>
          <th scope="col" className={cn(CELDA, "font-medium")}>Estado</th>
          <th scope="col" className={cn(CELDA, "font-medium")}>Recibida</th>
          <th scope="col" className={cn(CELDA, "text-right font-medium")}>Intento</th>
          <th scope="col" className={cn(CELDA, "text-right font-medium")}>Tiempo</th>
          <th scope="col" className={cn(CELDA, "font-medium")}>Foto</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila) => {
          const estado = insignia(fila);
          return (
            <tr
              key={fila.idIntento}
              className="border-b border-polaria-w-08 last:border-b-0"
            >
              <td className={cn(CELDA, "whitespace-nowrap font-medium text-polaria-w")}>
                {fila.codigoOv ?? "—"}
              </td>
              <td className={cn(CELDA, "whitespace-nowrap")}>
                <CeldaPosicionOt ot={fila.ot} />
              </td>
              <td className={cn(CELDA, "min-w-[17rem] max-w-[26rem]")}>
                <CeldaCentroConsumo clave={fila.idOrdenTrabajo} ot={fila.ot} />
              </td>
              <td className={cn(CELDA, "min-w-[12rem]")}>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-0.5 font-medium",
                    estado.clases,
                  )}
                >
                  {estado.texto}
                </span>
                {fila.estado === "fallo" && fila.mensajeError ? (
                  // Solo el mensaje en lenguaje claro: el código interno del error no es para el operador.
                  <p className="mt-1.5 max-w-[22rem] text-balance text-polaria-danger">{fila.mensajeError}</p>
                ) : null}
              </td>
              <td className={cn(CELDA, "whitespace-nowrap text-polaria-w-50")}>
                {formatearRecibido(fila.creadoEn)}
              </td>
              <td className={cn(CELDA, "text-right tabular-nums text-polaria-w")}>
                {fila.numeroIntento}
              </td>
              <td className={cn(CELDA, "whitespace-nowrap text-right tabular-nums text-polaria-w-50")}>
                {formatearDuracion(fila.tiempoTotalMs)}
              </td>
              <td className={CELDA}>
                {fila.urlFoto ? (
                  <a
                    href={fila.urlFoto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      // 36 px de alto (antes 32): más cómodo de pulsar sin inflar las filas de la tabla.
                      "inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-polaria-w-20 px-3 font-medium text-polaria-w transition-colors",
                      "hover:border-polaria-t-20 hover:bg-polaria-t-08 hover:text-polaria-teal",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
                      "[@media(max-height:50rem)]:min-h-8",
                    )}
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    Ver foto
                    <span className="sr-only">
                      {" "}
                      de la orden {fila.codigoOv ?? ""}
                      {nombreOtParaLector(fila) ? `, ${nombreOtParaLector(fila)}` : ""}
                      , se abre en una pestaña nueva
                    </span>
                  </a>
                ) : (
                  <span className="text-polaria-w-50">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
