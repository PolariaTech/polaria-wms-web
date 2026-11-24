import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../origen/origen-correo-ordenes-trabajo";

export interface LineaReagrupable {
  nombre: string;
  codigo: string;
  cantidadInput: string;
  otId?: string;
}

export interface RenglonEstadoBaseApi {
  renglonId: string;
  producto: string;
  cantidad: number | string;
  unidad?: string;
}

export interface OtEstadoBaseApi {
  otId: string;
  etiqueta: string;
  almacen: string;
  numeroPedido: string;
  renglones: RenglonEstadoBaseApi[];
}

export interface EstadoBaseApi {
  ots: OtEstadoBaseApi[];
}

export interface OtPropuestaApi {
  otId: string | null;
  nuevaClave: string | null;
  etiquetaSugerida: string | null;
  renglonIds: string[];
}

export interface ResumenReagrupacion {
  antes: number;
  despues: number;
  nuevas: number;
  vacias: number;
}

export interface MovimientoReagrupacion {
  renglonId: string;
  deOtId: string;
  aOtId: string;
}

export interface PropuestaReagrupacionApi {
  propuestaId: string;
  baseHash: string;
  ots: OtPropuestaApi[];
  resumen: ResumenReagrupacion;
  movimientos: MovimientoReagrupacion[];
}

export interface RenglonIndexado {
  renglonId: string;
  otIdOrigen: string;
  renglon: OrigenCorreoRenglon;
  lineaIndex: number | null;
}

export interface IndiceReagrupacion {
  porRenglonId: Map<string, RenglonIndexado>;
  orden: string[];
}

export type MotivoPropuestaInvalida =
  | "RENGLONES_NO_COINCIDEN"
  | "OT_INEXISTENTE"
  | "OT_DUPLICADA"
  | "TOTALES_NO_COINCIDEN";

export interface MovimientoAplicado {
  producto: string;
  cantidad: number;
  desde: string;
  hacia: string;
}

export interface ResultadoReagrupacion<TLinea extends LineaReagrupable> {
  hijas: OrdenTrabajoHija[];
  lineas: TLinea[];
  movimientos: MovimientoAplicado[];
  otNuevas: Array<{ id: string; label: string }>;
}

export interface MovimientoVista {
  producto: string;
  cantidad: number | string;
  desde: string;
  hacia: string;
}