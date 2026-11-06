import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReagrupacionDivisionPlan } from "./ReagrupacionDivisionPlan";

describe("ReagrupacionDivisionPlan (REQ-262)", () => {
  it("dice con texto qué orden de compra se queda y cuáles pasan a órdenes nuevas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          ocSalen: ["4502988746", "4502990001"],
          ocQuedan: ["4502988065"],
          otIdsQueSalen: ["ot-2", "ot-3"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "La orden se divide en 3 órdenes de venta" }),
    ).toBeInTheDocument();
    const seQueda = screen.getByText("Se queda en esta orden").closest("div")!;
    expect(within(seQueda).getByText("Orden de compra 4502988065")).toBeInTheDocument();
    const pasan = screen
      .getByText(/Pasan a órdenes de venta nuevas/)
      .closest("div")!;
    expect(within(pasan).getByText("Orden de compra 4502988746")).toBeInTheDocument();
    expect(within(pasan).getByText("Orden de compra 4502990001")).toBeInTheDocument();
  });

  it("si se quedan varias OC siguen juntas: no cuentan como órdenes de venta distintas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{
          ocSalen: ["C"],
          ocQuedan: ["A", "B"],
          otIdsQueSalen: ["ot-3"],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "La orden se divide en 2 órdenes de venta" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Las que se quedan siguen juntas en esta orden/)).toBeInTheDocument();
    expect(screen.getByText("Orden de compra A")).toBeInTheDocument();
    expect(screen.getByText("Orden de compra B")).toBeInTheDocument();
  });

  it("avisa de que se divide lo guardado y que conviene guardar antes de confirmar", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{ ocSalen: ["B"], ocQuedan: ["A"], otIdsQueSalen: [] }}
      />,
    );

    expect(screen.getByText(/Se divide lo que ya está guardado/)).toBeInTheDocument();
  });

  it("no muestra identificadores internos de las tareas", () => {
    render(
      <ReagrupacionDivisionPlan
        division={{ ocSalen: ["B"], ocQuedan: ["A"], otIdsQueSalen: ["pedido:b|almacen:cocina"] }}
      />,
    );

    expect(screen.queryByText(/pedido:b/)).not.toBeInTheDocument();
    expect(screen.queryByText(/almacen:/)).not.toBeInTheDocument();
  });

  it("muestra el texto de la orden de compra como texto, nunca como HTML", () => {
    const { container } = render(
      <ReagrupacionDivisionPlan
        division={{ ocSalen: ["<img src=x>"], ocQuedan: ["A"], otIdsQueSalen: [] }}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("Orden de compra <img src=x>")).toBeInTheDocument();
  });
});
