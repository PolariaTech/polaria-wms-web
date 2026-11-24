import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_PRIMARIO,
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";

export type ProductoCatalogoEditForm = CatalogoProductoMetadatos & {
  titulo: string;
  sku: string;
  unidadVisualizacion: string;
  unidadMedida: string;
};

export function createEditInitialForm(): ProductoCatalogoEditForm {
  return {
    titulo: "",
    sku: "",
    unidadVisualizacion: "cantidad",
    unidadMedida: CATALOGO_UNIDAD_MEDIDA_DEFAULT,
    ...createEmptyCatalogoMetadatos(),
    tipo: CATALOGO_TIPO_PRIMARIO,
    estado: CATALOGO_ESTADO_DEFAULT,
  };
}
