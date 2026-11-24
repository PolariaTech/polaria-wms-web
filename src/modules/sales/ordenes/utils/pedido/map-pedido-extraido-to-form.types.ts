import type { FuenteAsignacion } from "../../../shared/types/sales.types";

export interface SugerenciaProductoCatalogo {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
}

export interface LineaVentaFromIa {
  idProducto: string;
  nombre: string;
  codigo: string;
  idBodega: string;
  cantidadInput: string;
  cajasInput: string;
  presentacion: string;
  especificacion: string;
  ivaPct: string;
  kgDisponible: number;
  unidadMedida: string;
  precioUnitario: number;
  /** true si el precio vino del documento (no del catálogo). */
  precioManual?: boolean;
  aliasCliente: string;
  filledByIa: boolean;
  /** Clave de orden de trabajo (pedido|almacén) para paginar el formulario. */
  otId: string;
  packHint?: string;
  autoPackFields?: Array<"cajasInput" | "presentacion" | "cantidadInput">;
  /**
   * Sin match confiable de catálogo: hay que aceptar sugerencia, elegir otro o borrar.
   */
  catalogPending?: boolean;
  /** Varios productos del catálogo se parecen: el usuario debe elegir. */
  catalogAmbiguo?: boolean;
  /** Producto más cercano del catálogo (sugerencia primaria de Mateo). */
  sugerencia?: SugerenciaProductoCatalogo | null;
  /** Otras coincidencias cercanas cuando hay ambigüedad o empate. */
  sugerenciasAlternativas?: SugerenciaProductoCatalogo[];
  propuestaSistema?: {
    producto: { idProducto: string; nombre: string; codigo: string } | null;
    fuente: FuenteAsignacion | null;
  };
}

export interface CampoDiscrepancia {
  campo: string;
  /** Clave del campo del formulario para poder aplicar el reemplazo. */
  fieldKey: string;
  db: string;
  ia: string;
}

export interface PedidoIaFormPatch {
  fechaEntrega: string;
  centroConsumo: string;
  observaciones: string;
  ordenCompraHotel: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  ventanaDesde: string;
  ventanaHasta: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  autoFields: Set<string>;
  warnFields: Set<string>;
  missingFields: Set<string>;
  discrepancias: CampoDiscrepancia[];
  lineas: LineaVentaFromIa[];
  advertencia: string | null;
  archivosNoLegibles: string[];
}

export interface PedidoIaFichaCabecera {
  centroConsumo: string;
  ventanaDesde: string;
  ventanaHasta: string;
  direccion: string;
  anden: string;
  contacto: string;
  telefono: string;
  correo: string;
  aceptaSustituciones: string;
  requiereLote: string;
  registrarTemperatura: string;
  observaciones: string;
}