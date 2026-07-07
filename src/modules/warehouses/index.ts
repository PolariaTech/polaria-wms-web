export type {
  EstadoBodegaLayoutView,
  EstadoBodegaSectionView,
  EstadoBodegaSlot,
  UbicacionEstadoBodegaDbRow,
} from "./estado-bodega/types/estado-bodega.types";

export {
  ESTADO_BODEGA_SECTIONS,
  getEstadoBodegaSectionConfig,
  type EstadoBodegaSectionId,
  type EstadoBodegaSlotVisual,
} from "./estado-bodega/constants/estado-bodega-layout";

export {
  getEstadoBodegaLayout,
  listUbicacionesEstadoBodega,
} from "./estado-bodega/services/estado-bodega.service";

export { mapEstadoBodegaLayout } from "./estado-bodega/utils/estado-bodega-mapper";

export { BodegaOperacionTabs } from "./shared/components/BodegaOperacionTabs";
export type { BodegaOperacionTab } from "./shared/components/BodegaOperacionTabs";
export { EstadoBodegaPageContent } from "./estado-bodega/components/EstadoBodegaPageContent";
export { BodegaReportesPageContent } from "./bodega-reportes/components/BodegaReportesPageContent";
