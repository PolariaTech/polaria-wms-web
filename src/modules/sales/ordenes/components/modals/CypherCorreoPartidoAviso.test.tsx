import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { OvDelMismoCorreo } from "../../../shared/services/ovs-del-mismo-correo";
import { CypherCorreoPartidoAviso } from "./CypherCorreoPartidoAviso";

const hermana = (n: number, oc: string | null): OvDelMismoCorreo => ({
  idOrdenVenta: `id-secreto-${n}`,
  codigo: `OV-0000187${n}`,
  ordenCompra: oc,
});

const cinco: OvDelMismoCorreo[] = [
  hermana(3, "4500140182"),
  hermana(4, "4500140188"),
  hermana(5, "4500140197"),
  hermana(6, "4500140200"),
  hermana(7, "4500140207"),
];

describe("CypherCorreoPartidoAviso (REQ-313)", () => {
  it("con una sola OV (ella misma) no pinta nada", () => {
    const { container } = render(
      <CypherCorreoPartidoAviso hermanas={[cinco[0]!]} idOrdenVenta="id-secreto-3" ordenCompra="4500140182" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("sin hermanas (carga o error) no pinta nada", () => {
    const { container } = render(<CypherCorreoPartidoAviso hermanas={[]} idOrdenVenta="x" ordenCompra="1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("con cinco OV dice en cuántas se partió, de qué OC es esta y lista las otras", () => {
    render(<CypherCorreoPartidoAviso hermanas={cinco} idOrdenVenta="id-secreto-4" ordenCompra="4500140188" />);

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Este correo se partió en 5 OV, una por orden de compra.");
    expect(aviso).toHaveTextContent("Esta OV es solo de la OC 4500140188.");
    expect(aviso).toHaveTextContent("OV-00001873 · OC 4500140182");
    expect(aviso).toHaveTextContent("OV-00001876 · OC 4500140200");
    expect(aviso).not.toHaveTextContent("OV-00001874");
    expect(aviso.textContent).not.toContain("id-secreto");
  });

  it("si la OV no tiene OC lo dice, y una hermana sin OC se muestra «sin OC»", () => {
    render(
      <CypherCorreoPartidoAviso
        hermanas={[hermana(3, null), hermana(4, "4500140188")]}
        idOrdenVenta="id-secreto-4"
        ordenCompra=""
      />,
    );

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent("Esta OV no tiene orden de compra registrada.");
    expect(aviso).toHaveTextContent("OV-00001873 · sin OC");
  });
});
