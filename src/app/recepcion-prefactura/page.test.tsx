import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RecepcionPrefacturaPage from "./page";

describe("RecepcionPrefacturaPage", () => {
  it("pide el código si el enlace no trae empresa, OV y OT", async () => {
    render(await RecepcionPrefacturaPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText("Escanea el código de la prefactura.")).toBeTruthy();
  });

  it("muestra empresa, cliente, OT y centro de consumo en datos separados", async () => {
    render(
      await RecepcionPrefacturaPage({
        searchParams: Promise.resolve({
          empresa: "Y9IHZ",
          ov: "OV-1",
          ot: "ot-2",
          nombre: "Aguacates de puebla",
          cliente: "Hotel Chicome",
          otn: "4500140182",
          ott: "3",
          centro: "Cantina",
        }),
      }),
    );
    expect(screen.getByText("Aguacates de puebla")).toBeTruthy();
    expect(screen.getByText("Hotel Chicome")).toBeTruthy();
    expect(screen.getByText("4500140182")).toBeTruthy();
    expect(screen.getByText("Cantina")).toBeTruthy();
    expect(screen.queryByText("Y9IHZ · OV-1 · ot-2")).toBeNull();
  });
});
