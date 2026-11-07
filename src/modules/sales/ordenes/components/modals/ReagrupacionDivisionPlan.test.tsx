import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReagrupacionDivisionPlan } from "./ReagrupacionDivisionPlan";

describe("ReagrupacionDivisionPlan (REQ-262)", () => {
  it("por orden de compra: dice con texto cuál se queda y cuáles pasan a órdenes nuevas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "oc",
          valoresSalen: ["4502988746", "4502990001"],
          valoresQuedan: ["4502988065"],
          otIdsQueSalen: ["ot-2", "ot-3"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "La orden se divide en 3 órdenes de venta" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/una orden de venta nueva por cada orden de compra/)).toBeInTheDocument();
    const seQueda = screen.getByText("Se queda en esta orden").closest("div")!;
    expect(within(seQueda).getByText("Orden de compra 4502988065")).toBeInTheDocument();
    const pasan = screen.getByText(/Pasan a órdenes de venta nuevas/).closest("div")!;
    expect(within(pasan).getByText("Orden de compra 4502988746")).toBeInTheDocument();
    expect(within(pasan).getByText("Orden de compra 4502990001")).toBeInTheDocument();
  });

  it("por día de entrega: muestra cada día como DD-MM-AAAA", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "dia",
          valoresSalen: ["2026-11-08"],
          valoresQuedan: ["2026-11-07"],
          otIdsQueSalen: ["ot-2"],
        }}
      />,
    );

    expect(screen.getByText(/por cada día de entrega/)).toBeInTheDocument();
    expect(screen.getByText("Entrega del 07-11-2026")).toBeInTheDocument();
    expect(screen.getByText("Entrega del 08-11-2026")).toBeInTheDocument();
    expect(screen.queryByText(/2026-11-0/)).not.toBeInTheDocument();
  });

  it("por horario de entrega: muestra cada horario tal como viene", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "horario",
          valoresSalen: ["14:00 - 16:00"],
          valoresQuedan: ["06:00 - 08:00"],
          otIdsQueSalen: ["ot-2"],
        }}
      />,
    );

    expect(screen.getByText(/por cada horario de entrega/)).toBeInTheDocument();
    expect(screen.getByText("Entrega en el horario 06:00 - 08:00")).toBeInTheDocument();
    expect(screen.getByText("Entrega en el horario 14:00 - 16:00")).toBeInTheDocument();
  });

  it("si se quedan varios valores siguen juntos: no cuentan como órdenes de venta distintas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "oc",
          valoresSalen: ["C"],
          valoresQuedan: ["A", "B"],
          otIdsQueSalen: ["ot-3"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "La orden se divide en 2 órdenes de venta" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Lo que se queda sigue junto en esta orden/)).toBeInTheDocument();
    expect(screen.getByText("Orden de compra A")).toBeInTheDocument();
    expect(screen.getByText("Orden de compra B")).toBeInTheDocument();
  });

  it("avisa de que se divide lo guardado y que conviene guardar antes de confirmar", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{ criterio: "oc", valoresSalen: ["B"], valoresQuedan: ["A"], otIdsQueSalen: [] }}
      />,
    );

    expect(screen.getByText(/Se divide lo que ya está guardado/)).toBeInTheDocument();
  });

  it("no muestra identificadores internos de las tareas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "oc",
          valoresSalen: ["B"],
          valoresQuedan: ["A"],
          otIdsQueSalen: ["pedido:b|almacen:cocina"],
        }}
      />,
    );

    expect(screen.queryByText(/pedido:b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/almacen:/)).not.toBeInTheDocument();
  });

  it("muestra el texto como texto, nunca como HTML", () => {
    const { container } = render(
      <ReagrupacionDivisionPlan
        division={{
          criterio: "oc",
          valoresSalen: ["<img src=x>"],
          valoresQuedan: ["A"],
          otIdsQueSalen: [],
        }}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Orden de compra <img src=x>")).toBeInTheDocument();
  });
});
