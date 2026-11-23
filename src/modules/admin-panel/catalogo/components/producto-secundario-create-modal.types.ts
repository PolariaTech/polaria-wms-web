import {
  CATALOGO_ESTADO_DEFAULT,
  CATALOGO_TIPO_SECUNDARIO,
  CATALOGO_UNIDAD_MEDIDA_DEFAULT,
  CATALOGO_UNIDAD_VISUALIZACION_DEFAULT,
  createEmptyCatalogoMetadatos,
  type CatalogoProductoMetadatos,
} from "../constants/catalogo-producto";
import { CATALOGO_BASE_PRIMARIO_LABEL } from "../constants/catalogo-conversion";

export type ProductoSecundarioForm = CatalogoProductoMetadatos & {
  titulo: string;
  unidadVisualizacion: string;
  unidadMedida: string;
  idProductoPrimario: string;
};

export function createSecundarioInitialForm(): ProductoSecundarioForm {
  return {
    titulo: "",
    unidadVisualizacion: CATALOGO_UNIDAD_VISUALIZACION_DEFAULT,
    unidadMedida: CATALOGO_UNIDAD_MEDIDA_DEFAULT,
    idProductoPrimario: "",
    ...createEmptyCatalogoMetadatos(),
    tipo: CATALOGO_TIPO_SECUNDARIO,
    basePrimario: CATALOGO_BASE_PRIMARIO_LABEL,
    gramosPorUnidad: "200",
    mermaPct: "0",
    estado: CATALOGO_ESTADO_DEFAULT,
  };
}
