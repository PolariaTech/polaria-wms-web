export type {
  CompradorListRow,
  CompradorDetalleRow,
  ListCompradoresParams,
} from "./compradores.service.types";
export type { GetCompradorParams } from "./compradores.service.queries";
export type { DeactivateCompradorParams } from "./compradores.service.patch";
export type { CreateCompradorInput } from "./compradores.service.create";
export type { UpdateCompradorInput } from "./compradores.service.patch";
export {
  listCompradoresAdmin,
  getCompradorAdmin,
} from "./compradores.service.queries";
export { createCompradorAdmin } from "./compradores.service.create";
export {
  updateCompradorAdmin,
  deactivateCompradorAdmin,
  activateCompradorAdmin,
} from "./compradores.service.patch";
