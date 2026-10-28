"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useReducer, useRef } from "react";
import { POLARIA_FORM_INPUT_CLASS } from "@/components/shared/form/PolariaFormField";
import { PolariaFormModal } from "@/components/shared/form/PolariaFormModal";
import { cn } from "@/lib/utils/cn";
import {
  ReagrupacionApiError,
  solicitarPropuestaReagrupacion,
} from "../../services/reagrupar-ot.client";
import {
  ESTADO_INICIAL_REAGRUPACION,
  instruccionExcedeLimite,
  MENSAJE_INSTRUCCION_MUY_LARGA,
  puedeGenerar,
  reducirModalReagrupacion,
} from "../../utils/ot/reagrupacion-modal-estado";
import {
  describirMovimientosPropuesta,
  PropuestaInvalidaError,
  type EstadoBaseApi,
  type PropuestaReagrupacionApi,
} from "../../utils/ot/reagrupar-ordenes-trabajo";

const MENSAJE_FORMULARIO_CAMBIO =
  "El formulario cambió mientras se generaba la propuesta. Vuelve a generarla.";

const BOTON_SECUNDARIO = cn(
  "rounded-xl border border-polaria-w-08 px-4 py-2.5",
  "polaria-text-body-sm text-polaria-w transition hover:border-polaria-t-20 hover:text-polaria-teal",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

const BOTON_PRIMARIO = cn(
  "inline-flex min-w-[7rem] items-center justify-center gap-2 rounded-xl bg-polaria-teal px-4 py-2.5",
  "polaria-text-body-sm font-semibold text-polaria-on-teal transition hover:opacity-90",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-polaria-teal focus-visible:ring-offset-2 focus-visible:ring-offset-polaria-bg",
);

export interface SolicitudReagrupacion {
  estadoBase: EstadoBaseApi;
  /** Firma del estado del formulario; si cambia, la propuesta ya no aplica. */
  firma: string;
}

export interface OrdenVentaReagruparOtModalProps {
  open: boolean;
  idOrdenVenta: string;
  /** Folio visible de la OV (p. ej. OV-00000003). */
  folio?: string;
  onClose: () => void;
  /** Lee el estado ACTUAL del formulario para armar la solicitud. */
  obtenerSolicitud: () => SolicitudReagrupacion | null;
  /** Aplica la propuesta al formulario como borrador. Lanza si no se puede. */
  onAplicar: (datos: {
    propuesta: PropuestaReagrupacionApi;
    instruccion: string;
  }) => void;
  /** Inyectables para pruebas. */
  solicitarPropuesta?: typeof solicitarPropuestaReagrupacion;
  generarRequestId?: () => string;
}

/** Frase del resumen con singular y plural correctos. */
function describirCambioDeOt(nuevas: number, vacias: number): string {
  const partes: string[] = [];
  if (nuevas > 0) {
    partes.push(
      nuevas === 1 ? "Se crea 1 OT nueva." : `Se crean ${nuevas} OT nuevas.`,
    );
  }
  if (vacias > 0) {
    partes.push(
      vacias === 1
        ? "Se une 1 OT que queda sin renglones."
        : `Se unen ${vacias} OT que quedan sin renglones.`,
    );
  }
  return partes.length > 0 ? `${partes.join(" ")} ` : "";
}

function formatearCantidad(cantidad: number | string): string {
  const numero = typeof cantidad === "number" ? cantidad : Number(cantidad);
  return Number.isFinite(numero)
    ? numero.toLocaleString("es-MX", { maximumFractionDigits: 3 })
    : String(cantidad);
}

/**
 * Modal de reagrupación de OT con IA (POL-391 / REQ-125).
 *
 * Vive junto al panel Cypher (dock-left, z-100: Cypher queda visible). Solo pide una
 * PROPUESTA; no escribe nada. Todo texto que viene del modelo o del correo se muestra
 * como texto (React lo escapa); nunca como HTML.
 */
export function OrdenVentaReagruparOtModal({
  open,
  idOrdenVenta,
  folio,
  onClose,
  obtenerSolicitud,
  onAplicar,
  solicitarPropuesta = solicitarPropuestaReagrupacion,
  generarRequestId = () => crypto.randomUUID(),
}: OrdenVentaReagruparOtModalProps) {
  const [estado, dispatch] = useReducer(
    reducirModalReagrupacion,
    ESTADO_INICIAL_REAGRUPACION,
  );
  const campoId = useId();
  const controladorRef = useRef<AbortController | null>(null);
  /** Bloqueo síncrono contra doble clic (el estado de React llega un render tarde). */
  const enCursoRef = useRef(false);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const abortar = useCallback(() => {
    controladorRef.current?.abort();
    controladorRef.current = null;
    enCursoRef.current = false;
  }, []);

  // Cambiar de OV o cerrar/desmontar: se aborta la petición y se descarta todo (R5).
  useEffect(() => {
    dispatch({ tipo: "REINICIAR" });
    return abortar;
  }, [idOrdenVenta, abortar]);

  useEffect(() => {
    if (!open) {
      abortar();
      dispatch({ tipo: "REINICIAR" });
    }
  }, [open, abortar]);

  // Escape solo cierra ESTE modal: en captura y sin dejar que llegue al formulario
  // de edición que está debajo (el modal compartido en nivel "base" no lo detiene).
  useEffect(() => {
    if (!open) return;
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      evento.stopPropagation();
      onCloseRef.current();
    };
    document.addEventListener("keydown", alPulsarTecla, true);
    return () => document.removeEventListener("keydown", alPulsarTecla, true);
  }, [open]);

  const handleGenerar = useCallback(async () => {
    if (enCursoRef.current || !puedeGenerar(estado)) return;
    enCursoRef.current = true;

    const requestId = generarRequestId();
    const solicitud = obtenerSolicitud();
    if (!solicitud) {
      dispatch({ tipo: "GENERAR", requestId, firmaBase: "" });
      dispatch({
        tipo: "FALLO",
        requestId,
        mensaje: "No hay órdenes de trabajo para reorganizar.",
      });
      enCursoRef.current = false;
      return;
    }

    const controlador = new AbortController();
    controladorRef.current = controlador;
    dispatch({ tipo: "GENERAR", requestId, firmaBase: solicitud.firma });

    try {
      const respuesta = await solicitarPropuesta({
        idOrdenVenta,
        requestId,
        instruccion: estado.instruccion.trim(),
        historial: estado.historial,
        estadoBase: solicitud.estadoBase,
        signal: controlador.signal,
      });
      dispatch({
        tipo: "RESPUESTA",
        requestId,
        respuesta,
        movimientos:
          respuesta.tipo === "propuesta"
            ? describirMovimientosPropuesta(
                respuesta.propuesta,
                solicitud.estadoBase,
              )
            : undefined,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      dispatch({
        tipo: "FALLO",
        requestId,
        mensaje:
          error instanceof ReagrupacionApiError
            ? error.message
            : "No se pudo generar la propuesta. Intenta de nuevo.",
      });
    } finally {
      if (controladorRef.current === controlador) {
        controladorRef.current = null;
        enCursoRef.current = false;
      }
    }
  }, [
    estado,
    generarRequestId,
    idOrdenVenta,
    obtenerSolicitud,
    solicitarPropuesta,
  ]);

  const handleCancelarPeticion = useCallback(() => {
    abortar();
    dispatch({ tipo: "CANCELAR" });
  }, [abortar]);

  const handleConfirmar = useCallback(() => {
    if (estado.fase !== "propuesta" || !estado.propuesta) return;

    const actual = obtenerSolicitud();
    if (!actual || actual.firma !== estado.firmaBase) {
      dispatch({ tipo: "INVALIDAR", mensaje: MENSAJE_FORMULARIO_CAMBIO });
      return;
    }

    try {
      onAplicar({
        propuesta: estado.propuesta,
        instruccion: estado.instruccion,
      });
    } catch (error) {
      dispatch({
        tipo: "INVALIDAR",
        mensaje:
          error instanceof PropuestaInvalidaError
            ? "La propuesta no respeta las órdenes de trabajo originales y fue descartada."
            : "No se pudo aplicar la propuesta. Intenta de nuevo.",
      });
    }
  }, [estado, obtenerSolicitud, onAplicar]);

  const generando = estado.fase === "generando";
  const enPropuesta = estado.fase === "propuesta" && estado.propuesta !== null;
  const textoBloqueado = generando || enPropuesta;
  const movimientos = estado.movimientos;

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel={folio ? `Orden de venta ${folio}` : "Orden de venta"}
      title="Reorganizar órdenes de trabajo"
      description="Escribe qué quieres cambiar. Puedo mover renglones entre las órdenes de trabajo o crear órdenes nuevas; no cambio cantidades ni datos del pedido."
      layout="dock-left"
      stackLevel="base"
      asForm={false}
      onSubmit={(evento) => evento.preventDefault()}
      hideFooter
      closeOnEscape={false}
      closeOnBackdrop={false}
    >
      {/* px-1: el contenedor con scroll del modal recorta el anillo de foco en el borde. */}
      <div className="flex flex-col gap-4 px-1">
        {estado.historial.length > 0 ? (
          <section aria-label="Intentos anteriores" className="flex flex-col gap-1.5">
            <p className="polaria-text-caption font-bold tracking-[0.14em] text-polaria-w-20">
              INTENTOS ANTERIORES
            </p>
            <ol className="list-decimal space-y-1 pl-5 polaria-text-body-sm text-polaria-w-50">
              {estado.historial.map((instruccion, indice) => (
                <li key={`${indice}-${instruccion}`} className="break-words">
                  {instruccion}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <div className="flex flex-col gap-2">
          <label
            htmlFor={campoId}
            className="polaria-text-body-sm font-medium text-polaria-w"
          >
            Instrucción
          </label>
          <textarea
            id={campoId}
            value={estado.instruccion}
            readOnly={textoBloqueado}
            rows={6}
            placeholder="Ejemplo: Junta las órdenes de comedor y de bares en una sola."
            onChange={(evento) =>
              dispatch({ tipo: "ESCRIBIR", texto: evento.target.value })
            }
            className={cn(
              // Mismo borde, fondo y foco que el resto de los campos de la app.
              POLARIA_FORM_INPUT_CLASS,
              "polaria-text-body-sm min-h-[9rem] resize-y",
              textoBloqueado && "opacity-70",
            )}
          />
          {instruccionExcedeLimite(estado.instruccion) ? (
            <p role="alert" className="polaria-text-caption text-polaria-danger">
              {MENSAJE_INSTRUCCION_MUY_LARGA}
            </p>
          ) : null}
        </div>

        {estado.aviso ? (
          <p
            role="status"
            className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-3 py-2 polaria-text-body-sm text-polaria-w"
          >
            {estado.aviso}
          </p>
        ) : null}

        {estado.error ? (
          <p
            role="alert"
            className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-3 py-2 polaria-text-body-sm text-polaria-danger"
          >
            {estado.error}
          </p>
        ) : null}

        {generando ? (
          <p
            role="status"
            className="inline-flex items-center gap-2 polaria-text-body-sm text-polaria-teal"
          >
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Generando propuesta…
          </p>
        ) : null}

        {enPropuesta ? (
          <section
            aria-label="Propuesta"
            className="flex flex-col gap-3 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-4 py-4"
          >
            <h3 className="polaria-text-card-title font-extrabold text-polaria-w">
              {`${estado.propuesta!.resumen.antes} OT → ${estado.propuesta!.resumen.despues} OT`}
            </h3>
            <p className="polaria-text-caption text-polaria-w-50">
              {describirCambioDeOt(
                estado.propuesta!.resumen.nuevas,
                estado.propuesta!.resumen.vacias,
              )}
              Ningún renglón se elimina; solo cambian de orden de trabajo.
            </p>
            {movimientos.length > 0 ? (
              <ul className="flex flex-col gap-1.5 polaria-text-body-sm text-polaria-w">
                {movimientos.map((movimiento, indice) => (
                  <li key={`${indice}-${movimiento.producto}`} className="break-words">
                    <span className="font-semibold">{movimiento.producto}</span>{" "}
                    <span className="tabular-nums text-polaria-teal">
                      ({formatearCantidad(movimiento.cantidad)} kg)
                    </span>
                    : {movimiento.desde} → {movimiento.hacia}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-polaria-w-08 pt-4">
          {enPropuesta ? (
            <>
              <button
                type="button"
                className={BOTON_SECUNDARIO}
                onClick={() => dispatch({ tipo: "RECHAZAR" })}
              >
                Rechazar
              </button>
              <button
                type="button"
                className={BOTON_PRIMARIO}
                onClick={handleConfirmar}
              >
                Confirmar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={BOTON_SECUNDARIO}
                onClick={generando ? handleCancelarPeticion : onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={BOTON_PRIMARIO}
                disabled={generando || !puedeGenerar(estado)}
                onClick={() => {
                  void handleGenerar();
                }}
              >
                {generando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Generar
              </button>
            </>
          )}
        </div>
      </div>
    </PolariaFormModal>
  );
}
