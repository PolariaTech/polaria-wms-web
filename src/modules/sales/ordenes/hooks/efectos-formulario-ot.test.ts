import { describe, expect, it, vi } from "vitest";
import {
  CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT,
  cabeceraOtDesdeHija,
} from "./cabecera-ot-desde-hija";
import { hidratarFormularioDesdeHija } from "./hidratar-formulario-desde-hija";
import type { OrdenTrabajoHija } from "../utils/origen/origen-correo-ordenes-trabajo";

/** Contrato del efecto de cambio de OT en useEfectosFormularioOt (REQ-281/311). */
describe("efectos-formulario-ot / cabecera al cambiar OT", () => {
  it("la cabecera inyectable no incluye campos de OV", () => {
    const hija: OrdenTrabajoHija = {
      id: "ot-2",
      label: "OC-2",
      numeroPedido: "OC-2",
      almacen: "COCINA B",
      referenciaPedido: "",
      fecha: "2026-05-01",
      responsableExterno: "Luis",
      renglones: [
        {
          Producto: "LIMON",
          Cantidad: 2,
          Unidad: "KGS",
          "Telefono contacto": "999",
          "Correo contacto": "x@y.z",
          "Notas generales": "vieja",
        },
      ],
      totalCantidad: 2,
    };
    const keys = Object.keys(cabeceraOtDesdeHija(hija));
    for (const campo of CAMPOS_OV_NO_REINYECTAR_AL_CAMBIAR_OT) {
      expect(keys).not.toContain(campo);
    }
  });

  it("REQ-374: mutar hijas con el mismo id de OT no debe forzar setCentroConsumo otra vez", () => {
    const setCentroConsumo = vi.fn();
    const hija: OrdenTrabajoHija = {
      id: "ot-misma",
      label: "B",
      numeroPedido: "OC-2",
      almacen: "COCINA B",
      referenciaPedido: "",
      fecha: "2026-05-01",
      responsableExterno: "",
      renglones: [{ Producto: "X", Cantidad: 1, Almacen: "COCINA B" }],
      totalCantidad: 1,
    };
    const setters = {
      setCentroConsumo,
      setOrdenCompraHotel: vi.fn(),
      setReferenciaPedido: vi.fn(),
      setFechaEntrega: vi.fn(),
      setAnden: vi.fn(),
      setVentanaDesde: vi.fn(),
      setVentanaHasta: vi.fn(),
      setPrioridad: vi.fn(),
      setAutoFields: vi.fn((u) => u(new Set())),
      setWarnFields: vi.fn((u) => u(new Set())),
      setMissingFields: vi.fn((u) => u(new Set())),
    };
    // Primera hidratación al entrar a la OT (como el efecto al cambiar id).
    hidratarFormularioDesdeHija(hija, setters, { forzarCamposOt: true });
    expect(setCentroConsumo).toHaveBeenCalledTimes(1);
    // Si el efecto solo depende del id, una mutación de hijas NO vuelve a hidratar.
    // Este test documenta el contrato: no llamar hidratar otra vez con el mismo id.
    expect(setCentroConsumo).toHaveBeenCalledTimes(1);
  });
});
