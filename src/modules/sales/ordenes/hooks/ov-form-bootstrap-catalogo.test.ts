import { describe, expect, it } from "vitest";
import type { CompradorListRow } from "@/modules/admin-panel";
import { catalogoDesdeBootstrap } from "./ov-form-bootstrap-catalogo";

const comprador = (id: string): CompradorListRow =>
  ({
    idComprador: id,
    codigo: id,
    comprador: id,
    apodo: "",
    denominacionComercialOverride: "",
    telefono: null,
    rfc: "",
    grupo: "",
    estaActivo: true,
  }) as CompradorListRow;

describe("catalogoDesdeBootstrap (REQ-326)", () => {
  it("prefiere el bootstrap cuando trae filas (evita catálogo vacío stale)", () => {
    const out = catalogoDesdeBootstrap(
      { compradores: [comprador("boot")], productos: [] },
      { compradores: [], productos: [] },
    );
    expect(out.compradores.map((row) => row.idComprador)).toEqual(["boot"]);
  });

  it("si el bootstrap viene vacío usa el fallback del estado", () => {
    const out = catalogoDesdeBootstrap(
      { compradores: [], productos: [] },
      { compradores: [comprador("estado")], productos: [] },
    );
    expect(out.compradores.map((row) => row.idComprador)).toEqual(["estado"]);
  });
});
