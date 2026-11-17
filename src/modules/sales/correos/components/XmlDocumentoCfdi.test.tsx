import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usuario } from "../testing/correos.fixtures";
import { CuerpoXmlAdjunto } from "./XmlDocumentoCfdi";

const CFDI =
  '<?xml version="1.0"?>' +
  '<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Folio="981" ' +
  'Fecha="2026-11-17T08:51:54" TipoDeComprobante="E" Moneda="MXN" SubTotal="1460.00" Total="1693.60">' +
  '<cfdi:Emisor Rfc="AAP010101AAA" Nombre="AGUACATES DE PUEBLA"/>' +
  '<cfdi:Receptor Rfc="HIL010101BBB" Nombre="Adolfo Rueda"/>' +
  '<cfdi:Conceptos>' +
  '<cfdi:Concepto Descripcion="FRAMBUESAS" Cantidad="5.000000" Importe="1460.00"/>' +
  "</cfdi:Conceptos></cfdi:Comprobante>";

describe("CuerpoXmlAdjunto", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => vi.useRealTimers());

  it("muestra un CFDI como documento, no como fuente", () => {
    render(<CuerpoXmlAdjunto texto={CFDI} />);
    expect(screen.getByText("Nota de crédito")).toBeInTheDocument();
    expect(screen.getByText("Folio 981")).toBeInTheDocument();
    expect(screen.getByText("AGUACATES DE PUEBLA")).toBeInTheDocument();
    expect(screen.getByText("FRAMBUESAS")).toBeInTheDocument();
    expect(screen.queryByText(/cfdi:Comprobante/)).not.toBeInTheDocument();
  });

  it("permite ver el XML y volver al documento", async () => {
    const usr = usuario();
    render(<CuerpoXmlAdjunto texto={CFDI} />);
    await usr.click(screen.getByRole("button", { name: "Ver XML" }));
    expect(screen.getByText(/cfdi:Comprobante/)).toBeInTheDocument();
    await usr.click(screen.getByRole("button", { name: "Ver documento" }));
    expect(screen.getByText("Folio 981")).toBeInTheDocument();
  });

  it("un XML que no es CFDI se ve indentado", () => {
    render(<CuerpoXmlAdjunto texto={'<Pedido id="1"/>'} />);
    expect(screen.getByText('<Pedido id="1"/>')).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver XML" })).not.toBeInTheDocument();
  });

  it("Ver XML se lee sobre el papel claro y también en oscuro", async () => {
    const usr = usuario();
    render(<CuerpoXmlAdjunto texto={CFDI} />);
    const verXml = screen.getByRole("button", { name: "Ver XML" });
    expect(verXml.className).toContain("bg-[#009e8f]");
    expect(verXml.className).toContain("text-white");
    expect(verXml.className).not.toMatch(/polaria-text-/);

    await usr.click(screen.getByRole("button", { name: "Usar modo oscuro de Polaria" }));
    expect(screen.getByRole("button", { name: "Ver XML" }).className).toContain("text-[#00e5cc]");
    expect(screen.getByRole("button", { name: "Usar fondo claro" })).toBeInTheDocument();
  });
});
