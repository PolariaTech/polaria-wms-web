import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  OrdenVentaDetalleDiaSemana,
  OrdenVentaDetalleIdentidadCliente,
} from "./OrdenVentaDetalleIdentidadCliente";
import type { OrdenVentaDetalleRow } from "../../../shared/types/sales.types";

describe("OrdenVentaDetalleIdentidadCliente (REQ-259)", () => {
  it("muestra código, denominación comercial y RFC", () => {
    const orden = {
      comprador_codigo: "105001175",
      comprador_apodo: "SLS PLAYA MUJERES",
      comprador_rfc: "CPM850101ABC",
    } as OrdenVentaDetalleRow;

    render(
      <OrdenVentaDetalleIdentidadCliente
        orden={orden}
        clienteNombre="CONTROLADORA PM"
      />,
    );

    expect(screen.getByText("RFC")).toBeInTheDocument();
    expect(screen.getByText("CPM850101ABC")).toBeInTheDocument();
    expect(screen.getByText("105001175")).toBeInTheDocument();
    expect(screen.getByText("SLS PLAYA MUJERES")).toBeInTheDocument();
  });
});

describe("OrdenVentaDetalleDiaSemana (REQ-257)", () => {
  it("muestra el día de la semana de la fecha de entrega", () => {
    render(<OrdenVentaDetalleDiaSemana fechaEntrega="2026-11-04" />);
    expect(screen.getByText("Día de la semana")).toBeInTheDocument();
    expect(screen.getByText("Miércoles")).toBeInTheDocument();
  });
});
