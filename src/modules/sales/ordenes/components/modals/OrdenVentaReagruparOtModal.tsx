"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react";
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
import {
  ESPERA_INTERPRETAR,
  ESPERA_REORGANIZAR,
  ESPERA_RELEER,
  type PropuestaCorreccionCorreoApi,
} from "../../utils/ot/aplicar-correccion-correo";
import {
  CorreccionCorreoApiError,
  interpretarInstruccion,
  solicitarCorreccionCorreo,
  type InterpretacionInstruccionApi,
} from "../../services/correccion-correo.client";
import {
  CargaConPolo,
  OrdenVentaCorreccionCorreoPanel,
} from "./OrdenVentaCorreccionCorreoPanel";

const MENSAJE_FORMULARIO_CAMBIO =
  "El formulario cambió mientras se generaba la propuesta. Vuelve a generarla.";

/** Corrección contra el correo (REQ-187): leyendo los archivos o con la propuesta lista. */
interface EstadoCorreccion {
  fase: "leyendo" | "propuesta";
  /** Lo que el servidor entendió de la instrucción. */
  motivo: string;
  /** Firma del formulario al pedirla; si cambia, la propuesta ya no aplica. */
  firmaBase: string;
  propuesta?: PropuestaCorreccionCorreoApi;
}

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
  /**
   * REQ-187: aplica al formulario, como borrador, la corrección propuesta tras releer
   * el correo y los archivos de la OV. Si no se pasa, «Generar» solo reorganiza.
   */
  onAplicarCorreccion?: (propuesta: PropuestaCorreccionCorreoApi) => void;
  /** Inyectables para pruebas. */
  solicitarPropuesta?: typeof solicitarPropuestaReagrupacion;
  interpretar?: typeof interpretarInstruccion;
  solicitarCorreccion?: typeof solicitarCorreccionCorreo;
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
  onAplicarCorreccion,
  solicitarPropuesta = solicitarPropuestaReagrupacion,
  interpretar = interpretarInstruccion,
  solicitarCorreccion = solicitarCorreccionCorreo,
  generarRequestId = () => crypto.randomUUID(),
}: OrdenVentaReagruparOtModalProps) {
  const [estado, dispatch] = useReducer(
    reducirModalReagrupacion,
    ESTADO_INICIAL_REAGRUPACION,
  );
  /** Un solo botón «Generar»: primero se interpreta lo escrito (unos segundos). */
  const [interpretando, setInterpretando] = useState(false);
  /** Frase corta de lo que el servidor entendió; se muestra como texto. */
  const [motivoActual, setMotivoActual] = useState("");
  const [correccion, setCorreccion] = useState<EstadoCorreccion | null>(null);
  const [errorCorreccion, setErrorCorreccion] = useState<string | null>(null);
  const campoId = useId();
  const controladorRef = useRef<AbortController | null>(null);
  /** Bloqueo síncrono contra doble clic (el estado de React llega un render tarde). */
  const enCursoRef = useRef(false);
  /** Qué hace Escape: cancelar la petición si la IA está trabajando; si no, cerrar el modal. */
  const alEscapeRef = useRef<() => void>(onClose);

  const abortar = useCallback(() => {
    controladorRef.current?.abort();
    controladorRef.current = null;
    enCursoRef.current = false;
  }, []);

  const reiniciarCorreccion = useCallback(() => {
    setInterpretando(false);
    setMotivoActual("");
    setCorreccion(null);
    setErrorCorreccion(null);
  }, []);

  // Cambiar de OV o cerrar/desmontar: se aborta la petición y se descarta todo (R5).
  useEffect(() => {
    dispatch({ tipo: "REINICIAR" });
    reiniciarCorreccion();
    return abortar;
  }, [idOrdenVenta, abortar, reiniciarCorreccion]);

  useEffect(() => {
    if (!open) {
      abortar();
      dispatch({ tipo: "REINICIAR" });
      reiniciarCorreccion();
    }
  }, [open, abortar, reiniciarCorreccion]);

  // Escape solo cierra ESTE modal: en captura y sin dejar que llegue al formulario
  // de edición que está debajo (el modal compartido en nivel "base" no lo detiene).
  useEffect(() => {
    if (!open) return;
    const alPulsarTecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape") return;
      evento.stopPropagation();
      alEscapeRef.current();
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
    const instruccion = estado.instruccion.trim();
    setErrorCorreccion(null);

    // REQ-187: un solo botón. Primero se decide qué función pide lo que se escribió:
    // mover renglones que ya existen, o releer el correo y los archivos. Si no se puede
    // interpretar, «Generar» sigue como siempre (reorganizar).
    let interpretacion: InterpretacionInstruccionApi | null = null;
    if (onAplicarCorreccion) {
      setInterpretando(true);
      try {
        interpretacion = await interpretar({
          idOrdenVenta,
          requestId,
          instruccion,
          signal: controlador.signal,
        });
        setMotivoActual(interpretacion.motivo);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        interpretacion = null;
      } finally {
        setInterpretando(false);
      }
    }

    if (interpretacion?.intencion === "releer_documentos") {
      setCorreccion({
        fase: "leyendo",
        motivo: interpretacion.motivo,
        firmaBase: solicitud.firma,
      });
      try {
        const propuesta = await solicitarCorreccion({
          idOrdenVenta,
          requestId,
          instruccion,
          expectativas: interpretacion.expectativas,
          signal: controlador.signal,
        });
        setCorreccion({
          fase: "propuesta",
          motivo: interpretacion.motivo,
          firmaBase: solicitud.firma,
          propuesta,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCorreccion(null);
        setErrorCorreccion(
          error instanceof CorreccionCorreoApiError
            ? error.message
            : "No se pudo releer el correo. Intenta de nuevo.",
        );
      } finally {
        if (controladorRef.current === controlador) {
          controladorRef.current = null;
          enCursoRef.current = false;
        }
      }
      return;
    }

    dispatch({ tipo: "GENERAR", requestId, firmaBase: solicitud.firma });

    try {
      const respuesta = await solicitarPropuesta({
        idOrdenVenta,
        requestId,
        instruccion,
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
    interpretar,
    obtenerSolicitud,
    onAplicarCorreccion,
    solicitarCorreccion,
    solicitarPropuesta,
  ]);

  const handleCancelarPeticion = useCallback(() => {
    abortar();
    dispatch({ tipo: "CANCELAR" });
    reiniciarCorreccion();
  }, [abortar, reiniciarCorreccion]);

  /** Aplica la corrección propuesta si el formulario no cambió mientras se releía. */
  const handleAplicarCorreccion = useCallback(
    (propuesta: PropuestaCorreccionCorreoApi) => {
      if (!onAplicarCorreccion || correccion?.fase !== "propuesta") return;
      if (obtenerSolicitud()?.firma !== correccion.firmaBase) {
        setCorreccion(null);
        setErrorCorreccion(
          "El formulario cambió mientras se releía el correo. Vuelve a generar la corrección.",
        );
        return;
      }
      try {
        onAplicarCorreccion(propuesta);
      } catch {
        setErrorCorreccion("No se pudo aplicar la corrección. Intenta de nuevo.");
      }
    },
    [correccion, obtenerSolicitud, onAplicarCorreccion],
  );

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
  const leyendoCorreo = correccion?.fase === "leyendo";
  const cargando = generando || interpretando || leyendoCorreo;
  const enPropuesta = estado.fase === "propuesta" && estado.propuesta !== null;
  const propuestaCorreccion =
    correccion?.fase === "propuesta" && correccion.propuesta
      ? correccion
      : null;
  const textoBloqueado = cargando || enPropuesta;
  const movimientos = estado.movimientos;

  // Con la capa de carga abierta, Escape lo atiende ella (pide confirmar la cancelación):
  // el modal no debe cerrarse ni cancelar por su cuenta.
  useEffect(() => {
    alEscapeRef.current = cargando ? () => {} : onClose;
  });

  return (
    <PolariaFormModal
      open={open}
      onClose={onClose}
      sectionLabel={folio ? `Orden de venta ${folio}` : "Orden de venta"}
      title={
        propuestaCorreccion
          ? "Corregir con el correo"
          : "Reorganizar órdenes de trabajo"
      }
      description={
        propuestaCorreccion
          ? "Comparé la orden con el correo y los archivos originales. Revisa la corrección antes de aplicarla."
          : onAplicarCorreccion
            ? "Escribe qué quieres cambiar. Puedo mover renglones entre órdenes de trabajo, crear nuevas o dejar vacías las que sobren. Si la orden quedó mal leída del correo (faltan renglones u órdenes de compra, o el total no coincide), releo el correo y los archivos para corregirla."
            : "Escribe qué quieres cambiar. Puedo crear, modificar o eliminar órdenes de trabajo (mover renglones entre ellas, crear nuevas o dejar vacías las que sobren); no cambio cantidades ni datos del pedido."
      }
      layout="dock-left"
      stackLevel="base"
      scrollClassName="flex flex-col"
      asForm={false}
      onSubmit={(evento) => evento.preventDefault()}
      hideFooter
      closeOnEscape={false}
      closeOnBackdrop={false}
    >
      {propuestaCorreccion ? (
        <OrdenVentaCorreccionCorreoPanel
          propuesta={propuestaCorreccion.propuesta!}
          motivo={propuestaCorreccion.motivo}
          onAplicar={handleAplicarCorreccion}
          onDescartar={() => setCorreccion(null)}
        />
      ) : null}
      {/* px-1: el contenedor con scroll del modal recorta el anillo de foco en el borde. */}
      <div
        className={cn(
          "flex w-full flex-1 flex-col gap-5 px-1",
          propuestaCorreccion && "hidden",
        )}
      >
        {estado.historial.length > 0 ? (
          <section aria-label="Intentos anteriores" className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold tracking-wide text-polaria-w-50 lg:text-base">
              INTENTOS ANTERIORES
            </p>
            <ol className="list-decimal space-y-1.5 pl-5 text-base leading-relaxed text-polaria-w-50 lg:text-lg">
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
            className="text-base font-medium text-polaria-w lg:text-lg"
          >
            Instrucción
          </label>
          <textarea
            id={campoId}
            value={estado.instruccion}
            readOnly={textoBloqueado}
            rows={6}
            placeholder={
              onAplicarCorreccion
                ? "Ejemplos: Junta las órdenes de comedor y de bares en una sola. · Faltan renglones: el total de la factura es 27,905.25."
                : "Ejemplo: Junta las órdenes de comedor y de bares en una sola."
            }
            onChange={(evento) =>
              dispatch({ tipo: "ESCRIBIR", texto: evento.target.value })
            }
            className={cn(
              // Mismo borde, fondo y foco que el resto de los campos de la app.
              POLARIA_FORM_INPUT_CLASS,
              "min-h-[9rem] resize-y text-base leading-relaxed lg:min-h-[12rem] lg:text-[1.0625rem]",
              textoBloqueado && "opacity-70",
            )}
          />
          {instruccionExcedeLimite(estado.instruccion) ? (
            <p role="alert" className="text-sm text-polaria-danger lg:text-base">
              {MENSAJE_INSTRUCCION_MUY_LARGA}
            </p>
          ) : null}
        </div>

        {estado.aviso ? (
          <p
            role="status"
            className="rounded-lg border border-polaria-t-20 bg-polaria-t-08 px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-w lg:text-base"
          >
            {estado.aviso}
          </p>
        ) : null}

        {estado.error ? (
          <p
            role="alert"
            className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-danger lg:text-base"
          >
            {estado.error}
          </p>
        ) : null}

        {errorCorreccion ? (
          <p
            role="alert"
            className="rounded-lg border border-polaria-danger-border bg-polaria-danger-bg px-4 py-3 text-[0.9375rem] leading-relaxed text-polaria-danger lg:text-base"
          >
            {errorCorreccion}
          </p>
        ) : null}

        {cargando ? (
          interpretando ? (
            <CargaConPolo
              titulo="Entendiendo tu instrucción…"
              espera={ESPERA_INTERPRETAR}
              onCancelar={handleCancelarPeticion}
            />
          ) : leyendoCorreo ? (
            <CargaConPolo
              titulo="Releyendo el correo y los archivos…"
              detalle={motivoActual}
              espera={ESPERA_RELEER}
              onCancelar={handleCancelarPeticion}
            />
          ) : (
            <CargaConPolo
              titulo="Reorganizando las órdenes de trabajo…"
              detalle={motivoActual}
              espera={ESPERA_REORGANIZAR}
              onCancelar={handleCancelarPeticion}
            />
          )
        ) : null}

        {enPropuesta ? (
          <section
            aria-label="Propuesta"
            className="flex flex-col gap-4 rounded-xl border border-polaria-t-20 bg-polaria-t-08 px-5 py-5 lg:px-6 lg:py-6"
          >
            <h3 className="text-xl leading-tight font-semibold text-polaria-w lg:text-2xl">
              {`${estado.propuesta!.resumen.antes} OT → ${estado.propuesta!.resumen.despues} OT`}
            </h3>
            <p className="text-sm leading-relaxed text-polaria-w-50 lg:text-base">
              {describirCambioDeOt(
                estado.propuesta!.resumen.nuevas,
                estado.propuesta!.resumen.vacias,
              )}
              Ningún renglón se elimina; solo cambian de orden de trabajo.
            </p>
            {movimientos.length > 0 ? (
              <ul className="flex flex-col gap-2 text-base leading-relaxed text-polaria-w lg:text-lg">
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
              {cargando ? null : (
                <button
                  type="button"
                  className={BOTON_SECUNDARIO}
                  onClick={onClose}
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                className={BOTON_PRIMARIO}
                disabled={cargando || !puedeGenerar(estado)}
                onClick={() => {
                  void handleGenerar();
                }}
              >
                {cargando ? (
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
