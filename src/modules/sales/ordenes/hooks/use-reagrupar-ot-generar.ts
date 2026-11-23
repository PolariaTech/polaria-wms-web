import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type { EstadoCorreccion } from "../components/modals/reagrupacion-modal-ui";
import type {
  OrdenVentaReagruparOtModalProps,
  SolicitudReagrupacion,
} from "../components/modals/reagrupar-ot-modal.types";
import {
  CorreccionCorreoApiError,
  type InterpretacionInstruccionApi,
} from "../services/correccion-correo.client";
import { ReagrupacionApiError } from "../services/reagrupar-ot.client";
import {
  puedeGenerar,
  type AccionModalReagrupacion,
  type EstadoModalReagrupacion,
} from "../utils/ot/reagrupacion-modal-estado";
import { describirMovimientosPropuesta } from "../utils/ot/reagrupar-ordenes-trabajo";

export interface UseReagruparOtGenerarArgs
  extends Pick<
    OrdenVentaReagruparOtModalProps,
    "idOrdenVenta" | "obtenerSolicitud" | "onAplicarCorreccion"
  > {
  estado: EstadoModalReagrupacion;
  dispatch: Dispatch<AccionModalReagrupacion>;
  solicitarPropuesta: NonNullable<OrdenVentaReagruparOtModalProps["solicitarPropuesta"]>;
  interpretar: NonNullable<OrdenVentaReagruparOtModalProps["interpretar"]>;
  solicitarCorreccion: NonNullable<OrdenVentaReagruparOtModalProps["solicitarCorreccion"]>;
  generarRequestId: () => string;
  controladorRef: MutableRefObject<AbortController | null>;
  enCursoRef: MutableRefObject<boolean>;
  setInterpretando: Dispatch<SetStateAction<boolean>>;
  setMotivoActual: Dispatch<SetStateAction<string>>;
  setCorreccion: Dispatch<SetStateAction<EstadoCorreccion | null>>;
  setErrorCorreccion: Dispatch<SetStateAction<string | null>>;
}

const esAbort = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

/** «Generar» del modal de reagrupación: interpreta, relee el correo o reorganiza. */
export function useReagruparOtGenerar(args: UseReagruparOtGenerarArgs) {
  const {
    estado,
    dispatch,
    generarRequestId,
    idOrdenVenta,
    interpretar,
    obtenerSolicitud,
    onAplicarCorreccion,
    solicitarCorreccion,
    solicitarPropuesta,
    controladorRef,
    enCursoRef,
    setInterpretando,
    setMotivoActual,
    setCorreccion,
    setErrorCorreccion,
  } = args;

  return useCallback(async () => {
    if (enCursoRef.current || !puedeGenerar(estado)) return;
    enCursoRef.current = true;

    const requestId = generarRequestId();
    const solicitud: SolicitudReagrupacion | null = obtenerSolicitud();
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
    const liberar = () => {
      if (controladorRef.current === controlador) {
        controladorRef.current = null;
        enCursoRef.current = false;
      }
    };

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
        if (esAbort(error)) return;
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
        if (esAbort(error)) return;
        setCorreccion(null);
        setErrorCorreccion(
          error instanceof CorreccionCorreoApiError
            ? error.message
            : "No se pudo releer el correo. Intenta de nuevo.",
        );
      } finally {
        liberar();
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
      if (esAbort(error)) return;
      dispatch({
        tipo: "FALLO",
        requestId,
        mensaje:
          error instanceof ReagrupacionApiError
            ? error.message
            : "No se pudo generar la propuesta. Intenta de nuevo.",
      });
    } finally {
      liberar();
    }
  }, [
    controladorRef,
    dispatch,
    enCursoRef,
    estado,
    generarRequestId,
    idOrdenVenta,
    interpretar,
    obtenerSolicitud,
    onAplicarCorreccion,
    setCorreccion,
    setErrorCorreccion,
    setInterpretando,
    setMotivoActual,
    solicitarCorreccion,
    solicitarPropuesta,
  ]);
}
