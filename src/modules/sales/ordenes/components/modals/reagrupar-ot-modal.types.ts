import type {
  DivisionReagrupacionApi,
  solicitarPropuestaReagrupacion,
} from "../../services/reagrupar-ot.client";
import type {
  EstadoBaseApi,
  PropuestaReagrupacionApi,
} from "../../utils/ot/reagrupar-ordenes-trabajo";
import type { PropuestaCorreccionCorreoApi } from "../../utils/ot/aplicar-correccion-correo";
import type {
  interpretarInstruccion,
  solicitarCorreccionCorreo,
} from "../../services/correccion-correo.client";

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
  /**
   * REQ-262: crea las órdenes de venta nuevas y quita del formulario lo que se fue.
   * Rechaza con un error si no se pudo dividir. Sin esta función, dividir no se ofrece.
   */
  onDividir?: (division: DivisionReagrupacionApi) => Promise<void>;
  /** Inyectables para pruebas. */
  solicitarPropuesta?: typeof solicitarPropuestaReagrupacion;
  interpretar?: typeof interpretarInstruccion;
  solicitarCorreccion?: typeof solicitarCorreccionCorreo;
  generarRequestId?: () => string;
}
