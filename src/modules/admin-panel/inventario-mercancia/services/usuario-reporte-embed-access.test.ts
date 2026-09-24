import { describe, expect, it } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import {
  canBypassReporteEmbedGrants,
  canManageReporteEmbedPermisos,
  filterReportesEmbedForViewer,
  usuarioHasReporteEmbedGrant,
} from "./usuario-reporte-embed-access";

const REPORTS = [
  { idCuentaReporteEmbed: "rep-a" },
  { idCuentaReporteEmbed: "rep-b" },
];

describe("usuario-reporte-embed-access", () => {
  it("el admin de cuenta gestiona permisos; el operador no", () => {
    expect(canManageReporteEmbedPermisos(WmsRol.administrador_cuenta)).toBe(
      true,
    );
    expect(canManageReporteEmbedPermisos(WmsRol.operador_cuenta)).toBe(false);
    expect(canManageReporteEmbedPermisos(WmsRol.configurador)).toBe(false);
  });

  it("admin y configurador ven todos los reportes de la cuenta", () => {
    expect(
      filterReportesEmbedForViewer(REPORTS, [], WmsRol.administrador_cuenta),
    ).toEqual(REPORTS);
    expect(
      filterReportesEmbedForViewer(REPORTS, ["rep-a"], WmsRol.configurador),
    ).toEqual(REPORTS);
    expect(canBypassReporteEmbedGrants(WmsRol.operador_cuenta)).toBe(false);
  });

  it("el operador solo ve los reportes que le asignaron", () => {
    expect(
      filterReportesEmbedForViewer(
        REPORTS,
        ["rep-b"],
        WmsRol.operador_cuenta,
      ),
    ).toEqual([{ idCuentaReporteEmbed: "rep-b" }]);
    expect(
      filterReportesEmbedForViewer(REPORTS, [], WmsRol.operador_cuenta),
    ).toEqual([]);
  });

  it("el mint respeta el grant del operador", () => {
    expect(
      usuarioHasReporteEmbedGrant("rep-a", ["rep-a"], WmsRol.operador_cuenta),
    ).toBe(true);
    expect(
      usuarioHasReporteEmbedGrant("rep-a", ["rep-b"], WmsRol.operador_cuenta),
    ).toBe(false);
    expect(
      usuarioHasReporteEmbedGrant("rep-a", [], WmsRol.administrador_cuenta),
    ).toBe(true);
  });
});
