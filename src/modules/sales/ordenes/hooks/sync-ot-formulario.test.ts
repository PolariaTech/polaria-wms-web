import { describe, expect, it } from "vitest";
import {
  aplicarCabeceraFormAOrdenesTrabajo,
  aplicarCabeceraFormARenglonActivo,
  aplicarCabeceraOvARenglonHermano,
} from "./sync-ot-cabecera-renglon";
import { cabeceraOtDesdeHija } from "./cabecera-ot-desde-hija";
import type {
  OrdenTrabajoHija,
  OrigenCorreoRenglon,
} from "../utils/origen/origen-correo-ordenes-trabajo";

/**
 * useSyncOtFormulario delega la cabecera a sync-ot-cabecera-renglon (REQ-281).
 * Aquí se valida el contrato vacío-gana que el hook aplica al sync.
 */
describe("sync-ot-formulario / contrato cabecera (REQ-281)", () => {
  const row: OrigenCorreoRenglon = {
    Producto: "X",
    Cantidad: 1,
    Unidad: "KGS",
    "Notas generales": "viejas",
    "Telefono contacto": "111",
  };

  it("el sync de OT activa acepta vacío del form", () => {
    const next = aplicarCabeceraFormARenglonActivo(row, {
      almacen: "",
      numeroPedido: "",
      fecha: "",
      responsableExterno: "",
      telefonoOt: "",
      correoOt: "",
      direccionOt: "",
      andenOt: "",
      ventanaDesdeOt: "",
      ventanaHastaOt: "",
      notasOt: "",
      prioridadOt: "",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
  });

  it("el sync a OT hermanas acepta vacío de cabecera OV", () => {
    const next = aplicarCabeceraOvARenglonHermano(row, {
      notasOt: "",
      direccionOt: "Nueva",
      telefonoOt: "",
      correoOt: "",
      responsableExterno: "Beto",
    });
    expect(next["Notas generales"]).toBe("");
    expect(next["Telefono contacto"]).toBe("");
    expect(next["Direccion entrega"]).toBe("Nueva");
    expect(next["Responsable externo"]).toBe("Beto");
  });
});

function hijaPager(
  id: string,
  almacen: string,
  fecha: string,
): OrdenTrabajoHija {
  return {
    id,
    label: almacen,
    numeroPedido: `OC-${id}`,
    almacen,
    referenciaPedido: "",
    fecha,
    responsableExterno: "",
    renglones: [
      {
        Producto: "X",
        Cantidad: 1,
        Unidad: "KGS",
        Almacen: almacen,
        Fecha: fecha,
      },
    ],
    totalCantidad: 1,
  };
}

const cabeceraDesdeCentro = (
  centroConsumo: string,
  fechaEntrega: string,
) => ({
  almacen: centroConsumo,
  numeroPedido: "",
  fecha: fechaEntrega,
  responsableExterno: "",
  telefonoOt: "",
  correoOt: "",
  direccionOt: "",
  andenOt: "",
  ventanaDesdeOt: "",
  ventanaHastaOt: "",
  notasOt: "",
  prioridadOt: "",
});

describe("sync-ot-formulario / pager REQ-374", () => {
  it("sin hidratar entre páginas contamina el centro de la OT intermedia", () => {
    const centroConsumoEstancado = "COCINA A";
    let hijas = [
      hijaPager("ot-a", "COCINA A", "2026-01-01"),
      hijaPager("ot-b", "COCINA B", "2026-02-01"),
      hijaPager("ot-c", "COCINA C", "2026-03-01"),
    ];
    // A → B: sync A, NO hidratar B
    hijas = aplicarCabeceraFormAOrdenesTrabajo(
      hijas,
      "ot-a",
      cabeceraDesdeCentro(centroConsumoEstancado, "2026-01-01"),
      { propagarFechaOv: false },
    );
    // B → C: sync B con centro todavía de A
    hijas = aplicarCabeceraFormAOrdenesTrabajo(
      hijas,
      "ot-b",
      cabeceraDesdeCentro(centroConsumoEstancado, "2026-01-01"),
      { propagarFechaOv: false },
    );
    expect(hijas[1]?.almacen).toBe("COCINA A");
  });

  it("con hidratar síncrono el ciclo A→B→C→A conserva centros distintos", () => {
    let centroConsumo = "COCINA A";
    let paginaActiva = 0;
    let hijas = [
      hijaPager("ot-a", "COCINA A", "2026-01-01"),
      hijaPager("ot-b", "COCINA B", "2026-02-01"),
      hijaPager("ot-c", "COCINA C", "2026-03-01"),
    ];
    const irA = (targetId: string, pageIndex: number) => {
      const activa = hijas[paginaActiva];
      hijas = aplicarCabeceraFormAOrdenesTrabajo(
        hijas,
        activa!.id,
        cabeceraDesdeCentro(centroConsumo, activa!.fecha),
        { propagarFechaOv: false },
      );
      paginaActiva = pageIndex;
      centroConsumo = cabeceraOtDesdeHija(hijas[pageIndex]!).almacen;
      expect(hijas[pageIndex]?.id).toBe(targetId);
    };
    irA("ot-b", 1);
    expect(centroConsumo).toBe("COCINA B");
    irA("ot-c", 2);
    expect(centroConsumo).toBe("COCINA C");
    irA("ot-a", 0);
    expect(centroConsumo).toBe("COCINA A");
    expect(hijas.map((h) => h.almacen)).toEqual([
      "COCINA A",
      "COCINA B",
      "COCINA C",
    ]);
  });
});
