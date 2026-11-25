"use client";

import { cn } from "@/lib/utils/cn";
import {
  documentosSinVerificar,
  etiquetaRenglones,
  etiquetaVerificacion,
  formatearImporte,
  mensajeEstadoCorreccion,
  nombreDeArchivo,
  puedeAplicarCorreccion,
  type PropuestaCorreccionCorreoApi,
} from "../../utils/ot/aplicar-correccion-correo";
import { PoloWorking } from "./PoloWorking";

export { PoloWorking };
export { CargaConPolo } from "./CargaConPolo";

const BOTON_SECUNDARIO = cn(
  "min-h-11 rounded-xl border border-polaria-w-08 px-5 py-2.5",
  "text-sm font-medium text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

const BOTON_PRIMARIO = cn(
  "inline-flex min-h-11 min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-5 py-2.5",
  "text-sm font-semibold text-polaria-on-teal transition hover:opacity-90 lg:text-base",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

export interface OrdenVentaCorreccionCorreoPanelProps {
  propuesta: PropuestaCorreccionCorreoApi;
  /** Lo que el servidor entendió de la instrucción; se muestra como texto. */
  motivo?: string;
  /** Aplica la propuesta al formulario como borrador. Lanza si no se puede. */
  onAplicar: (propuesta: PropuestaCorreccionCorreoApi) => void;
  /** Descarta la propuesta y vuelve a la instrucción. */
  onDescartar: () => void;
}

/**
 * Propuesta de «corregir con el correo» (REQ-187 / REQ-372): relectura vs
 * «Total pedido». Aplicar deja borrador; no escribe en BD.
 */
export function OrdenVentaCorreccionCorreoPanel({
  propuesta,
  motivo,
  onAplicar,
  onDescartar,
}: OrdenVentaCorreccionCorreoPanelProps) {
  const sinVerificar = documentosSinVerificar(propuesta);
  const puedeAplicar = puedeAplicarCorreccion(propuesta);
  const estadoAplicar = mensajeEstadoCorreccion(propuesta);

  return (
    <div className="flex w-full flex-1 flex-col gap-5 px-1">
      <section
        aria-label="Corrección propuesta"
        className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
      >
        <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
          {`${propuesta.resumen.otAntes} OT → ${propuesta.resumen.otDespues} OT`}
        </h3>
        {motivo ? (
          <p className="break-words text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            {motivo}
          </p>
        ) : null}
        <p className="text-base font-medium tabular-nums text-polaria-w lg:text-lg">
          {`${propuesta.resumen.renglonesAntes} → ${propuesta.resumen.renglonesDespues} productos · ${formatearImporte(propuesta.resumen.importeAntes)} → ${formatearImporte(propuesta.resumen.importeDespues)}`}
        </p>
        <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
          {`${propuesta.diff.otNuevas.length} OT nuevas, ${etiquetaRenglones(propuesta.diff.renglonesAgregados)} agregados.`}
          {propuesta.diff.renglonesQuitados > 0
            ? ` ${etiquetaRenglones(propuesta.diff.renglonesQuitados)} que no ${propuesta.diff.renglonesQuitados === 1 ? "está" : "están"} en los documentos se ${propuesta.diff.renglonesQuitados === 1 ? "quita" : "quitan"}.`
            : ""}
        </p>

        <ul aria-label="Documentos leídos" className="flex flex-col gap-2">
          {propuesta.documentos.map((documento) => (
            <li
              key={documento.nombre}
              className="break-words text-base leading-relaxed text-polaria-w lg:text-lg"
            >
              <span className="font-semibold">{documento.nombre}</span>
              {documento.oc ? (
                <span className="text-polaria-w-50">{` · OC ${documento.oc}`}</span>
              ) : null}
              <span className="text-polaria-w-50">
                {` · ${etiquetaRenglones(documento.renglones)}`}
              </span>
              <br />
              <span
                className={cn(
                  "text-sm leading-relaxed lg:text-base",
                  documento.verificacion.cuadra === false
                    ? "text-polaria-danger"
                    : "text-polaria-w-50",
                )}
              >
                {etiquetaVerificacion(documento)}
              </span>
            </li>
          ))}
        </ul>

        {propuesta.advertencias.length > 0 ? (
          <ul
            aria-label="Avisos"
            className="flex flex-col gap-1.5 text-sm leading-relaxed text-polaria-w-50 lg:text-base"
          >
            {propuesta.advertencias.map((aviso, indice) => (
              <li key={`${indice}-${aviso.codigo}`} className="break-words">
                {aviso.documento ? (
                  <span className="font-medium text-polaria-w">
                    {`${nombreDeArchivo(aviso.documento)}: `}
                  </span>
                ) : null}
                {aviso.detalle}
              </li>
            ))}
          </ul>
        ) : null}

        {sinVerificar.length > 0 ? (
          <p role="status" className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            Revisa a mano los documentos sin total: la lectura no se pudo comprobar.
          </p>
        ) : null}

        {estadoAplicar ? (
          <p
            role="status"
            className={cn(
              "text-base font-medium lg:text-lg",
              estadoAplicar.tono === "aviso"
                ? "text-polaria-warning"
                : "text-polaria-w",
            )}
          >
            {estadoAplicar.texto}
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
            Al aplicar, las órdenes de trabajo y las líneas del formulario se
            reemplazan por las de los documentos. Los productos que no se
            reconozcan quedan marcados para que los elijas.
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08 pt-4">
        <button type="button" className={BOTON_SECUNDARIO} onClick={onDescartar}>
          Descartar
        </button>
        <button
          type="button"
          className={BOTON_PRIMARIO}
          disabled={!puedeAplicar}
          onClick={() => onAplicar(propuesta)}
        >
          Aplicar al borrador
        </button>
      </div>
    </div>
  );
}
