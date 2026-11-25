import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  MENSAJE_FORMULARIO_CAMBIO,
  type EstadoCorreccion,
} from "../components/modals/reagrupacion-modal-ui";
import type { OrdenVentaReagruparOtModalProps } from "../components/modals/reagrupar-ot-modal.types";
import { interpretarInstruccion, solicitarCorreccionCorreo } from "../services/correccion-correo.client";
import {
  ReagrupacionApiError,
  solicitarPropuestaReagrupacion,
} from "../services/reagrupar-ot.client";
import type { PropuestaCorreccionCorreoApi } from "../utils/ot/aplicar-correccion-correo";
import type { GrupoInstruccion } from "../utils/ot/instrucciones-frecuentes-reagrupacion";
import {
  ESTADO_INICIAL_REAGRUPACION,
  reducirModalReagrupacion,
} from "../utils/ot/reagrupacion-modal-estado";
import { PropuestaInvalidaError } from "../utils/ot/reagrupar-ordenes-trabajo";
import { useReagruparOtGenerar } from "./use-reagrupar-ot-generar";

/** Estado, efectos y handlers del modal de reagrupación de OT (POL-391 / REQ-125). */
export function useReagruparOtModal({
  open,
  idOrdenVenta,
  onClose,
  obtenerSolicitud,
  onAplicar,
  onAplicarCorreccion,
  onDividir,
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
  const [dividiendo, setDividiendo] = useState(false);
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

  const handleGenerar = useReagruparOtGenerar({
    estado,
    dispatch,
    idOrdenVenta,
    obtenerSolicitud,
    onAplicarCorreccion,
    solicitarPropuesta,
    interpretar,
    solicitarCorreccion,
    generarRequestId,
    controladorRef,
    enCursoRef,
    setInterpretando,
    setMotivoActual,
    setCorreccion,
    setErrorCorreccion,
  });

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

  const handleConfirmar = useCallback(async () => {
    if (estado.fase !== "propuesta" || (!estado.propuesta && !estado.division)) {
      return;
    }

    const actual = obtenerSolicitud();
    if (!actual || actual.firma !== estado.firmaBase) {
      dispatch({ tipo: "INVALIDAR", mensaje: MENSAJE_FORMULARIO_CAMBIO });
      return;
    }

    if (estado.division) {
      if (!onDividir || dividiendo) return;
      setDividiendo(true);
      try {
        await onDividir(estado.division);
      } catch (error) {
        dispatch({
          tipo: "INVALIDAR",
          mensaje:
            error instanceof ReagrupacionApiError
              ? error.message
              : "No se pudo dividir la orden. Intenta de nuevo.",
        });
      } finally {
        setDividiendo(false);
      }
      return;
    }
    if (!estado.propuesta) return;

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
  }, [dividiendo, estado, obtenerSolicitud, onAplicar, onDividir]);

  const generando = estado.fase === "generando";
  const leyendoCorreo = correccion?.fase === "leyendo";
  const cargando = generando || interpretando || leyendoCorreo;
  const enDivision = estado.fase === "propuesta" && estado.division !== null;
  const enPropuesta =
    enDivision || (estado.fase === "propuesta" && estado.propuesta !== null);
  const propuestaCorreccion =
    correccion?.fase === "propuesta" && correccion.propuesta ? correccion : null;
  const gruposInstruccion: GrupoInstruccion[] = [
    "reorganizar",
    ...(onDividir ? (["dividir"] as const) : []),
    ...(onAplicarCorreccion ? (["corregir"] as const) : []),
  ];

  // Con la capa de carga abierta, Escape lo atiende ella (pide confirmar la cancelación):
  // el modal no debe cerrarse ni cancelar por su cuenta.
  useEffect(() => {
    alEscapeRef.current = cargando ? () => {} : onClose;
  });

  return {
    estado,
    dispatch,
    campoId,
    interpretando,
    dividiendo,
    motivoActual,
    errorCorreccion,
    leyendoCorreo,
    cargando,
    enDivision,
    enPropuesta,
    propuestaCorreccion,
    textoBloqueado: cargando || enPropuesta,
    gruposInstruccion,
    descartarCorreccion: () => setCorreccion(null),
    handleGenerar,
    handleCancelarPeticion,
    handleAplicarCorreccion,
    handleConfirmar,
  };
}
