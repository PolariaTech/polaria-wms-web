export type {
  EstadoBaseApi,
  IndiceReagrupacion,
  LineaReagrupable,
  MovimientoAplicado,
  MovimientoReagrupacion,
  MovimientoVista,
  MotivoPropuestaInvalida,
  OtEstadoBaseApi,
  OtPropuestaApi,
  PropuestaReagrupacionApi,
  RenglonEstadoBaseApi,
  RenglonIndexado,
  ResumenReagrupacion,
  ResultadoReagrupacion,
} from "./reagrupar-ordenes-trabajo.types";

export { construirEstadoBaseApi } from "./construir-estado-base-reagrupacion";

export {
  PropuestaInvalidaError,
  validarPropuestaContraBase,
} from "./validar-propuesta-reagrupacion";

export { aplicarReagrupacion } from "./aplicar-reagrupacion-ordenes";

export {
  crearSnapshotReagrupacion,
  describirMovimientosPropuesta,
  describirReagrupacionParaBitacora,
  firmaEstadoReagrupacion,
  puedeReagruparOt,
} from "./reagrupar-ordenes-trabajo.utilidades";