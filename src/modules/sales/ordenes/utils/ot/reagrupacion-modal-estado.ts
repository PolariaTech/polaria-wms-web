import type { CypherCompanionOtPicker } from "../../components/modals/OrdenVentaCypherDrawer";
import type { RespuestaReagrupacion } from "../../services/reagrupar-ot.client";
import {
  puedeReagruparOt,
  type MovimientoVista,
  type PropuestaReagrupacionApi,
} from "./reagrupar-ordenes-trabajo";

/**
 * Máquina de estados del modal de reagrupación de OT (POL-391 / REQ-125).
 *
 * Pura y sin React para poder probarla sin navegador. Reglas clave:
 * - Doble envío: `GENERAR` se ignora mientras hay una petición en curso (R4).
 * - Respuesta tardía: `RESPUESTA` y `FALLO` solo valen si traen el `requestId` de la
 *   petición vigente; si el usuario canceló o pidió otra, se descartan (R5).
 * - Refinamiento: `RECHAZAR` guarda la instrucción en el historial y vuelve a
 *   escribir; el servidor parte siempre del estado original.
 */

export type FaseReagrupacion = "escribiendo" | "generando" | "propuesta" | "error";

export interface EstadoModalReagrupacion {
  fase: FaseReagrupacion;
  instruccion: string;
  /** Instrucciones previas rechazadas, en orden. */
  historial: string[];
  /** Petición en curso; null si no hay. */
  requestId: string | null;
  /** Firma del estado del formulario cuando se pidió la propuesta. */
  firmaBase: string | null;
  propuesta: PropuestaReagrupacionApi | null;
  /** Movimientos de la propuesta con nombres legibles (para la vista previa). */
  movimientos: MovimientoVista[];
  /** Aclaración o rechazo del modelo (texto fijo del servidor o del cliente). */
  aviso: string | null;
  error: string | null;
}

export type AccionModalReagrupacion =
  | { tipo: "ESCRIBIR"; texto: string }
  | { tipo: "GENERAR"; requestId: string; firmaBase: string }
  | {
      tipo: "RESPUESTA";
      requestId: string;
      respuesta: RespuestaReagrupacion;
      /** Solo cuando la respuesta es una propuesta. */
      movimientos?: MovimientoVista[];
    }
  | { tipo: "FALLO"; requestId: string; mensaje: string }
  | { tipo: "CANCELAR" }
  | { tipo: "RECHAZAR" }
  /** La propuesta ya no aplica (p. ej. el formulario cambió mientras se generaba). */
  | { tipo: "INVALIDAR"; mensaje: string }
  | { tipo: "REINICIAR" };

export const MENSAJE_FUERA_DE_ALCANCE =
  "Solo puedo crear, modificar o eliminar órdenes de trabajo. No puedo cambiar cantidades ni datos del pedido.";

export const ESTADO_INICIAL_REAGRUPACION: EstadoModalReagrupacion = {
  fase: "escribiendo",
  instruccion: "",
  historial: [],
  requestId: null,
  firmaBase: null,
  propuesta: null,
  movimientos: [],
  aviso: null,
  error: null,
};

/** Techo provisional del API (maxInstruccion); se ajusta tras más pruebas reales. */
export const LIMITE_INSTRUCCION_REAGRUPACION = 4000;

export const MENSAJE_INSTRUCCION_MUY_LARGA = `La instrucción supera los ${LIMITE_INSTRUCCION_REAGRUPACION} caracteres. Acórtala para poder generar la propuesta.`;

export function instruccionExcedeLimite(instruccion: string): boolean {
  return instruccion.trim().length > LIMITE_INSTRUCCION_REAGRUPACION;
}

export function puedeGenerar(estado: EstadoModalReagrupacion): boolean {
  const longitud = estado.instruccion.trim().length;
  return (
    (estado.fase === "escribiendo" || estado.fase === "error") &&
    longitud > 0 &&
    longitud <= LIMITE_INSTRUCCION_REAGRUPACION
  );
}

