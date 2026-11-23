export type {
  OrdenVentaLineaSurtidoPatch,
  OrdenVentaSurtidoFlatPatch,
} from "./sync-surtido-parsers";
export {
  parseCantidadPreparadaKg,
  parseFechaManuscritaToIso,
} from "./sync-surtido-parsers";
export { buildOrdenVentaPatchFromSurtido } from "./sync-surtido-build-patch";