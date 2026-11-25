import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { OrdenVentaOperadorRow } from "../../../shared/types/sales.types";
import { buildOperadorOrdenesVentaColumns } from "./build-operador-ordenes-venta-columns";

function rowBase(
  partial: Partial<OrdenVentaOperadorRow> = {},
): OrdenVentaOperadorRow {
  return {
    idOrdenVenta: "id-1",
    venta: "OV-1",
    occ: "—",
    occTodas: [],
    cuenta: "c",
    comprador: "Cliente",
    productos: "1 producto",
    cantidadKg: 1,
    total: 1,
    estado: "por_confirmar",
    fecha: "2026-11-12",
    fechaEntrega: "2026-11-12",
    ordenesTrabajo: 1,
    destino: "—",
    idBodega: "b",
    idBodegaDestino: null,
    slaStatus: "ok",
    alertaStatus: "ok",
    minutosEnEstado: 0,
    slaMinutos: 60,
    alertaMinutos: 45,
    ...partial,
  };
}

describe("buildOperadorOrdenesVentaColumns (REQ-180)", () => {
  it("ORDEN DE COMPRA: header en una línea y valor truncable", () => {
    const cols = buildOperadorOrdenesVentaColumns({
      inspect: false,
      cypherId: null,
      idsCorreoNoEnviado: new Set(),
      setDetalleId: vi.fn(),
      setCypherId: vi.fn(),
    });
    const occ = cols.find((c) => c.id === "occ");
    expect(occ?.header).toBe("Orden de compra");
    expect(occ?.headerClassName).toContain("whitespace-nowrap");
    expect(occ?.headerClassName).toContain("truncate");

    const { container } = render(
      <>
        {occ?.cell(
          rowBase({ occ: "ADP-261116-0033-JVU-MUY-LARGA" }),
        )}
      </>,
    );
    expect(container.querySelector(".truncate")).toHaveTextContent(
      "ADP-261116-0033-JVU-MUY-LARGA",
    );
    expect(container.querySelector(".whitespace-nowrap")).toBeTruthy();
  });

  it("incluye columna OV y acciones fuera de inspect", () => {
    const cols = buildOperadorOrdenesVentaColumns({
      inspect: false,
      cypherId: null,
      idsCorreoNoEnviado: new Set(),
      setDetalleId: vi.fn(),
      setCypherId: vi.fn(),
    });
    expect(cols.map((c) => c.id)).toEqual([
      "venta",
      "occ",
      "comprador",
      "estado",
      "fecha",
      "ot",
      "acciones",
    ]);
  });

  it("REQ-338: en Tareas solo el número si el correo no está partido", () => {
    const cols = buildOperadorOrdenesVentaColumns({
      inspect: false,
      cypherId: null,
      idsCorreoNoEnviado: new Set(),
      setDetalleId: vi.fn(),
      setCypherId: vi.fn(),
    });
    const ot = cols.find((c) => c.id === "ot");
    const { container } = render(<>{ot?.cell(rowBase())}</>);
    expect(container).toHaveTextContent("1");
    expect(container.querySelector("[aria-label]")).toBeNull();
  });

  it("REQ-338: en Tareas el número + aviso con IDs de las otras OV", () => {
    const cols = buildOperadorOrdenesVentaColumns({
      inspect: false,
      cypherId: null,
      idsCorreoNoEnviado: new Set(),
      setDetalleId: vi.fn(),
      setCypherId: vi.fn(),
    });
    const ot = cols.find((c) => c.id === "ot");
    render(
      <>
        {ot?.cell(
          rowBase({
            correoPartido: true,
            correoPartidoDe: ["OV-00001883", "OV-00001884"],
          }),
        )}
      </>,
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    const tip = screen.getByLabelText(/se partió en 3 OV/);
    expect(tip).toHaveAttribute(
      "title",
      expect.stringContaining("OV-00001883, OV-00001884"),
    );
  });
});