export function reducirModalReagrupacion(
  estado: EstadoModalReagrupacion,
  accion: AccionModalReagrupacion,
): EstadoModalReagrupacion {
  switch (accion.tipo) {
    case "ESCRIBIR": {
      if (estado.fase === "generando" || estado.fase === "propuesta") {
        return estado;
      }
      return {
        ...estado,
        fase: "escribiendo",
        instruccion: accion.texto,
        error: null,
      };
    }

    case "GENERAR": {
      if (!puedeGenerar(estado)) return estado;
      return {
        ...estado,
        fase: "generando",
        requestId: accion.requestId,
        firmaBase: accion.firmaBase,
        propuesta: null,
        movimientos: [],
        aviso: null,
        error: null,
      };
    }

    case "RESPUESTA": {
      if (estado.fase !== "generando" || accion.requestId !== estado.requestId) {
        return estado;
      }
      const { respuesta } = accion;
      if (respuesta.tipo === "propuesta") {
        return {
          ...estado,
          fase: "propuesta",
          requestId: null,
          propuesta: respuesta.propuesta,
          movimientos: accion.movimientos ?? [],
        };
      }
      return {
        ...estado,
        fase: "escribiendo",
        requestId: null,
        aviso:
          respuesta.tipo === "aclaracion"
            ? respuesta.mensaje
            : MENSAJE_FUERA_DE_ALCANCE,
      };
    }

    case "FALLO": {
      if (estado.fase !== "generando" || accion.requestId !== estado.requestId) {
        return estado;
      }
      return {
        ...estado,
        fase: "error",
        requestId: null,
        error: accion.mensaje,
      };
    }

    case "CANCELAR": {
      if (estado.fase !== "generando") return estado;
      return { ...estado, fase: "escribiendo", requestId: null };
    }

    case "RECHAZAR": {
      if (estado.fase !== "propuesta") return estado;
      return {
        ...estado,
        fase: "escribiendo",
        historial: [...estado.historial, estado.instruccion.trim()],
        instruccion: "",
        propuesta: null,
        movimientos: [],
        firmaBase: null,
        aviso: null,
        error: null,
      };
    }

    case "INVALIDAR": {
      if (estado.fase !== "propuesta") return estado;
      return {
        ...estado,
        fase: "error",
        propuesta: null,
        movimientos: [],
        firmaBase: null,
        error: accion.mensaje,
      };
    }

    case "REINICIAR":
      return ESTADO_INICIAL_REAGRUPACION;
  }
}

/**
 * El chat de reorganizar solo vive mientras el Cypher esté abierto: al cerrar el panel
 * que tiene el botón, el chat se cierra con él.
 */
export function reagruparModalAbierto(estado: {
  reagruparOpen: boolean;
  cypherOpen: boolean;
  isEditing: boolean;
  tieneOrdenVenta: boolean;
}): boolean {
  return (
    estado.reagruparOpen &&
    estado.cypherOpen &&
    estado.isEditing &&
    estado.tieneOrdenVenta
  );
}

/**
 * REQ-188: «Modificar con IA» desde el «+» de Acciones. Solo con el Cypher abierto solo
 * (sin formulario ni detalle: ahí el botón lo publica el propio formulario) y la OV por
 * confirmar.
 */
export function puedeModificarConIaDesdeLista(estado: {
  inspect: boolean;
  cypherId: string | null;
  formularioAbierto: boolean;
  detalleAbierto: boolean;
  estadoOrdenVenta: string | null | undefined;
}): boolean {
  return (
    !estado.inspect &&
    Boolean(estado.cypherId) &&
    !estado.formularioAbierto &&
    !estado.detalleAbierto &&
    (estado.estadoOrdenVenta ?? "").trim().toLowerCase() === "por_confirmar"
  );
}

/**
 * REQ-188: selector de OT del Cypher cuando está solo (sin formulario). Lleva el botón
 * «Modificar con IA» si la página lo entrega; sin OT no hay selector.
 */
export function armarPickerOtRespaldo(datos: {
  hijas: ReadonlyArray<{
    id: string;
    label: string;
    renglones: readonly unknown[];
    totalCantidad: number;
    almacen: string;
  }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReagrupar?: () => void;
}): CypherCompanionOtPicker | null {
  if (datos.hijas.length === 0) return null;
  return {
    hijas: datos.hijas.map((hija) => ({
      id: hija.id,
      label: hija.label,
      productosCount: hija.renglones.length,
      totalCantidad: hija.totalCantidad,
      almacen: hija.almacen,
    })),
    selectedId: datos.selectedId ?? datos.hijas[0]?.id ?? null,
    onSelect: datos.onSelect,
    onReagrupar: datos.onReagrupar,
  };
}

/**
 * REQ-188: qué hacer con la apertura pedida desde el «+» de Acciones cuando el
 * formulario de edición ya está abierto.
 * - `esperar`: aún no cargan el estado de la OV o sus OT.
 * - `abrir`: abrir el chat y dar la petición por atendida.
 * - `descartar`: la OV ya no admite el cambio; dar la petición por atendida sin abrir.
 */
export function decidirAperturaReagruparAlCargar(estado: {
  pedida: boolean;
  formularioAbierto: boolean;
  editando: boolean;
  estadoOrdenVenta: string | null | undefined;
  cantidadOt: number;
}): "ninguna" | "esperar" | "abrir" | "descartar" {
  if (!estado.pedida || !estado.formularioAbierto || !estado.editando) {
    return "ninguna";
  }
  if (!estado.estadoOrdenVenta || estado.cantidadOt === 0) return "esperar";
  return puedeReagruparOt(estado.estadoOrdenVenta, estado.cantidadOt)
    ? "abrir"
    : "descartar";
}
