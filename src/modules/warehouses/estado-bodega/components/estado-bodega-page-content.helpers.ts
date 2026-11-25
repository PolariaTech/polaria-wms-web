import type { EstadoBodegaSectionView } from "../types/estado-bodega.types";
import type { EstadoBodegaSectionId } from "../constants/estado-bodega-layout";
import type { EstadoBodegaZonePanelKind } from "../constants/estado-bodega-zone-panel";
import { countPanelItems } from "../utils/estado-bodega-zone-operativo";
import type { EstadoBodegaZoneOperativoData } from "../services/estado-bodega-zone-operativo.service";

export interface ZonePanelState {
  kind: EstadoBodegaZonePanelKind;
  sectionId: EstadoBodegaSectionId;
}

export function enrichSectionsWithZoneCounts(
  sections: EstadoBodegaSectionView[],
  zoneOperativo: EstadoBodegaZoneOperativoData | null,
): EstadoBodegaSectionView[] {
  return sections.map((section) => ({
    ...section,
    alertCount: countPanelItems(
      zoneOperativo?.alertasBySection[section.id] ?? [],
    ),
    pendingTaskCount: countPanelItems(
      zoneOperativo?.tareasBySection[section.id] ?? [],
    ),
  }));
}
