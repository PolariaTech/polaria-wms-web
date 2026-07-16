import { describe, expect, it } from "vitest";
import { WmsRol } from "@/constants/wms/roles";
import {
  getUsuarioAsignacionLabel,
  getUsuarioAsignacionTipo,
  USUARIO_ASIGNACION_POR_ROL,
} from "./usuario-rol-asignacion";

describe("usuario-rol-asignacion", () => {
  it("mapea roles de bodega a selector de bodega", () => {
    expect(getUsuarioAsignacionTipo(WmsRol.custodio)).toBe("bodega");
    expect(getUsuarioAsignacionTipo(WmsRol.procesador)).toBe("bodega");
    expect(getUsuarioAsignacionLabel(WmsRol.jefe_bodega)).toBe("Bodega");
  });

  it("mapea administrador de cuenta a select de cuenta", () => {
    expect(getUsuarioAsignacionTipo(WmsRol.administrador_cuenta)).toBe("cuenta");
    expect(getUsuarioAsignacionLabel(WmsRol.administrador_cuenta)).toBe("Cuenta");
  });

  it("mapea configurador a administrativo y operador a cuenta", () => {
    expect(USUARIO_ASIGNACION_POR_ROL[WmsRol.configurador]).toBe("administrativo");
    expect(USUARIO_ASIGNACION_POR_ROL[WmsRol.operador_cuenta]).toBe("cuenta");
    expect(getUsuarioAsignacionLabel(WmsRol.operador_cuenta)).toBe("Cuenta");
  });

  it("mapea transportista a selector de bodega", () => {
    expect(getUsuarioAsignacionTipo(WmsRol.transportista)).toBe("bodega");
    expect(getUsuarioAsignacionLabel(WmsRol.transportista)).toBe("Bodega");
  });
});
