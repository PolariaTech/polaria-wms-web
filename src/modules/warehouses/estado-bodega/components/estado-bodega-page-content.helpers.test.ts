import { describe, expect, it } from "vitest";
import type { EstadoBodegaSectionView } from "../types/estado-bodega.types";
import type { EstadoBodegaZoneOperativoData } from "../services/estado-bodega-zone-operativo.service";
import { enrichSectionsWithZoneCounts } from "./estado-bodega-page-content.helpers";

const section = { id: "entrada", alertCount: 0, pendingTaskCount: 0 } as unknown as EstadoBodegaSectionView;

describe("estado-bodega-page-content.helpers", () => {
  it("deja los contadores en cero sin datos operativos", () => {
    const [result] = enrichSectionsWithZoneCounts([section], null);
    expect(result).toMatchObject({ id: "entrada", alertCount: 0, pendingTaskCount: 0 });
  });

  it("no muta la sección original", () => {
    const data = { alertasBySection: {}, tareasBySection: {} } as unknown as EstadoBodegaZoneOperativoData;
    const [result] = enrichSectionsWithZoneCounts([section], data);
    expect(result).not.toBe(section);
  });
});
