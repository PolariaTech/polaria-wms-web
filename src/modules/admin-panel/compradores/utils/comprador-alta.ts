export type {
  CompradorAltaCentro,
  CompradorAltaContacto,
  CompradorAltaFicha,
  CompradorAltaCentroRow,
  CompradorAltaContactoRow,
  CompradorAltaFormFicha,
  CompradorAltaFormState,
} from "./comprador-alta.types";
export {
  emptyCompradorAltaFicha,
  parseCompradorAltaFicha,
  displayAltaValue,
} from "./comprador-alta.parse";
export {
  emptyAltaCentroRow,
  emptyAltaContactoRow,
  emptyAltaFormState,
  altaFormStateFromDetalle,
  fichaFromAltaForm,
} from "./comprador-alta.form";
